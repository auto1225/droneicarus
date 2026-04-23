// scripts/audit-lab-urls.mjs — HEAD-check every lab_item; delete dead ones.
// Logic per item:
//   1. document_type='youtube' → check YouTube oEmbed (404 = removed)
//   2. document_url present (pdf) → HEAD; non-2xx → fail
//   3. external_url present → HEAD; non-2xx → fail
//   4. anything failing → mark for deletion
// Set DELETE_DEAD=1 to actually delete, otherwise dry-run.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

async function checkYoutube(url) {
  const m = url.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|embed\/([\w-]{11})/);
  const id = m && (m[1] || m[2] || m[3]);
  if (!id) return false;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { method: 'GET' });
    return r.ok;
  } catch { return false; }
}

async function checkUrl(url, allowRedirect = true) {
  try {
    const r = await fetch(url, {
      method: 'HEAD', redirect: allowRedirect ? 'follow' : 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 droneicarus-bot' },
    });
    if (r.ok) return true;
    // Some servers reject HEAD; retry GET
    if (r.status === 405 || r.status === 403) {
      const r2 = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 droneicarus-bot' } });
      return r2.ok;
    }
    return false;
  } catch { return false; }
}

(async () => {
  const items = await sb('/rest/v1/lab_items?select=id,subsection,title,external_url,document_url,document_type&status=eq.approved&limit=2000');
  console.log(`[audit] checking ${items.length} items`);
  const dead = [];
  let i = 0;
  for (const it of items) {
    i++;
    let ok = false;
    let reason = '';
    if (it.document_type === 'youtube' && (it.document_url || it.external_url)) {
      ok = await checkYoutube(it.document_url || it.external_url);
      reason = ok ? '' : 'youtube unavailable';
    } else if (it.document_url) {
      ok = await checkUrl(it.document_url);
      reason = ok ? '' : 'document_url dead';
    } else if (it.external_url) {
      ok = await checkUrl(it.external_url);
      reason = ok ? '' : 'external_url dead';
    } else {
      ok = false; reason = 'no url';
    }
    if (!ok) {
      dead.push({ ...it, reason });
      console.log(`  ✗ ${it.subsection.padEnd(8)} ${it.title.slice(0, 50).padEnd(50)} | ${reason}`);
    }
    if (i % 50 === 0) console.log(`  ... ${i}/${items.length} checked, ${dead.length} dead so far`);
  }

  console.log(`\n[audit] DEAD: ${dead.length} / ${items.length}`);
  const bySection = {};
  for (const d of dead) bySection[d.subsection] = (bySection[d.subsection] || 0) + 1;
  for (const [s, n] of Object.entries(bySection)) console.log(`   ${s}: ${n}`);

  if (process.env.DELETE_DEAD === '1' && dead.length) {
    console.log('\n[audit] DELETE_DEAD=1 — purging…');
    const ids = dead.map(d => `"${d.id}"`).join(',');
    await sb(`/rest/v1/lab_items?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    console.log(`[audit] deleted ${dead.length} items`);
  } else {
    console.log('\n[audit] DRY RUN — set DELETE_DEAD=1 to actually delete');
  }
})();
