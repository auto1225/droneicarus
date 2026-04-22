// scripts/cleanup-unviewable.mjs — one-shot purge of lab_items / videos that
// have no playable / viewable URL. Safe to re-run.
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
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

(async () => {
  // --- lab_items: external_url is null AND document_url is null ---
  const orphans = await sb('/rest/v1/lab_items?select=id,subsection,title&external_url=is.null&document_url=is.null&limit=2000');
  console.log(`[cleanup] lab_items unviewable: ${orphans.length}`);
  for (const o of orphans) console.log('  -', o.subsection, '|', o.title);
  if (orphans.length) {
    const ids = orphans.map(o => `"${o.id}"`).join(',');
    await sb(`/rest/v1/lab_items?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    console.log(`[cleanup] deleted ${orphans.length} lab_items`);
  }

  // --- videos: youtube_id null AND yt_id null AND storage_path null AND external_url null ---
  const vorphans = await sb('/rest/v1/videos?select=id,title&youtube_id=is.null&yt_id=is.null&storage_path=is.null&external_url=is.null&limit=2000');
  console.log(`[cleanup] videos unplayable: ${vorphans.length}`);
  for (const v of vorphans) console.log('  -', v.title);
  if (vorphans.length) {
    const ids = vorphans.map(o => `"${o.id}"`).join(',');
    await sb(`/rest/v1/videos?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    console.log(`[cleanup] deleted ${vorphans.length} videos`);
  }

  console.log('[cleanup] DONE');
})();
