// scripts/audit-lab-thumbs.mjs — verify image.thum.io can render HTML items.
// Skips:
//   - PDFs (image.thum.io/pdfSource always works for valid PDFs)
//   - GitHub repos (opengraph reliable)
//   - YouTube items (ytimg reliable)
// Only checks the small set of generic HTML external_url items (hardware, pulse).
// 8x parallel, 12s timeout, < 5KB returned image = unrenderable → delete.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

const MIN_BYTES = 5000;
const TIMEOUT_MS = 12000;
const CONCURRENCY = 8;

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

async function thumbBytes(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const r = await fetch(`https://image.thum.io/get/width/480/${url}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return 0;
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return 0;
    const buf = await r.arrayBuffer();
    return buf.byteLength;
  } catch { return 0; }
}

async function processQueue(items, fn, concurrency = CONCURRENCY) {
  const results = [];
  let idx = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}

(async () => {
  const all = await sb('/rest/v1/lab_items?select=id,subsection,title,external_url,document_url,document_type&status=eq.approved&limit=2000');
  const candidates = all.filter(it =>
    it.external_url
    && it.document_type !== 'pdf'
    && it.document_type !== 'youtube'
    && !/github\.com\/[^/]+\/[^/?#]+/.test(it.external_url)
  );
  console.log(`[thumb-audit] ${candidates.length} HTML items to check (skipped ${all.length - candidates.length} PDFs/GH/YT)`);

  const dead = [];
  let done = 0;
  await processQueue(candidates, async (it) => {
    const sz = await thumbBytes(it.external_url);
    done++;
    if (sz < MIN_BYTES) {
      dead.push({ ...it, sz });
      console.log(`  ✗ ${it.subsection.padEnd(8)} ${it.title.slice(0,50).padEnd(50)} | ${sz}B`);
    }
    if (done % 20 === 0) console.log(`  ... ${done}/${candidates.length}, dead so far ${dead.length}`);
  });

  console.log(`\n[thumb-audit] DEAD: ${dead.length} / ${candidates.length}`);
  const bySection = {};
  for (const d of dead) bySection[d.subsection] = (bySection[d.subsection] || 0) + 1;
  for (const [s, n] of Object.entries(bySection)) console.log(`   ${s}: ${n}`);

  if (process.env.DELETE_DEAD === '1' && dead.length) {
    for (let k = 0; k < dead.length; k += 100) {
      const chunk = dead.slice(k, k + 100);
      const ids = chunk.map(d => `"${d.id}"`).join(',');
      await sb(`/rest/v1/lab_items?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    }
    console.log(`[thumb-audit] deleted ${dead.length} items`);
  } else {
    console.log('\n[thumb-audit] DRY RUN — set DELETE_DEAD=1');
  }
})();
