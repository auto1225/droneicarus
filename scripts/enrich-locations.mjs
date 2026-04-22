// scripts/enrich-locations.mjs
// For each existing YT video, fetch full YouTube metadata (title + description +
// recordingDetails if present), extract candidate place names, geocode via
// Nominatim, and update lat/lon + title to the precise per-video values.

const YT_API_KEY = process.env.YT_API_KEY;
const SUPA_URL   = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!YT_API_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('need YT_API_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`SB ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

async function ytDetails(ids) {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    key: YT_API_KEY, part: 'snippet,recordingDetails',
    id: ids.join(','), maxResults: '50',
  });
  const r = await fetch('https://www.googleapis.com/youtube/v3/videos?' + params);
  if (!r.ok) throw new Error('YT ' + r.status + ' ' + (await r.text()).slice(0,200));
  return (await r.json()).items || [];
}

// Best-effort hint extraction from text. Picks proper-noun runs of 2+ tokens
// first (e.g. "Mt Fuji", "Reykjavik"), then single capitalized tokens.
function extractHints(text) {
  if (!text) return [];
  const cleaned = text.replace(/[\(\)\[\]\|,\-·•\/]/g, ' ');
  const tokens = cleaned.split(/\s+/);
  const grams = new Set();
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!/^[A-Z][a-zA-Z]{2,}$/.test(a)) continue;
    if (i + 2 < tokens.length && /^[A-Z][a-zA-Z]{2,}$/.test(tokens[i+1]) && /^[A-Z][a-zA-Z]{2,}$/.test(tokens[i+2])) {
      grams.add(`${a} ${tokens[i+1]} ${tokens[i+2]}`);
    }
    if (i + 1 < tokens.length && /^[A-Z][a-zA-Z]{2,}$/.test(tokens[i+1])) {
      grams.add(`${a} ${tokens[i+1]}`);
    }
    grams.add(a);
  }
  // Drop very common stopwords that mislead Nominatim
  const skip = new Set(['Drone','Aerial','Cinematic','Video','Footage','Film','Watch','HDR','Ultra','Beautiful','World','Stock','HD','UHD','Dolby','Vision']);
  return [...grams].filter(g => {
    const first = g.split(' ')[0];
    return !skip.has(first);
  }).slice(0, 6);
}

const geoCache = new Map();
async function geocode(place) {
  const k = place.toLowerCase();
  if (geoCache.has(k)) return geoCache.get(k);
  await new Promise(r => setTimeout(r, 1100)); // Nominatim: 1 req/s
  try {
    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
      q: place, format: 'json', limit: '1', addressdetails: '1',
    });
    const r = await fetch(url, { headers: { 'User-Agent': 'droneicarus-enrich/1.0 (auto0104@gmail.com)' }});
    if (!r.ok) { geoCache.set(k, null); return null; }
    const j = await r.json();
    const hit = j?.[0];
    if (!hit) { geoCache.set(k, null); return null; }
    const out = { lat: Number(hit.lat), lon: Number(hit.lon), name: hit.display_name, country: hit.address?.country };
    geoCache.set(k, out);
    return out;
  } catch (e) {
    geoCache.set(k, null);
    return null;
  }
}

async function run() {
  // Fetch all YT videos that need enrichment (any with thumb_url so we know it's still active)
  const rows = await sb('/rest/v1/videos?select=id,youtube_id,title&source=eq.youtube&order=created_at.asc&limit=500');
  console.log('[enrich] candidates:', rows.length);

  // Batch into groups of 50 for YouTube videos.list
  let updated = 0, geocoded = 0, skipped = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const ids = batch.map(r => r.youtube_id).filter(Boolean);
    let details;
    try { details = await ytDetails(ids); }
    catch (e) { console.warn('[yt batch error]', e.message); continue; }

    const byId = Object.fromEntries(details.map(d => [d.id, d]));
    for (const row of batch) {
      const d = byId[row.youtube_id];
      if (!d) { skipped++; continue; }
      const snip = d.snippet || {};
      const realTitle = (snip.title || '').slice(0, 240);
      let lat = null, lon = null, locName = null, locCountry = null;

      const rec = d.recordingDetails || {};
      if (rec.location?.latitude != null) {
        lat = rec.location.latitude;
        lon = rec.location.longitude;
        locName = rec.locationDescription || null;
      } else {
        // Try to geocode hints
        const hints = extractHints((snip.title || '') + ' ' + (snip.description || ''));
        for (const h of hints) {
          const g = await geocode(h);
          if (g && Number.isFinite(g.lat)) {
            lat = g.lat; lon = g.lon; locName = g.name; locCountry = g.country;
            geocoded++;
            break;
          }
        }
      }

      const patch = {
        title: realTitle || row.title,
        description: (snip.description || '').slice(0, 5000),
        youtube_channel: snip.channelTitle || 'discovered',
        thumb_url: snip.thumbnails?.maxres?.url
          || snip.thumbnails?.standard?.url
          || snip.thumbnails?.high?.url
          || `https://i.ytimg.com/vi/${row.youtube_id}/hqdefault.jpg`,
      };
      if (lat != null && lon != null) {
        patch.lat = lat; patch.lon = lon;
        patch.inferred_location_raw = { source: rec.location ? 'youtube-recordingDetails' : 'nominatim', name: locName, country: locCountry };
      }
      try {
        await sb(`/rest/v1/videos?id=eq.${row.id}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
        updated++;
      } catch (e) {
        console.warn('[update error]', row.youtube_id, e.message);
      }
    }
    console.log(`[batch ${i}-${i+batch.length}] updated=${updated} geocoded=${geocoded} skipped=${skipped}`);
  }
  console.log(`[enrich] DONE — updated=${updated} geocoded=${geocoded} skipped=${skipped}`);
}
run().catch(e => { console.error('[fatal]', e); process.exit(1); });
