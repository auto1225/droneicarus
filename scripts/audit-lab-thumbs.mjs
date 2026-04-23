// scripts/audit-lab-thumbs.mjs — verify each lab item can produce a real
// preview thumbnail. Deletes items whose preview source is unrenderable.
//
// Logic per item (matches lab-preview.jsx pickSource):
//   - GitHub repo  → assume opengraph.githubassets.com always works
//   - YouTube      → already filtered by audit-lab-urls.mjs
//   - PDF document → image.thum.io/get/width/480/pdfSource/{url}, must be > 5KB
//   - HTML page    → image.thum.io/get/width/480/{url}, must be > 5KB
// Anything failing both → delete.
//
// DELETE_DEAD=1 to actually purge; otherwise dry-run.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

const MIN_BYTES = 5000;       // images smaller than 5KB = thum.io error placeholder
const FETCH_TIMEOUT = 30000;  // 30s per URL — thum.io can be slow on first render

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

async function thumbSize(thumbUrl) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    const r = await fetch(thumbUrl, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return 0;
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return 0;
    const buf = await r.arrayBuffer();
    return buf.byteLength;
  } catch { return 0; }
}

(async () => {
  const items = await sb('/rest/v1/lab_items?select=id,subsection,title,external_url,document_url,document_type&status=eq.approved&limit=2000');
  console.log(`[thumb-audit] checking ${items.length} items`);
  const dead = [];
  let i = 0, skipped = 0;
  for (const it of items) {
    i++;
    // Skip GitHub + YouTube — they have reliable thumbnail sources already
    if (it.external_url && /github\.com\/[^/]+\/[^/?#]+/.test(it.external_url)) { skipped++; continue; }
    if (it.document_type === 'youtube') { skipped++; continue; }

    let thumbUrl;
    if (it.document_type === 'pdf' && it.document_url) {
      thumbUrl = `https://image.thum.io/get/width/480/pdfSource/${it.document_url}`;
    } else if (it.external_url) {
      thumbUrl = `https://image.thum.io/get/width/480/${it.external_url}`;
    } else { continue; }

    const sz = await thumbSize(thumbUrl);
    const ok = sz >= MIN_BYTES;
    if (!ok) {
      dead.push(it);
      console.log(`  ✗ ${it.subsection.padEnd(8)} ${it.title.slice(0, 50).padEnd(50)} | ${sz}B`);
    }
    if (i % 50 === 0) console.log(`  ... ${i}/${items.length} (${dead.length} dead, ${skipped} skipped)`);
  }

  console.log(`\n[thumb-audit] DEAD: ${dead.length} / ${items.length} (skipped ${skipped} GH+YT)`);
  const bySection = {};
  for (const d of dead) bySection[d.subsection] = (bySection[d.subsection] || 0) + 1;
  for (const [s, n] of Object.entries(bySection)) console.log(`   ${s}: ${n}`);

  if (process.env.DELETE_DEAD === '1' && dead.length) {
    console.log('\n[thumb-audit] DELETE_DEAD=1 — purging…');
    // Batch in chunks of 100 ids to avoid URL length limits
    for (let k = 0; k < dead.length; k += 100) {
      const chunk = dead.slice(k, k + 100);
      const ids = chunk.map(d => `"${d.id}"`).join(',');
      await sb(`/rest/v1/lab_items?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    }
    console.log(`[thumb-audit] deleted ${dead.length} items`);
  } else {
    console.log('\n[thumb-audit] DRY RUN — set DELETE_DEAD=1 to delete');
  }
})();
