// scripts/discover-youtube-html.mjs
// Fallback when YouTube Data API quota is exhausted: scrape /results pages
// (no key, no quota) and seed videos. Lower fidelity (no view counts etc),
// but enough to populate the map with real, embeddable clips.

const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const QUERIES = [
  ['drone iceland 4K landscape',  'landscape', 64.96, -19.02, 'Iceland'],
  ['drone tokyo skyline 4K',      'cityscape', 35.68, 139.69, 'Japan'],
  ['drone uluru sunrise',         'desert',    -25.34, 131.04, 'Australia'],
  ['drone swiss alps 4K',         'mountain',  46.56, 8.56,   'Switzerland'],
  ['drone patagonia mountains',   'mountain',  -51.0, -73.0,  'Chile'],
  ['drone amazon rainforest',     'forest',    -3.47, -62.22, 'Brazil'],
  ['drone faroe islands',         'ocean',     61.9, -6.78,   'Faroe Islands'],
  ['drone manhattan new york 4K', 'cityscape', 40.75, -73.98, 'USA'],
  ['drone antelope canyon',       'desert',    36.86, -111.37, 'USA'],
  ['drone great barrier reef',    'ocean',     -18.29, 147.7,  'Australia'],
  ['drone dolomites italy 4K',    'mountain',  46.41, 11.84,  'Italy'],
  ['drone santorini sunset',      'cityscape', 36.39, 25.46,  'Greece'],
  ['drone bagan myanmar',         'landscape', 21.17, 94.86,  'Myanmar'],
  ['drone sahara desert',         'desert',    23.0, 12.0,    'Algeria'],
  ['drone venice italy',          'cityscape', 45.44, 12.33,  'Italy'],
  ['drone seoul night 4K',        'cityscape', 37.57, 126.98, 'South Korea'],
  ['drone maldives atoll',        'ocean',     4.17, 73.5,    'Maldives'],
  ['drone lofoten norway',        'ocean',     68.23, 13.87,  'Norway'],
  ['drone hallstatt austria',     'landscape', 47.56, 13.65,  'Austria'],
  ['drone bali rice terraces',    'landscape', -8.48, 115.32, 'Indonesia'],
  ['drone petra jordan',          'desert',    30.33, 35.44,  'Jordan'],
  ['drone machu picchu peru',     'mountain',  -13.16, -72.54, 'Peru'],
  ['drone grand canyon',          'landscape', 36.06, -112.14, 'USA'],
  ['drone plitvice croatia',      'forest',    44.88, 15.62,  'Croatia'],
  ['drone victoria falls',        'landscape', -17.92, 25.85, 'Zambia'],
  ['drone yosemite valley',       'mountain',  37.75, -119.59, 'USA'],
  ['drone cappadocia balloons',   'landscape', 38.64, 34.83,  'Turkey'],
  ['drone mount fuji',            'mountain',  35.36, 138.73, 'Japan'],
  ['drone kilimanjaro',           'mountain',  -3.07, 37.35,  'Tanzania'],
  ['drone milford sound nz',      'mountain',  -44.67, 167.93, 'New Zealand'],
  ['drone scotland highlands 4K', 'mountain',  57.0, -4.0,    'Scotland'],
  ['drone provence lavender',     'landscape', 43.96, 5.36,   'France'],
  ['drone alaska glacier',        'mountain',  61.0, -149.0,  'USA'],
  ['drone hawaii volcano kilauea','landscape', 19.42, -155.29,'USA'],
  ['drone amalfi coast italy',    'ocean',     40.63, 14.61,  'Italy'],
  ['drone giza pyramids',         'desert',    29.98, 31.13,  'Egypt'],
  ['drone moscow kremlin',        'cityscape', 55.75, 37.62,  'Russia'],
  ['drone shanghai bund',         'cityscape', 31.24, 121.49, 'China'],
  ['drone sydney opera house',    'cityscape', -33.86, 151.21, 'Australia'],
  ['drone rio de janeiro',        'cityscape', -22.97, -43.18, 'Brazil'],
  ['drone san francisco bridge',  'cityscape', 37.77, -122.41, 'USA'],
  ['drone london thames',         'cityscape', 51.51, -0.13,   'UK'],
  ['drone paris eiffel',          'cityscape', 48.86, 2.34,    'France'],
  ['drone barcelona sagrada',     'cityscape', 41.38, 2.17,    'Spain'],
  ['drone dubai burj khalifa',    'cityscape', 25.20, 55.27,   'UAE'],
];

async function fetchYTResults(query) {
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
  const r = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  if (!r.ok) throw new Error('YT results: ' + r.status);
  const html = await r.text();
  // Extract videoId AND adjacent title from ytInitialData. Cheap regex first.
  const ids = [];
  const re = /"videoId":"([A-Za-z0-9_-]{11})"[^{]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) && ids.length < 6) {
    ids.push({ id: m[1], title: m[2] });
  }
  return ids;
}

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPA_URL + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

async function run() {
  console.log('[html] starting; queries:', QUERIES.length);
  // Wipe existing source='youtube' rows so we re-seed cleanly
  await sb('/rest/v1/videos?source=eq.youtube', { method: 'DELETE', prefer: 'return=minimal' });
  console.log('[html] wiped previous youtube rows');

  let total = 0;
  const seen = new Set();
  for (const [q, cat, lat, lon, country] of QUERIES) {
    try {
      const items = await fetchYTResults(q);
      const rows = [];
      for (const it of items) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        rows.push({
          youtube_id: it.id,
          title: (it.title || '').slice(0, 240),
          description: (it.title || '').slice(0, 240),
          category: cat,
          status: 'published',
          source: 'youtube',
          lat, lon,
          youtube_channel: 'discovered',
          thumb_url: `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`,
          views: 0, likes: 0,
          resolution: 'HD', duration_s: 0,
          ai_quality_score: 7,
          license_tiers: null,
          price_usd: 0,
          inferred_location_raw: { source: 'html-scrape', query: q, country },
          published_at: new Date().toISOString(),
        });
      }
      if (rows.length > 0) {
        await sb('/rest/v1/videos?on_conflict=youtube_id', {
          method: 'POST',
          body: rows,
          prefer: 'return=minimal,resolution=merge-duplicates',
        });
        total += rows.length;
        console.log(`[q] ${q}: +${rows.length} (total ${total})`);
      }
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.warn('[q error]', q, e.message);
    }
  }
  console.log('[html] done — inserted', total);
}
run().catch(e => { console.error('[fatal]', e); process.exit(1); });
