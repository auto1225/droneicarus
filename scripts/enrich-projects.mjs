// scripts/enrich-projects.mjs — backfill README excerpt for every projects lab_item
// Fetches each repo's README via GitHub API, extracts first 2 meaningful paragraphs
// (skips badges, headings, HTML), writes to lab_items.summary.
//
// env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (required)
//   GH_TOKEN                                  (required for API rate limits)

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE env'); process.exit(1); }

const ghHeaders = {
  'User-Agent': 'droneicarus-bot/1.0',
  'Accept': 'application/vnd.github.v3.raw',
};
if (GH_TOKEN) ghHeaders.Authorization = `Bearer ${GH_TOKEN}`;

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

function extractRepoFromUrl(url) {
  const m = String(url).match(/github\.com\/([^/]+)\/([^/?#]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

// Strip badges/HTML/headings, return first 2 prose paragraphs
function distillReadme(md) {
  if (!md) return '';
  let s = md
    .replace(/<!--[\s\S]*?-->/g, '')                 // HTML comments
    .replace(/<[^>]+>/g, '')                         // HTML tags
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')            // markdown images (often badges)
    .replace(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')         // [text](url) -> text
    .replace(/^[#=\-]+.*$/gm, '')                    // headings + setext underlines
    .replace(/^>\s+.*$/gm, '')                       // blockquotes
    .replace(/^[-*+]\s+/gm, '')                      // list bullets
    .replace(/^\s*\|.*\|\s*$/gm, '')                 // tables
    .replace(/`{3}[\s\S]*?`{3}/g, '')                // code fences
    .replace(/`([^`]+)`/g, '$1')                     // inline code
    .replace(/\*\*?([^*]+)\*\*?/g, '$1')             // bold/italic
    .replace(/\r/g, '');

  // Split into paragraphs (blank-line separated)
  const paras = s.split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length >= 30 && /[a-zA-Z]/.test(p) && !p.match(/^(badge|build|status|coverage|license)/i));
  return paras.slice(0, 2).join('\n\n').slice(0, 600);
}

(async () => {
  const items = await sb('/rest/v1/lab_items?subsection=eq.projects&select=id,title,external_url,summary&limit=500');
  console.log(`[enrich] ${items.length} projects to enrich`);
  let updated = 0, skipped = 0, failed = 0;

  for (const it of items) {
    const r = extractRepoFromUrl(it.external_url);
    if (!r) { skipped++; continue; }
    let readme = '';
    try {
      const res = await fetch(`https://api.github.com/repos/${r.owner}/${r.repo}/readme`, { headers: ghHeaders });
      if (res.ok) readme = await res.text();
      else if (res.status !== 404) console.warn(`  ${r.owner}/${r.repo} → ${res.status}`);
    } catch (e) { console.warn(`  ${r.owner}/${r.repo} err:`, e.message); }

    const distilled = distillReadme(readme);
    if (!distilled) { failed++; continue; }

    try {
      await sb(`/rest/v1/lab_items?id=eq.${encodeURIComponent(it.id)}`, {
        method: 'PATCH',
        body: { summary: distilled },
        prefer: 'return=minimal',
      });
      updated++;
      if (updated % 20 === 0) console.log(`  ... ${updated} updated`);
    } catch (e) { console.warn(`  patch err:`, e.message); failed++; }

    // Be polite to GitHub — 200ms between calls (5/sec, well under auth'd 5000/hr)
    await new Promise(rs => setTimeout(rs, 200));
  }

  console.log(`[enrich] DONE — updated:${updated} skipped:${skipped} failed:${failed}`);
})();
