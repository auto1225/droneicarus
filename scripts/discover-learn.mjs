// scripts/discover-learn.mjs — Lab "learn" subsection from YouTube tutorials.
// Curated tutorial channels + topical search seeds. Uses YouTube Data API v3
// (existing YOUTUBE_API_KEY secret) to find recent tutorial videos. Validates
// each via oEmbed (drops removed/private). Inserts as lab_items.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YT_KEY   = process.env.YOUTUBE_API_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE env'); process.exit(1); }
if (!YT_KEY) { console.error('missing YOUTUBE_API_KEY'); process.exit(1); }

// Curated drone-tutorial channels (well-known, prolific, high-quality)
const CHANNELS = [
  { id: 'UCX3eufnI7A2I7IkKHZn8KSQ', name: 'Joshua Bardwell',     tags: ['fpv','tutorial'] },
  { id: 'UCEUw_WgL57Bz0HuClMS7DcQ', name: 'Drone Camps RC',      tags: ['fpv','tutorial'] },
  { id: 'UCkQO3QsgTpNTsOw6ujimT5Q', name: 'Painless360',         tags: ['firmware','tutorial'] },
  { id: 'UCgw9SdSrcr-tlukVvjYcVZA', name: 'UAV Futures',         tags: ['hardware','tutorial'] },
  { id: 'UCwojJxGQ0SS9kcCjxbB8XKg', name: 'Mads Tech',           tags: ['fpv','review'] },
  { id: 'UCo4yghBJTI80wegOiNQAQyg', name: 'Le Drib',             tags: ['fpv','racing'] },
  { id: 'UC7xYoCnM3hyJlGiKAQUvLpw', name: 'Mr Steele',           tags: ['fpv','freestyle'] },
  { id: 'UCsbszc8WD0fk1VHZWS8d_-Q', name: 'Bardwell - Pro',      tags: ['firmware','tutorial'] },
];

// Topical search queries (in addition to channel feeds)
const SEARCH_QUERIES = [
  'drone tutorial for beginners',
  'how to build FPV drone',
  'betaflight setup tutorial',
  'inav configuration guide',
  'ardupilot mission planner tutorial',
  'PX4 setup tutorial',
  'drone PID tuning',
  'soldering FPV drone',
  'drone camera setup',
  'ELRS receiver binding',
  'DJI O3 air unit setup',
  'drone freestyle tips',
  'drone cinematography techniques',
  'mapping drone tutorial',
  'agriculture drone setup',
  'drone repair guide',
  'long range FPV setup',
  'drone simulator tutorial',
  'walksnail goggles setup',
];

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

async function fetchExistingSlugs() {
  const rows = await sb('/rest/v1/lab_items?subsection=eq.learn&select=slug&limit=2000');
  return new Set(rows.map(r => r.slug).filter(Boolean));
}

async function ytSearch({ q, channelId, maxResults = 10 }) {
  const u = new URL('https://www.googleapis.com/youtube/v3/search');
  u.searchParams.set('part', 'snippet');
  u.searchParams.set('type', 'video');
  u.searchParams.set('order', 'date');
  u.searchParams.set('maxResults', String(maxResults));
  if (q) u.searchParams.set('q', q);
  if (channelId) u.searchParams.set('channelId', channelId);
  u.searchParams.set('key', YT_KEY);
  const r = await fetch(u);
  if (!r.ok) { console.warn(`yt err ${r.status}`); return []; }
  const j = await r.json();
  return j.items || [];
}

async function checkAvailable(videoId) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    return r.ok;
  } catch { return false; }
}

function buildItem(snip, baseTags) {
  const id = snip.id?.videoId || snip.id;
  if (!id) return null;
  const slug = `yt-learn-${id}`;
  const sn = snip.snippet || {};
  const title = (sn.title || '').slice(0, 200);
  if (!title) return null;
  const url = `https://www.youtube.com/watch?v=${id}`;
  return {
    type: 'tutorial',
    subsection: 'learn',
    title, slug,
    summary: (sn.description || '').slice(0, 600),
    external_url: url,
    document_url: url,
    document_type: 'youtube',
    cover_image_url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    authors: [sn.channelTitle].filter(Boolean),
    institution: sn.channelTitle || 'YouTube',
    published_at: (sn.publishedAt || '').slice(0, 10) || null,
    tags: [...new Set([...baseTags, 'tutorial'])].slice(0, 10),
    status: 'approved',
  };
}

(async () => {
  console.log('[discover-learn] starting');
  const seen = await fetchExistingSlugs();
  console.log(`[discover-learn] existing slugs: ${seen.size}`);
  let inserted = 0;

  // 1) Channel feeds — recent uploads
  for (const ch of CHANNELS) {
    const items = await ytSearch({ channelId: ch.id, maxResults: 8 });
    for (const it of items) {
      const built = buildItem(it, ch.tags);
      if (!built || seen.has(built.slug)) continue;
      const live = await checkAvailable(it.id?.videoId || it.id);
      if (!live) continue;
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: built, prefer: 'return=minimal' });
        seen.add(built.slug); inserted++;
      } catch (e) {
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    console.log(`  ch:${ch.name} → total inserted so far ${inserted}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // 2) Topical search — broader catch
  for (const q of SEARCH_QUERIES) {
    const items = await ytSearch({ q, maxResults: 5 });
    for (const it of items) {
      const built = buildItem(it, ['tutorial']);
      if (!built || seen.has(built.slug)) continue;
      const live = await checkAvailable(it.id?.videoId || it.id);
      if (!live) continue;
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: built, prefer: 'return=minimal' });
        seen.add(built.slug); inserted++;
      } catch (e) {
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[discover-learn] DONE — inserted: ${inserted}`);
})();
