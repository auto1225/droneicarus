// scripts/enrich-thumbs-once.mjs
// Backfill cover_image_url for lab_items that currently use SVG placeholders.
// - Patents: scrape Google Patents page → D00000.png thumbnail
// - Papers (arXiv): scrape abstract page → og:image (or fall back to predicted thumb URL)
// - News: scrape source URL → og:image
//
// ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/enrich-thumbs-once.mjs

const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPA_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
}

const UA = 'Mozilla/5.0 (compatible; DroneicarusEnrich/1.0; +https://droneicarus.com)';

async function fetchHtml(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.text();
  } catch (_) { return null; }
  finally { clearTimeout(t); }
}

function extractPatentThumb(html) {
  if (!html) return null;
  const m1 = html.match(/<img[^>]+itemprop=["']thumbnail["'][^>]+src=["']([^"']+D00000\.png)["']/);
  if (m1) return m1[1];
  const m2 = html.match(/(https:\/\/patentimages\.storage\.googleapis\.com\/[a-f0-9/]+\/[A-Z0-9]+-\d{8}-D00000\.png)/);
  if (m2) return m2[1];
  return null;
}

function extractOgImage(html) {
  if (!html) return null;
  const m = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  return m ? m[1] : null;
}

function resolveUrl(maybeRel, base) {
  if (!maybeRel) return null;
  if (/^https?:\/\//i.test(maybeRel)) return maybeRel;
  if (maybeRel.startsWith('//')) return 'https:' + maybeRel;
  try { return new URL(maybeRel, base).toString(); } catch (_) { return null; }
}

async function enrichOne(row) {
  const url = row.external_url || row.document_url;
  if (!url) return { id: row.id, ok: false, reason: 'no url' };

  if (row.subsection === 'patents' || row.type === 'patent') {
    const html = await fetchHtml(url);
    const thumb = extractPatentThumb(html);
    if (thumb) return { id: row.id, ok: true, image: thumb, kind: 'patent-d00000' };
    return { id: row.id, ok: false, reason: 'no patent thumb' };
  }

  if (row.subsection === 'research' || row.type === 'paper') {
    const html = await fetchHtml(url);
    const og = extractOgImage(html);
    if (og) {
      const abs = resolveUrl(og, url);
      if (abs) return { id: row.id, ok: true, image: abs, kind: 'paper-og' };
    }
    return { id: row.id, ok: false, reason: 'no paper image' };
  }

  if (row.subsection === 'pulse' || row.type === 'news') {
    const html = await fetchHtml(url);
    const og = extractOgImage(html);
    const abs = resolveUrl(og, url);
    if (abs) return { id: row.id, ok: true, image: abs, kind: 'news-og' };
    return { id: row.id, ok: false, reason: 'no news og' };
  }

  const html = await fetchHtml(url);
  const og = extractOgImage(html);
  const abs = resolveUrl(og, url);
  if (abs) return { id: row.id, ok: true, image: abs, kind: 'generic-og' };
  return { id: row.id, ok: false, reason: 'no image' };
}

async function run() {
  console.log('[run] fetching candidate lab_items…');
  const subFilter = "subsection.in.(patents,research,pulse,hardware)";
  const imgFilter = "or=(cover_image_url.like.data:*,cover_image_url.is.null)";
  const sel = 'select=id,type,subsection,title,external_url,document_url';
  const rows = await sb(`/rest/v1/lab_items?${imgFilter}&${subFilter}&${sel}&limit=2000`);
  console.log(`[run] ${rows.length} rows to enrich`);

  let ok = 0, fail = 0, byKind = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const r = await enrichOne(row);
    if (r.ok && r.image) {
      try {
        await sb(`/rest/v1/lab_items?id=eq.${row.id}`, {
          method: 'PATCH',
          body: { cover_image_url: r.image },
          prefer: 'return=minimal',
        });
        ok++;
        byKind[r.kind] = (byKind[r.kind] || 0) + 1;
        if (i % 25 === 0) console.log(`[${i + 1}/${rows.length}] ✓ ${row.title.slice(0, 50)}`);
      } catch (e) {
        fail++;
        console.warn(`[${i + 1}/${rows.length}] update failed:`, e.message);
      }
    } else {
      fail++;
      if (i % 50 === 0) console.log(`[${i + 1}/${rows.length}] ✗ ${r.reason}: ${row.title.slice(0, 50)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n[done] ok=${ok} fail=${fail}`);
  console.log('[done] by kind:', byKind);
}

run().catch(e => { console.error('[fatal]', e); process.exit(1); });
