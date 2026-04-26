// scripts/discover-youtube-html.mjs
// HTML-scrape YouTube /results pages (no API quota required).
// Append-only — does NOT wipe existing rows. Skips already-known youtube_ids.

const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const QUERIES = [
  ['Iguazu Falls drone aerial 4K', 'waterfall', -25.694, -54.437, 'Argentina'],
  ['Niagara Falls drone aerial 4K', 'waterfall', 43.096, -79.037, 'USA'],
  ['Plitvice Lakes waterfalls drone Croatia', 'waterfall', 44.881, 15.62, 'Croatia'],
  ['Gullfoss Iceland drone aerial 4K', 'waterfall', 64.327, -20.124, 'Iceland'],
  ['Skogafoss waterfall drone Iceland', 'waterfall', 63.532, -19.512, 'Iceland'],
  ['Angel Falls Venezuela drone aerial', 'waterfall', 5.967, -62.535, 'Venezuela'],
  ['Yosemite waterfall drone aerial', 'waterfall', 37.756, -119.598, 'USA'],
  ['Detian Falls drone Vietnam China', 'waterfall', 22.851, 106.722, 'China'],
  ['northern lights Tromso drone Norway 4K', 'aurora', 69.649, 18.956, 'Norway'],
  ['aurora borealis Lapland drone Finland', 'aurora', 67.366, 26.629, 'Finland'],
  ['aurora Yellowknife Canada drone', 'aurora', 62.454, -114.371, 'Canada'],
  ['Iceland aurora drone aerial 4K', 'aurora', 64.146, -21.94, 'Iceland'],
  ['aurora Fairbanks Alaska drone', 'aurora', 64.838, -147.716, 'USA'],
  ['Iceland volcano eruption drone Fagradalsfjall', 'volcano', 63.91, -22.3, 'Iceland'],
  ['Stromboli volcano drone aerial Italy', 'volcano', 38.789, 15.213, 'Italy'],
  ['Mount Etna volcano drone Sicily', 'volcano', 37.751, 14.993, 'Italy'],
  ['Hawaii Kilauea volcano drone aerial', 'volcano', 19.421, -155.287, 'USA'],
  ['Mount Bromo drone aerial Indonesia', 'volcano', -7.942, 112.953, 'Indonesia'],
  ['Arenal volcano drone aerial Costa Rica', 'volcano', 10.463, -84.703, 'Costa Rica'],
  ['Shenzhen drone light show 2024 aerial', 'aerial-sports', 22.543, 114.058, 'China'],
  ['Skymagic 1000 drones light show', 'aerial-sports', 51.507, -0.128, 'UK'],
  ['Korea drone light show Busan 2024', 'aerial-sports', 35.18, 129.075, 'South Korea'],
  ['Sydney New Year fireworks drone aerial', 'phenomena', -33.857, 151.215, 'Australia'],
  ['Tokyo Sumida fireworks drone aerial', 'phenomena', 35.711, 139.803, 'Japan'],
  ['Golden Gate Bridge drone aerial sunrise', 'cityscape', 37.819, -122.479, 'USA'],
  ['Akashi Kaikyo Bridge Japan drone aerial', 'cityscape', 34.617, 135.022, 'Japan'],
  ['Millau Viaduct France drone aerial', 'cityscape', 44.077, 3.022, 'France'],
  ['Tower Bridge London drone aerial 4K', 'cityscape', 51.505, -0.075, 'UK'],
  ['Brooklyn Bridge drone aerial NYC', 'cityscape', 40.706, -73.997, 'USA'],
  ['Tuscany vineyard drone aerial Italy 4K', 'landscape', 43.467, 11.046, 'Italy'],
  ['Napa Valley vineyard drone aerial', 'landscape', 38.299, -122.286, 'USA'],
  ['Bordeaux vineyard drone aerial France', 'landscape', 44.838, -0.578, 'France'],
  ['Mendoza vineyard drone Argentina', 'landscape', -32.89, -68.844, 'Argentina'],
  ['Banaue Rice Terraces drone Philippines', 'landscape', 16.928, 121.058, 'Philippines'],
  ['Bali Tegalalang rice terrace drone', 'landscape', -8.43, 115.279, 'Indonesia'],
  ['Longji rice terraces drone China aerial', 'landscape', 25.794, 110.103, 'China'],
  ['Sapa rice terraces drone Vietnam', 'landscape', 22.336, 103.844, 'Vietnam'],
  ['Provence lavender field drone France', 'landscape', 43.892, 5.483, 'France'],
  ['Hokkaido flower field drone Japan', 'landscape', 43.461, 142.483, 'Japan'],
  ['Keukenhof tulip field drone Netherlands', 'landscape', 52.272, 4.547, 'Netherlands'],
  ['cherry blossom drone aerial Japan', 'landscape', 35.011, 135.768, 'Japan'],
  ['offshore wind farm drone aerial North Sea', 'landscape', 54.158, 7.453, 'Germany'],
  ['desert solar farm drone aerial Morocco Noor', 'landscape', 30.997, -6.864, 'Morocco'],
  ['wind turbine drone aerial Texas', 'landscape', 32.736, -101.847, 'USA'],
  ['Maldives atoll drone aerial 4K', 'ocean', 4.175, 73.509, 'Maldives'],
  ['Cliffs of Moher drone aerial Ireland', 'ocean', 52.972, -9.426, 'Ireland'],
  ['Faroe Islands cliffs drone aerial', 'ocean', 61.892, -6.911, 'Faroe Islands'],
  ['Bora Bora drone aerial 4K', 'ocean', -16.5, -151.741, 'French Polynesia'],
  ['Great Barrier Reef drone Australia', 'ocean', -18.286, 147.7, 'Australia'],
  ['Perito Moreno glacier drone Argentina', 'mountain', -50.495, -73.149, 'Argentina'],
  ['Greenland ice sheet drone aerial', 'mountain', 71.706, -42.604, 'Greenland'],
  ['Vatnajokull glacier drone Iceland', 'mountain', 64.404, -16.789, 'Iceland'],
  ['Angkor Wat drone aerial Cambodia 4K', 'ruins-heritage', 13.413, 103.867, 'Cambodia'],
  ['Neuschwanstein castle drone Germany', 'ruins-heritage', 47.557, 10.749, 'Germany'],
  ['Petra Jordan drone aerial 4K', 'ruins-heritage', 30.328, 35.444, 'Jordan'],
  ['Bagan temples drone aerial Myanmar', 'ruins-heritage', 21.171, 94.86, 'Myanmar'],
  ['Machu Picchu drone aerial Peru 4K', 'ruins-heritage', -13.163, -72.545, 'Peru'],
  ['Acropolis Athens drone aerial Greece', 'ruins-heritage', 37.971, 23.726, 'Greece'],
  ['Stonehenge drone aerial UK', 'ruins-heritage', 51.179, -1.826, 'UK'],
  ['Borobudur temple drone Indonesia', 'ruins-heritage', -7.608, 110.204, 'Indonesia'],
  ['Chichen Itza Mexico drone aerial', 'ruins-heritage', 20.683, -88.569, 'Mexico'],
  ['Eiffel Tower drone aerial Paris 4K', 'cityscape', 48.858, 2.294, 'France'],
  ['Burj Khalifa drone aerial Dubai', 'cityscape', 25.197, 55.274, 'UAE'],
  ['Big Ben London drone aerial', 'cityscape', 51.501, -0.124, 'UK'],
  ['Sydney Opera House drone aerial 4K', 'cityscape', -33.857, 151.215, 'Australia'],
  ['Empire State Building drone NYC', 'cityscape', 40.748, -73.985, 'USA'],
  ['whale shark drone aerial Mexico', 'wildlife', 21.347, -86.851, 'Mexico'],
  ['whales drone aerial Hawaii Maui', 'wildlife', 20.798, -156.331, 'USA'],
  ['Serengeti migration drone Tanzania', 'wildlife', -2.333, 34.834, 'Tanzania'],
  ['Maasai Mara wildlife drone Kenya', 'wildlife', -1.493, 35.144, 'Kenya'],
  ['polar bear drone aerial Arctic', 'wildlife', 79.0, -75.0, 'Canada'],
  ['elephants drone aerial Botswana Okavango', 'wildlife', -19.286, 22.831, 'Botswana'],
  ['Amazon rainforest drone aerial Brazil', 'forest', -3.47, -62.22, 'Brazil'],
  ['Redwood forest California drone aerial', 'forest', 41.213, -124.005, 'USA'],
  ['Black Forest Germany drone autumn', 'forest', 48.0, 8.2, 'Germany'],
  ['Taiga forest drone Russia Siberia', 'forest', 60.0, 100.0, 'Russia'],
  ['bamboo forest drone Kyoto Arashiyama', 'forest', 35.017, 135.671, 'Japan'],
  ['supercell storm drone aerial Texas', 'storm-chasing', 33.578, -101.855, 'USA'],
  ['tornado drone aerial Oklahoma', 'storm-chasing', 35.467, -97.516, 'USA'],
  ['Niseko Japan ski drone aerial', 'skiing', 42.866, 140.696, 'Japan'],
  ['Zermatt Matterhorn ski drone aerial', 'skiing', 46.02, 7.748, 'Switzerland'],
  ['Whistler ski resort drone Canada', 'skiing', 50.115, -122.954, 'Canada'],
  ['Aspen ski resort drone aerial', 'skiing', 39.191, -106.817, 'USA'],
  ['Chamonix Mont Blanc drone ski', 'skiing', 45.923, 6.87, 'France'],
  ['Sahara Erg Chebbi dunes drone Morocco', 'dunes', 31.15, -3.953, 'Morocco'],
  ['Namibia Sossusvlei dunes drone', 'dunes', -24.73, 15.35, 'Namibia'],
  ['White Sands New Mexico drone aerial', 'dunes', 32.781, -106.171, 'USA'],
  ['Wahiba Sands Oman drone aerial', 'dunes', 21.5, 58.7, 'Oman'],
  ['Lencois Maranhenses Brazil drone', 'dunes', -2.485, -43.123, 'Brazil'],
  ['Tokyo Shibuya night drone aerial 4K', 'night-flight', 35.661, 139.704, 'Japan'],
  ['Hong Kong skyline night drone aerial', 'night-flight', 22.281, 114.158, 'Hong Kong'],
  ['Las Vegas strip night drone aerial', 'night-flight', 36.114, -115.173, 'USA'],
  ['Shanghai Bund night drone aerial', 'night-flight', 31.245, 121.49, 'China'],
  ['Singapore Marina Bay night drone', 'night-flight', 1.283, 103.86, 'Singapore'],
  ['Dubai Marina night drone aerial', 'night-flight', 25.078, 55.137, 'UAE'],
  ['Pipeline Hawaii surfing drone aerial', 'surfing', 21.665, -158.054, 'USA'],
  ['Nazare giant wave surfing drone', 'surfing', 39.605, -9.075, 'Portugal'],
  ['Mavericks California surfing drone', 'surfing', 37.494, -122.5, 'USA'],
  ['Alps drone aerial Swiss 4K cinematic', 'mountain', 46.558, 8.561, 'Switzerland'],
  ['Himalayas Annapurna drone Nepal', 'mountain', 28.596, 83.82, 'Nepal'],
  ['Patagonia Fitz Roy drone aerial', 'mountain', -49.272, -73.043, 'Argentina'],
  ['Manhattan New York drone aerial 4K', 'cityscape', 40.758, -73.985, 'USA'],
  ['Tokyo skyline drone aerial 4K', 'cityscape', 35.689, 139.692, 'Japan'],
  ['Shanghai Pudong drone aerial 4K', 'cityscape', 31.23, 121.499, 'China'],
  ['Hong Kong harbor drone aerial 4K', 'cityscape', 22.297, 114.169, 'Hong Kong'],
  ['Singapore drone aerial 4K skyline', 'cityscape', 1.29, 103.851, 'Singapore'],
  ['Seoul Gangnam drone aerial 4K', 'cityscape', 37.498, 127.027, 'South Korea'],
  ['Istanbul drone aerial Hagia Sophia', 'cityscape', 41.008, 28.978, 'Turkey'],
  ['Prague drone aerial 4K Czech', 'cityscape', 50.087, 14.421, 'Czech'],
  ['Cape Town drone aerial Table Mountain', 'cityscape', -33.957, 18.408, 'South Africa'],
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
  const ids = [];
  const re = /"videoId":"([A-Za-z0-9_-]{11})"[^{]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) && ids.length < 8) {
    ids.push({ id: m[1], title: m[2] });
  }
  return ids;
}

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPA_URL + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`sb ${method} ${path} → ${res.status} ${text.slice(0,160)}`);
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
}

async function run() {
  console.log(`[html] starting append-only run, ${QUERIES.length} queries`);

  // Pre-fetch all existing youtube_ids so we skip cheaply
  const existing = await sb('/rest/v1/videos?select=youtube_id&source=eq.youtube&limit=10000');
  const knownIds = new Set(existing.map(x => x.youtube_id).filter(Boolean));
  console.log(`[html] ${knownIds.size} youtube_ids already in DB`);

  let total = 0;
  const seen = new Set(knownIds);
  for (const [q, cat, lat, lon, country] of QUERIES) {
    try {
      const items = await fetchYTResults(q);
      const rows = [];
      for (const it of items) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        const lowTitle = (it.title || '').toLowerCase();
        // Skip if title doesn't look drone-related — cheap quality filter
        if (!/drone|aerial|sky|cinematic|4k|8k|fpv|footage/.test(lowTitle)) continue;
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
          ai_quality_score: 6,
          price_usd: 0,
          inferred_location_raw: { source: 'html-scrape', query: q, country },
          published_at: new Date().toISOString(),
        });
      }
      if (rows.length > 0) {
        await sb('/rest/v1/videos?on_conflict=youtube_id', {
          method: 'POST',
          body: rows,
          prefer: 'return=minimal,resolution=ignore-duplicates',
        });
        total += rows.length;
        console.log(`[q] ${q}: +${rows.length} (total ${total})`);
      } else {
        console.log(`[q] ${q}: 0 new (all dupes or non-drone)`);
      }
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.warn('[q error]', q, e.message);
    }
  }
  console.log(`[html] done — inserted ${total} new videos`);
}
run().catch(e => { console.error('[fatal]', e); process.exit(1); });
