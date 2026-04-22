// scripts/enrich-locations.mjs — high-precision location enrichment.
//
// Resolution priority (each step succeeds → stop):
//  1. YouTube `recordingDetails.location` (drone GPS, ~50 m)
//  2. Description-embedded coords: e.g. "64.96°N, -19.02°W" or "GPS: 64.96, -19.02"
//  3. Wikidata SPARQL: search proper noun → entity with P625 (coordinate location)
//  4. Nominatim (OSM): fallback for any place name
//  5. Optional: Claude API NER, only if ANTHROPIC_API_KEY env present
//
// Free tier: steps 1-4 only. Add Anthropic key to enable step 5 ($0.001/video).

const YT_KEY = process.env.YT_API_KEY;
const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!YT_KEY || !SUPA_URL || !SUPA_KEY) { console.error('need keys'); process.exit(1); }

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const r = await fetch(SUPA_URL + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`SB ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

async function ytDetails(ids) {
  if (!ids.length) return [];
  const p = new URLSearchParams({ key: YT_KEY, part: 'snippet,recordingDetails', id: ids.join(','), maxResults: '50' });
  const r = await fetch('https://www.googleapis.com/youtube/v3/videos?' + p);
  if (!r.ok) throw new Error('YT ' + r.status);
  return (await r.json()).items || [];
}

// ── Step 2: parse explicit coords from description ────────────────────────
function parseCoords(text) {
  if (!text) return null;
  // "64.96°N, 19.02°W" or "64.96°N 19.02°W"
  let m = text.match(/(-?\d{1,3}(?:\.\d+)?)°?\s*([NSns])[\s,]+(-?\d{1,3}(?:\.\d+)?)°?\s*([EWew])/);
  if (m) {
    let lat = +m[1], lon = +m[3];
    if (/s/i.test(m[2])) lat = -lat;
    if (/w/i.test(m[4])) lon = -lon;
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon, src: 'desc-DMS' };
  }
  // "GPS: 64.96, -19.02" or "Lat: 64.96 Lon: -19.02" or plain "(64.96, -19.02)"
  m = text.match(/(?:GPS|location|lat[itude]*)\s*[:=]?\s*(-?\d{1,3}\.\d+)\s*[,\s]\s*(?:lon[gitude]*\s*[:=]?\s*)?(-?\d{1,3}\.\d+)/i);
  if (!m) m = text.match(/(?<![\d.])(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})(?![\d.])/);
  if (m) {
    const lat = +m[1], lon = +m[2];
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon, src: 'desc-decimal' };
  }
  return null;
}

// ── Step 3: Wikidata search → coordinate ─────────────────────────────────
const wdCache = new Map();
async function wikidataLookup(name) {
  const k = name.toLowerCase();
  if (wdCache.has(k)) return wdCache.get(k);
  try {
    // Search Wikidata for the term
    const sUrl = 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({
      action: 'wbsearchentities', search: name, language: 'en', format: 'json', limit: '5', origin: '*',
    });
    const s = await fetch(sUrl, { headers: { 'User-Agent': 'droneicarus/1.0' } });
    if (!s.ok) { wdCache.set(k, null); return null; }
    const sj = await s.json();
    if (!sj.search?.length) { wdCache.set(k, null); return null; }
    // Try each hit until we find one with P625 coords
    for (const hit of sj.search.slice(0, 3)) {
      const eUrl = 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({
        action: 'wbgetentities', ids: hit.id, props: 'claims', format: 'json', origin: '*',
      });
      const e = await fetch(eUrl, { headers: { 'User-Agent': 'droneicarus/1.0' } });
      if (!e.ok) continue;
      const ej = await e.json();
      const coord = ej.entities?.[hit.id]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (coord && Number.isFinite(coord.latitude) && Number.isFinite(coord.longitude)) {
        const out = { lat: coord.latitude, lon: coord.longitude, name: hit.label, country: null, src: 'wikidata' };
        wdCache.set(k, out);
        return out;
      }
    }
    wdCache.set(k, null);
    return null;
  } catch (e) {
    wdCache.set(k, null);
    return null;
  }
}

// ── Step 4: Nominatim ─────────────────────────────────────────────────────
const nomCache = new Map();
async function nominatim(name) {
  const k = name.toLowerCase();
  if (nomCache.has(k)) return nomCache.get(k);
  await new Promise(r => setTimeout(r, 1100));
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: name, format: 'json', limit: '1', addressdetails: '1' }), { headers: { 'User-Agent': 'droneicarus-enrich/1.0 (auto0104@gmail.com)' } });
    if (!r.ok) { nomCache.set(k, null); return null; }
    const j = await r.json();
    const hit = j?.[0];
    if (!hit) { nomCache.set(k, null); return null; }
    const out = { lat: +hit.lat, lon: +hit.lon, name: hit.display_name, country: hit.address?.country, src: 'nominatim' };
    nomCache.set(k, out);
    return out;
  } catch { nomCache.set(k, null); return null; }
}

// ── Step 5: Claude NER (optional) ────────────────────────────────────────
async function claudeNER(title, desc) {
  if (!ANTHROPIC_KEY) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Extract the most specific filming location from this drone-footage YouTube video. Reply with JUST a JSON: {"place": "...", "country": "...", "confidence": 0-10}. If unclear, confidence < 4.
Title: ${title}
Description: ${(desc || '').slice(0, 500)}`,
        }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = j.content?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const out = JSON.parse(m[0]);
    if (out.confidence < 4) return null;
    return out.place + (out.country ? ', ' + out.country : '');
  } catch { return null; }
}

// ── Hint extraction with stricter filtering ──────────────────────────────
function extractHints(title, desc) {
  const stop = new Set(['Drone','Aerial','Cinematic','Video','Footage','Film','Watch','HDR','Ultra','Beautiful','World','Stock','HD','UHD','Dolby','Vision','Travel','Best','Amazing','Stunning','Most','Top','Edit','Master','Director','Edition','Music','Production','Inc','Channel','Subscribe','Like','Comment','Share','Click','Link','New','Update','Free','Camera','Mavic','Phantom','DJI','Skydio','Footage','Movie','GoPro','FPV','POV','Live','Stream']);
  const text = (title + ' ' + (desc || '')).slice(0, 1500);
  const cleaned = text.replace(/[\(\)\[\]\|,\-·•\/#@!?":]/g, ' ');
  const tokens = cleaned.split(/\s+/);
  const grams = new Set();
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!/^[A-Z][\p{L}'-]{2,}$/u.test(a)) continue;
    if (stop.has(a)) continue;
    // 3-gram
    if (i + 2 < tokens.length && /^[A-Z][\p{L}'-]{2,}$/u.test(tokens[i+1]) && /^[A-Z][\p{L}'-]{2,}$/u.test(tokens[i+2])) {
      grams.add(`${a} ${tokens[i+1]} ${tokens[i+2]}`);
    }
    // 2-gram
    if (i + 1 < tokens.length && /^[A-Z][\p{L}'-]{2,}$/u.test(tokens[i+1]) && !stop.has(tokens[i+1])) {
      grams.add(`${a} ${tokens[i+1]}`);
    }
    grams.add(a);
  }
  return [...grams].slice(0, 8);
}

async function resolveLocation(snippet, recordingDetails) {
  // 1. recording details
  const rec = recordingDetails || {};
  if (rec.location?.latitude != null) {
    return { lat: rec.location.latitude, lon: rec.location.longitude, src: 'youtube-recordingDetails', name: rec.locationDescription || null };
  }
  const title = snippet.title || '';
  const desc = snippet.description || '';
  // 2. coords in description
  const c = parseCoords(title + '\n' + desc);
  if (c) return { lat: c.lat, lon: c.lon, src: c.src, name: 'extracted from description' };
  // 3. Wikidata
  const hints = extractHints(title, desc);
  for (const h of hints) {
    const w = await wikidataLookup(h);
    if (w) return w;
  }
  // 5. Claude (most accurate, quota permitting)
  const claudePlace = await claudeNER(title, desc);
  if (claudePlace) {
    const w = await wikidataLookup(claudePlace);
    if (w) return { ...w, src: 'claude+wikidata' };
    const n = await nominatim(claudePlace);
    if (n) return { ...n, src: 'claude+nominatim' };
  }
  // 4. Nominatim fallback
  for (const h of hints) {
    const n = await nominatim(h);
    if (n) return n;
  }
  return null;
}

async function run() {
  const all = await sb('/rest/v1/videos?select=id,youtube_id,title&source=eq.youtube&limit=2000');
  console.log('[enrich] candidates:', all.length, '| claudeKey:', !!ANTHROPIC_KEY);
  let updated = 0, byA = 0, byB = 0, byC = 0, byD = 0, none = 0;
  for (let i = 0; i < all.length; i += 50) {
    const batch = all.slice(i, i + 50);
    const ids = batch.map(r => r.youtube_id).filter(Boolean);
    let details;
    try { details = await ytDetails(ids); }
    catch (e) { console.warn('[yt err]', e.message); continue; }
    const byId = Object.fromEntries(details.map(d => [d.id, d]));
    for (const row of batch) {
      const d = byId[row.youtube_id];
      if (!d) continue;
      const snip = d.snippet || {};
      const loc = await resolveLocation(snip, d.recordingDetails);
      const patch = {
        title: (snip.title || row.title).slice(0, 240),
        description: (snip.description || '').slice(0, 5000),
        youtube_channel: snip.channelTitle || 'discovered',
        thumb_url: snip.thumbnails?.maxres?.url || snip.thumbnails?.standard?.url || snip.thumbnails?.high?.url || `https://i.ytimg.com/vi/${row.youtube_id}/hqdefault.jpg`,
      };
      if (loc) {
        patch.lat = loc.lat; patch.lon = loc.lon;
        patch.inferred_location_raw = loc;
        if (loc.src === 'youtube-recordingDetails' || loc.src.startsWith('desc-')) byA++;
        else if (loc.src.includes('wikidata')) byB++;
        else if (loc.src.includes('claude')) byC++;
        else byD++;
      } else { none++; }
      try {
        await sb(`/rest/v1/videos?id=eq.${row.id}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
        updated++;
      } catch (e) { console.warn('[update err]', row.youtube_id, e.message); }
    }
    console.log(`[batch ${i}] updated=${updated} A=${byA} B=${byB} C=${byC} D=${byD} none=${none}`);
  }
  console.log(`[enrich] DONE — updated=${updated} A=${byA} B=${byB} C=${byC} D=${byD} none=${none}`);
}
run().catch(e => { console.error('[fatal]', e); process.exit(1); });
