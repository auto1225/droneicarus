// scripts/discover-patents.mjs — daily auto-ingest for Lab patents subsection
//
// Source: Google Patents XHR (https://patents.google.com/xhr/query?url=...)
//   - Zero-auth, public endpoint, global coverage (USPTO + EPO + KIPRIS + JP + CN + WO + etc.)
//   - Returns title, snippet, inventor, assignee, dates, PDF link, publication number
//
// Reads:
//   env SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  — required
//
// Skips items whose slug 'pat-{publication_number}' already exists.
// Writes lab_items rows with subsection='patents', type='patent'.
//
// Run from .github/workflows/discover-lab.yml (twice daily).

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

// ────────────────────────────────────────────────────────────────────────
// Patent queries — drone domain, sorted by latest patents first.
// Each query pulls up to NUM_PER_QUERY top results from Google Patents.
// ────────────────────────────────────────────────────────────────────────
const PATENT_QUERIES = [
  // Core systems
  ['drone navigation',                ['navigation','autonomous']],
  ['UAV obstacle avoidance',          ['obstacle-avoidance','autonomous']],
  ['quadcopter flight control',       ['firmware','autonomous']],
  ['drone swarm coordination',        ['swarm']],
  ['drone collision avoidance',       ['safety','autonomous']],
  ['VTOL aircraft',                   ['vtol','aerodynamics']],
  ['drone propulsion system',         ['propulsion']],
  // Hardware components
  ['drone gimbal stabilization',      ['gimbal','imaging']],
  ['UAV battery management',          ['power','battery']],
  ['drone motor design',              ['motor','propulsion']],
  ['UAV propeller blade',             ['propeller','aerodynamics']],
  ['drone landing gear',              ['hardware']],
  ['hydrogen fuel cell drone',        ['power','fuel-cell']],
  // Applications
  ['drone delivery package',          ['delivery']],
  ['agricultural drone spraying',     ['agriculture']],
  ['UAV mapping survey',              ['mapping']],
  ['drone inspection infrastructure', ['inspection']],
  ['drone search rescue',             ['emergency']],
  ['drone firefighting',              ['emergency']],
  ['precision agriculture UAV',       ['agriculture']],
  ['drone medical transport',         ['delivery','medical']],
  // Imaging
  ['drone camera lens',               ['imaging']],
  ['UAV thermal imaging',             ['imaging','thermal']],
  ['drone LiDAR scanner',             ['mapping','lidar']],
  ['aerial photography drone',        ['imaging']],
  // Communication & control
  ['drone remote control system',     ['firmware','radio']],
  ['UAV satellite communication',     ['radio']],
  ['drone GPS positioning',           ['gps','autonomous']],
  ['drone radio link',                ['radio']],
  // Safety / defense
  ['anti-drone system',               ['counter-drone','safety']],
  ['drone parachute recovery',        ['safety']],
  ['drone geofence',                  ['safety','firmware']],
  // Specialized
  ['FPV racing drone',                ['fpv','racing']],
  ['underwater drone hybrid',         ['underwater']],
  ['drone aerial manipulation arm',   ['manipulation']],
  ['drone wind tolerance',            ['aerodynamics']],
  ['solar powered drone',             ['power','solar']],
  ['fixed wing UAV',                  ['fixed-wing','aerodynamics']],
  ['drone tether power',              ['power','tethered']],
];

const NUM_PER_QUERY = 8;       // top-N results per query per run

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`Supabase ${opts.method || 'GET'} ${path} → ${res.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

async function fetchExistingSlugs() {
  const rows = await sb('/rest/v1/lab_items?subsection=eq.patents&select=slug&limit=10000');
  return new Set(rows.map(r => r.slug).filter(Boolean));
}

function decodeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function patentSvg(item) {
  const title = (item.title || '').slice(0, 100);
  const words = title.split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 28) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  const lns = lines.slice(0, 4);
  const inst = (item.institution || '').slice(0, 36);
  const esc = (s) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  // Plum / wine accent for patents — distinct from research blue & projects green
  const from = '#3a1f3a', to = '#1a0f1f', accent = '#b97a4d';
  // Stylized "patent seal" icon: ribbon + circle
  const seal = `<g transform="translate(440,80)" color="${accent}" opacity="0.25">
    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M50 18l8 16 18 2-14 12 4 18-16-10-16 10 4-18-14-12 18-2z" fill="currentColor" opacity="0.6"/>
    <path d="M30 90l20 22 20-22-12 6h-16z" fill="currentColor"/>
  </g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>
<rect width="640" height="360" fill="url(#g)"/>${seal}
<rect x="40" y="46" width="4" height="24" fill="${accent}"/>
<text x="56" y="64" fill="${accent}" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" letter-spacing="2">PATENT</text>
${lns.map((l,i) => `<text x="40" y="${160+44*i}" fill="#f5ede0" font-family="Inter Tight, Inter, sans-serif" font-size="26" font-weight="700">${esc(l)}</text>`).join('')}
<text x="40" y="${160+44*lns.length+28}" fill="#d1c8b5" font-family="Inter Tight, Inter, sans-serif" font-size="14" opacity="0.85">${esc(inst)}</text>
<text x="40" y="340" fill="#d1c8b5" font-family="'JetBrains Mono', monospace" font-size="10" opacity="0.5" letter-spacing="1.5">DRONEICARUS · LAB · PATENTS</text>
</svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

// ────────────────────────────────────────────────────────────────────────
// Google Patents fetcher
// ────────────────────────────────────────────────────────────────────────
async function fetchGooglePatents(query, num = NUM_PER_QUERY) {
  // url= param is double-encoded (q + sort)
  const inner = `q=${encodeURIComponent(query)}&num=${num}&sort=new`;
  const u = `https://patents.google.com/xhr/query?url=${encodeURIComponent(inner)}&exp=`;
  const r = await fetch(u, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!r.ok) throw new Error(`gp ${r.status}`);
  const j = await r.json();
  const cluster = j?.results?.cluster || [];
  const out = [];
  for (const c of cluster) {
    for (const it of (c.result || [])) {
      const p = it.patent;
      if (!p) continue;
      out.push(p);
    }
  }
  return out;
}

function buildItem(p, baseTags) {
  const pubNo = (p.publication_number || '').trim();
  if (!pubNo) return null;
  const slug = `pat-${pubNo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const title = decodeHtml(p.title).slice(0, 200);
  if (!title) return null;
  const snippet = decodeHtml(p.snippet).slice(0, 500);
  const country = pubNo.slice(0, 2).toUpperCase();
  const inventor = decodeHtml(p.inventor);
  const assignee = decodeHtml(p.assignee);
  const grantDate = (p.grant_date || p.publication_date || '').slice(0, 10) || null;
  const filingDate = (p.filing_date || '').slice(0, 10) || null;
  // Public Google Patents page (always works for any pub number)
  const externalUrl = `https://patents.google.com/patent/${pubNo}/en`;
  // PDF: GP serves at /pdf path — works for most patents
  const pdfUrl = p.pdf
    ? `https://patentimages.storage.googleapis.com/${p.pdf}`
    : null;
  const tags = [...new Set([...baseTags, country.toLowerCase()])].slice(0, 10);
  const item = {
    type: 'patent',
    subsection: 'patents',
    title,
    slug,
    summary: snippet || `${assignee ? assignee + '. ' : ''}Filed ${filingDate || '—'} · Granted ${grantDate || '—'} · ${country}`,
    external_url: externalUrl,
    document_url: pdfUrl,
    document_type: pdfUrl ? 'pdf' : null,
    authors: inventor ? inventor.split(/[,;]+/).map(s => s.trim()).filter(Boolean).slice(0, 6) : [],
    institution: assignee || country,
    published_at: grantDate,
    tags,
    status: 'approved',
  };
  item.cover_image_url = patentSvg(item);
  return item;
}

// ────────────────────────────────────────────────────────────────────────
// Main ingest
// ────────────────────────────────────────────────────────────────────────
async function ingestPatents(seenSlugs) {
  let inserted = 0, errors = 0;
  for (const [q, tags] of PATENT_QUERIES) {
    let patents;
    try {
      patents = await fetchGooglePatents(q, NUM_PER_QUERY);
    } catch (e) {
      console.warn(`  gp '${q}' err:`, e.message);
      errors++;
      continue;
    }
    let inserted_q = 0;
    for (const p of patents) {
      const item = buildItem(p, tags);
      if (!item) continue;
      if (seenSlugs.has(item.slug)) continue;
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: item, prefer: 'return=minimal' });
        seenSlugs.add(item.slug);
        inserted++;
        inserted_q++;
      } catch (e) {
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    if (inserted_q) console.log(`  + ${inserted_q.toString().padStart(2)} '${q}'`);
    // Be polite to Google — 1.2s between queries
    await new Promise(r => setTimeout(r, 1200));
  }
  return { inserted, errors };
}

// ────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('[discover-patents] starting');
  const seen = await fetchExistingSlugs();
  console.log(`[discover-patents] existing patent slugs: ${seen.size}`);
  const { inserted, errors } = await ingestPatents(seen);
  console.log(`[discover-patents] DONE — inserted: ${inserted}, query errors: ${errors}`);
})();
