// scripts/discover-lab.mjs — daily auto-ingest for Lab (arXiv + GitHub)
//
// Reads:
//   env SUPABASE_URL                  — https://...supabase.co
//   env SUPABASE_SERVICE_ROLE_KEY     — sb_secret_...
//
// Skips items whose slug already exists. Generates SVG cover thumbnails
// for arXiv papers; uses GitHub social cards for repos.
//
// Run from .github/workflows/discover-lab.yml at 02:00 UTC daily.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

// ────────────────────────────────────────────────────────────────────────
// arXiv queries — same as the seed script, but each daily run grabs
// the latest 5 results per query (sorted by submission date desc).
// Anything already in DB (matched by slug 'arxiv-{id}') is skipped.
// ────────────────────────────────────────────────────────────────────────
const ARXIV_QUERIES = [
  ['cat:cs.RO AND abs:drone',                 ['autonomous','navigation']],
  ['cat:cs.RO AND abs:quadrotor',             ['autonomous','aerodynamics']],
  ['cat:cs.RO AND abs:UAV',                   ['autonomous']],
  ['cat:cs.CV AND abs:drone',                 ['computer-vision']],
  ['cat:cs.CV AND abs:"aerial imagery"',      ['computer-vision','mapping']],
  ['cat:cs.LG AND abs:drone',                 ['autonomous']],
  ['abs:"reinforcement learning" AND abs:drone',['autonomous']],
  ['abs:"drone swarm"',                       ['swarm','swarm-coordination']],
  ['abs:"UAV swarm"',                         ['swarm']],
  ['abs:"visual SLAM" AND abs:UAV',           ['slam']],
  ['abs:"obstacle avoidance" AND abs:drone',  ['obstacle-avoidance']],
  ['abs:"path planning" AND abs:UAV',         ['path-planning']],
  ['abs:"trajectory optimization" AND abs:quadrotor',['path-planning','autonomous']],
  ['abs:"FPV racing"',                        ['racing','fpv','autonomous']],
  ['abs:"drone delivery"',                    ['delivery']],
  ['abs:"precision agriculture" AND abs:drone',['agriculture']],
  ['abs:photogrammetry AND abs:drone',        ['mapping']],
  ['abs:"3D reconstruction" AND abs:aerial',  ['mapping']],
  ['abs:"inspection" AND abs:drone',          ['application']],
  ['abs:"search and rescue" AND abs:drone',   ['application']],
  ['abs:LiDAR AND abs:UAV',                   ['mapping']],
  ['abs:"thermal imaging" AND abs:drone',     ['computer-vision','application']],
  ['abs:"battery" AND abs:UAV AND abs:endurance',['power']],
  ['abs:"hydrogen" AND abs:drone',            ['power']],
  ['abs:"vertical takeoff" AND abs:VTOL',     ['aerodynamics','autonomous']],
  ['abs:"aerial manipulation"',               ['autonomous']],
  ['abs:"counter-drone"',                     ['application']],
  ['abs:"formation flying" AND abs:drone',    ['swarm']],
  // ─── extension batch: more topics & domains ───
  ['cat:cs.RO AND abs:helicopter',           ['autonomous','aerodynamics']],
  ['abs:"multi-rotor" AND abs:control',     ['autonomous']],
  ['abs:"micro aerial vehicle"',            ['autonomous']],
  ['abs:"model predictive control" AND abs:UAV', ['autonomous','control']],
  ['abs:"deep learning" AND abs:drone',     ['ai','autonomous']],
  ['abs:"neural network" AND abs:UAV',      ['ai','autonomous']],
  ['abs:"event camera" AND abs:drone',      ['computer-vision']],
  ['abs:"depth estimation" AND abs:drone',  ['computer-vision']],
  ['abs:"semantic segmentation" AND abs:aerial',['computer-vision','mapping']],
  ['abs:"point cloud" AND abs:UAV',         ['mapping','lidar']],
  ['abs:"localization" AND abs:UAV',        ['slam','autonomous']],
  ['abs:"GPS-denied" AND abs:drone',        ['navigation','autonomous']],
  ['abs:"visual inertial" AND abs:drone',   ['slam']],
  ['abs:"motion capture" AND abs:quadrotor',['slam']],
  ['abs:"actuator failure" AND abs:drone',  ['safety','control']],
  ['abs:"fault tolerant" AND abs:UAV',      ['safety','control']],
  ['abs:"wind disturbance" AND abs:drone',  ['aerodynamics','control']],
  ['abs:"aggressive flight" AND abs:quadrotor',['autonomous','racing']],
  ['abs:"high-speed" AND abs:drone',        ['racing','autonomous']],
  ['abs:"image segmentation" AND abs:drone',['computer-vision']],
  ['abs:"object detection" AND abs:UAV',    ['computer-vision','ai']],
  ['abs:"sense and avoid"',                 ['safety','obstacle-avoidance']],
  ['abs:"airspace integration" AND abs:UAV',['regulation','safety']],
  ['abs:"urban air mobility"',              ['urban','autonomous']],
  ['abs:"electric VTOL"',                   ['vtol','power']],
  ['abs:eVTOL',                               ['vtol','urban']],
  ['abs:"aerial refueling"',                ['power']],
  ['abs:"perching" AND abs:drone',          ['autonomous','novel']],
  ['abs:"contact-based inspection" AND abs:UAV',['inspection','autonomous']],
  ['abs:"flapping wing"',                   ['biomimetic','novel']],
  ['abs:"morphing wing" AND abs:drone',     ['aerodynamics','novel']],
  ['abs:"motion planning" AND abs:multirotor',['path-planning']],
  ['abs:"reactive obstacle avoidance"',     ['obstacle-avoidance']],
  ['abs:"long endurance" AND abs:UAV',      ['power']],
];

const GH_QUERIES = [
  ['topic:drone',      ['firmware']],
  ['topic:uav',        ['firmware','autonomous']],
  ['topic:fpv',        ['firmware','fpv']],
  ['topic:quadcopter', ['firmware']],
  ['topic:ardupilot',  ['firmware','autonomous']],
  ['topic:px4',        ['firmware','autonomous']],
  ['topic:betaflight', ['firmware','fpv']],
  ['topic:multirotor', ['firmware']],
  // ─── extension: more drone open source topics ───
  ['topic:inav',               ['firmware','autonomous']],
  ['topic:cleanflight',        ['firmware','fpv']],
  ['topic:mavlink',            ['firmware','autonomous']],
  ['topic:dji',                ['firmware','dji']],
  ['topic:walksnail',          ['fpv']],
  ['topic:hdzero',             ['fpv']],
  ['topic:elrs',               ['firmware','rc']],
  ['topic:crsf',               ['firmware','rc']],
  ['topic:openipc',            ['firmware','fpv']],
  ['topic:simulator AND topic:drone', ['simulation']],
  ['topic:gazebo AND topic:uav',      ['simulation','autonomous']],
  ['topic:airsim',             ['simulation','ai']],
  ['topic:ros2 AND topic:drone',['ros','autonomous']],
  ['topic:ros AND topic:uav',  ['ros','autonomous']],
  ['topic:companion-computer', ['firmware','autonomous']],
  ['topic:ground-control-station',['firmware']],
  ['topic:mission-planner',    ['firmware','autonomous']],
  ['topic:gimbal',             ['hardware','imaging']],
  ['topic:osd AND topic:fpv',  ['fpv']],
  ['topic:vtx AND topic:fpv',  ['fpv','radio']],
  ['topic:geofence',           ['safety','firmware']],
  ['topic:swarm AND topic:robot', ['swarm']],
  ['topic:drone-detection',    ['counter-drone','safety']],
  ['topic:drone-mapping',      ['mapping','autonomous']],
  ['topic:opendronemap',       ['mapping']],
];

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
  // Pull all (up to 5000) slugs once for dedup
  const rows = await sb('/rest/v1/lab_items?select=slug&limit=5000');
  return new Set(rows.map(r => r.slug).filter(Boolean));
}

function svgPlaceholder(item) {
  const themes = {
    research: { from:'#1e3a5f', to:'#0f1f3f', accent:'#c68820', icon:'<path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="0.8" fill="none" opacity="0.2"/>' },
    projects: { from:'#2d4a2d', to:'#1a2820', accent:'#8a9a5b', icon:'<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.25"/>' },
  };
  const t = themes[item.subsection] || themes.research;
  const title = (item.title || '').slice(0, 100);
  const words = title.split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 30) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  const lns = lines.slice(0, 4);
  const inst = (item.institution || '').slice(0, 40)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const escTitle = (s) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.from}"/><stop offset="100%" stop-color="${t.to}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><g transform="translate(420,60) scale(6)" color="${t.accent}">${t.icon}</g><rect x="40" y="46" width="4" height="24" fill="${t.accent}"/><text x="56" y="64" fill="${t.accent}" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" letter-spacing="2">${item.subsection.toUpperCase()}</text>${lns.map((l,i) => `<text x="40" y="${160+46*i}" fill="#f5ede0" font-family="Inter Tight, Inter, sans-serif" font-size="28" font-weight="700">${escTitle(l)}</text>`).join('')}<text x="40" y="${160+46*lns.length+30}" fill="#d1c8b5" font-family="Inter Tight, Inter, sans-serif" font-size="14" opacity="0.8">${inst}</text><text x="40" y="340" fill="#d1c8b5" font-family="'JetBrains Mono', monospace" font-size="10" opacity="0.5" letter-spacing="1.5">DRONEICARUS · LAB</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

// ────────────────────────────────────────────────────────────────────────
// 1) arXiv ingest
// ────────────────────────────────────────────────────────────────────────
async function ingestArxiv(seenSlugs) {
  let inserted = 0;
  for (const [q, tags] of ARXIV_QUERIES) {
    const url = 'http://export.arxiv.org/api/query?' + new URLSearchParams({
      search_query: q, start: '0', max_results: '5',
      sortBy: 'submittedDate', sortOrder: 'descending',
    });
    let xml;
    try { xml = await (await fetch(url)).text(); }
    catch (e) { console.warn('  arxiv err:', e.message); continue; }

    // Parse <entry> elements
    const entries = xml.split(/<entry>/).slice(1);
    for (const block of entries) {
      const idMatch = block.match(/arxiv\.org\/abs\/([\d.]+)/);
      if (!idMatch) continue;
      const aid = idMatch[1];
      const slug = `arxiv-${aid}`;
      if (seenSlugs.has(slug)) continue;
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
      const pubMatch = block.match(/<published>(\d{4}-\d{2}-\d{2})/);
      const authorNames = [...block.matchAll(/<name>([^<]+)<\/name>/g)].map(m => m[1]).slice(0, 6);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      const summary = (summaryMatch?.[1] || '').replace(/\s+/g, ' ').replace(/\$[^$]+\$|\\[a-zA-Z]+\{[^}]+\}/g, '').trim().slice(0, 500);

      const item = {
        type: 'paper', subsection: 'research',
        title: title.slice(0, 200), slug,
        summary,
        external_url: `https://arxiv.org/abs/${aid}`,
        document_url: `https://arxiv.org/pdf/${aid}.pdf`,
        document_type: 'pdf',
        authors: authorNames, institution: null,
        published_at: pubMatch?.[1] || null,
        tags, status: 'approved',
      };
      item.cover_image_url = svgPlaceholder(item);
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: item, prefer: 'return=minimal' });
        seenSlugs.add(slug); inserted++;
      } catch (e) {
        // skip dupes silently
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    // gentle rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  return inserted;
}

// ────────────────────────────────────────────────────────────────────────
// 2) GitHub ingest
// ────────────────────────────────────────────────────────────────────────
async function ingestGithub(seenSlugs) {
  let inserted = 0;
  const ghHeaders = {
    'User-Agent': 'droneicarus-bot/1.0',
    'Accept': 'application/vnd.github.v3+json',
  };
  // Auth boost rate limit: 60/hr → 5000/hr if we have a token. The
  // GH_TOKEN env var is auto-injected by Actions. (Un-auth still works
  // for ~10 calls.)
  if (process.env.GH_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  else if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  for (const [q, baseTags] of GH_QUERIES) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
    let data;
    try {
      const r = await fetch(url, { headers: ghHeaders });
      if (!r.ok) { console.warn(`  gh ${q} → ${r.status}`); continue; }
      data = await r.json();
    } catch (e) { console.warn('  gh err:', e.message); continue; }

    for (const repo of (data.items || [])) {
      const slug = `gh-${repo.full_name.replace('/', '-').toLowerCase()}`;
      if (seenSlugs.has(slug)) continue;
      const topics = (repo.topics || []).slice(0, 8);
      const tags = [...new Set([...baseTags, ...topics])].slice(0, 10);
      const desc = (repo.description || '').slice(0, 500);
      const item = {
        type: 'project', subsection: 'projects',
        title: `${repo.full_name} — ${desc.slice(0, 100) || 'Drone open source project'}`,
        slug,
        summary: `★ ${(repo.stargazers_count || 0).toLocaleString()} stars. ${desc}`.slice(0, 500),
        external_url: repo.html_url,
        cover_image_url: `https://opengraph.githubassets.com/1/${repo.full_name}`,
        authors: [repo.owner?.login].filter(Boolean),
        institution: 'GitHub · ' + (repo.owner?.login || ''),
        published_at: (repo.created_at || '').slice(0, 10) || null,
        tags, status: 'approved',
      };
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: item, prefer: 'return=minimal' });
        seenSlugs.add(slug); inserted++;
      } catch (e) {
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return inserted;
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('[discover-lab] starting');
  const before = await sb('/rest/v1/lab_items?select=id&limit=1', { prefer: 'count=exact' });
  // count is in headers; can't easily read with this helper — rely on log lines
  const seen = await fetchExistingSlugs();
  console.log(`[discover-lab] existing slugs: ${seen.size}`);

  const arxivCount = await ingestArxiv(seen);
  console.log(`[discover-lab] arxiv inserted: ${arxivCount}`);

  const ghCount = await ingestGithub(seen);
  console.log(`[discover-lab] github inserted: ${ghCount}`);

  console.log(`[discover-lab] DONE — total inserted: ${arxivCount + ghCount}`);
})();
