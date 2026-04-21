// scripts/discover-youtube.mjs
// YouTube drone-footage discovery. Reads active queries from Supabase,
// pulls YouTube search results, geocodes location hints, inserts into videos.
//
// ENV:
//   YT_API_KEY                   — Google Cloud API key with YouTube Data API v3 enabled
//   SUPABASE_URL                 — https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    — service role JWT/secret (bypasses RLS)
//   MAX_PER_QUERY  (default 20)  — candidates per query
//   DAILY_QUOTA_UNITS (default 9500) — keep under 10000
//
// Run: node scripts/discover-youtube.mjs

import crypto from 'node:crypto';

const YT_API_KEY   = process.env.YT_API_KEY;
const SUPA_URL     = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_PER_QUERY  = Number(process.env.MAX_PER_QUERY  || 20);
const DAILY_QUOTA    = Number(process.env.DAILY_QUOTA_UNITS || 9500);
const TRIGGERED_BY   = process.env.TRIGGERED_BY || 'cron';

if (!YT_API_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('Missing env: YT_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ---- Supabase REST helpers (using service role) -------------------------
async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPA_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${text.slice(0,200)}`);
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
}

// ---- YouTube API helpers -------------------------------------------------
let quotaUsed = 0;
async function ytSearch(query, pageToken) {
  quotaUsed += 100;
  const params = new URLSearchParams({
    key: YT_API_KEY,
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    videoDuration: 'medium',
    maxResults: '50',
    order: 'relevance',
    relevanceLanguage: 'en',
    safeSearch: 'moderate',
  });
  if (pageToken) params.set('pageToken', pageToken);
  const res = await fetch('https://www.googleapis.com/youtube/v3/search?' + params);
  const json = await res.json();
  if (!res.ok) throw new Error(`YT search: ${res.status} ${JSON.stringify(json).slice(0,200)}`);
  return json;
}

async function ytVideos(ids) {
  if (ids.length === 0) return [];
  // videos.list = 1 unit + 2*parts*items/50 (cheap — count as 1 per batch)
  quotaUsed += 1;
  const params = new URLSearchParams({
    key: YT_API_KEY,
    part: 'snippet,contentDetails,statistics,recordingDetails,status',
    id: ids.join(','),
    maxResults: '50',
  });
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?' + params);
  const json = await res.json();
  if (!res.ok) throw new Error(`YT videos: ${res.status} ${JSON.stringify(json).slice(0,200)}`);
  return json.items || [];
}

// ---- Location extraction + geocoding -------------------------------------
// Pull likely place names from title/description. Keep it simple: capitalized
// tokens of 3+ chars, or well-known landmark phrases. Caller validates with
// Nominatim, so false positives are cheap.
function extractLocationHints(text) {
  if (!text) return [];
  const cleaned = text.replace(/[\(\)\[\]\|,\-·•\/]/g, ' ');
  const tokens = cleaned.split(/\s+/);
  const hints = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[A-Z][a-zA-Z]{2,}$/.test(t)) {
      // also try 2-gram if next is also Capitalized
      if (i + 1 < tokens.length && /^[A-Z][a-zA-Z]{2,}$/.test(tokens[i+1])) {
        hints.push(t + ' ' + tokens[i+1]);
      }
      hints.push(t);
    }
  }
  // Dedupe, prefer 2-grams
  const seen = new Set();
  const out = [];
  for (const h of hints) {
    const k = h.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out.slice(0, 5);
}

const geocodeCache = new Map();
async function geocode(place) {
  const key = place.toLowerCase().trim();
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    // Nominatim — be polite (1 req/s max). We'll serialize via a simple queue.
    await new Promise(r => setTimeout(r, 1100));
    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
      q: place, format: 'json', limit: '1', addressdetails: '1',
    });
    const res = await fetch(url, { headers: { 'User-Agent': 'droneicarus-discovery/1.0 (auto0104@gmail.com)' }});
    if (!res.ok) { geocodeCache.set(key, null); return null; }
    const j = await res.json();
    const hit = j?.[0];
    if (!hit) { geocodeCache.set(key, null); return null; }
    const out = {
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      display_name: hit.display_name,
      country: hit.address?.country,
      country_code: hit.address?.country_code,
      class: hit.class,
      type: hit.type,
      raw: hit,
    };
    geocodeCache.set(key, out);
    return out;
  } catch (e) {
    console.warn('[geocode] error for', place, e.message);
    geocodeCache.set(key, null);
    return null;
  }
}

// ---- Category inference --------------------------------------------------
// We start from the query's suggested category, but also check the YouTube
// video's own tags/title for stronger matches.
const CAT_KEYWORDS = {
  mountain:  ['mountain', 'alps', 'peak', 'summit', 'fjord', 'canyon', 'himalaya', 'rockies', 'everest', 'kilimanjaro', 'fuji', 'alpine'],
  ocean:     ['ocean', 'sea', 'reef', 'island', 'isle', 'atoll', 'coast', 'beach', 'coral'],
  forest:    ['forest', 'jungle', 'rainforest', 'amazon', 'woods'],
  desert:    ['desert', 'dune', 'sahara', 'sand', 'arid', 'ayers'],
  cityscape: ['city', 'skyline', 'urban', 'downtown', 'tokyo', 'new york', 'nyc', 'seoul', 'venice', 'santorini'],
  landscape: ['landscape', 'valley', 'waterfall', 'plateau', 'rice', 'terrace', 'bagan', 'petra', 'machu'],
};
function inferCategory(hintCategory, text) {
  const lower = (text || '').toLowerCase();
  const hits = {};
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    let score = 0;
    for (const kw of kws) if (lower.includes(kw)) score++;
    if (score > 0) hits[cat] = score;
  }
  // Combine with hint
  if (hintCategory) hits[hintCategory] = (hits[hintCategory] || 0) + 2;
  let best = null, bestScore = 0;
  for (const [cat, s] of Object.entries(hits)) {
    if (s > bestScore) { best = cat; bestScore = s; }
  }
  return best || 'landscape';
}

// ---- Quality scoring (avoid clickbait / low-prod) ------------------------
function qualityScore(v) {
  // view velocity, like ratio, duration, definition, CC license
  const views = Number(v.statistics?.viewCount || 0);
  const likes = Number(v.statistics?.likeCount || 0);
  const dur   = parseISO8601Duration(v.contentDetails?.duration || 'PT0S');
  const hd    = v.contentDetails?.definition === 'hd';
  const cc    = v.status?.license === 'creativeCommon';
  let s = 0;
  if (views >= 5_000)   s += 2;
  if (views >= 50_000)  s += 1;
  if (views >= 500_000) s += 1;
  if (likes > 0 && views > 0 && (likes / views) >= 0.01) s += 2;
  if (dur >= 60 && dur <= 900) s += 2;  // 1-15 min sweet spot
  if (hd) s += 1;
  if (cc) s += 1;
  return Math.min(10, s);
}

function parseISO8601Duration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

// ---- Main flow -----------------------------------------------------------
async function run() {
  const runRow = await sb('/rest/v1/discovery_runs', {
    method: 'POST',
    body: { triggered_by: TRIGGERED_BY },
    prefer: 'return=representation',
  });
  const runId = Array.isArray(runRow) ? runRow[0].id : runRow.id;
  console.log(`[run] ${runId} started (${TRIGGERED_BY})`);

  const queries = await sb('/rest/v1/discovery_queries?select=*&active=eq.true&order=last_run_at.asc.nullsfirst,created_at.asc');
  console.log(`[run] ${queries.length} active queries`);

  let candidates = 0, inserted = 0, updated = 0, skippedDupes = 0, skippedLow = 0;
  const errors = [];

  for (const q of queries) {
    if (quotaUsed >= DAILY_QUOTA) {
      console.log(`[run] quota budget reached (${quotaUsed}) — stopping`);
      break;
    }
    try {
      console.log(`[q] ${q.query} (hint=${q.category})`);
      const results = await ytSearch(q.query);
      const ids = (results.items || []).map(it => it.id.videoId).filter(Boolean).slice(0, MAX_PER_QUERY);
      if (ids.length === 0) continue;

      // Check which ids we already have
      const existingRes = await sb('/rest/v1/videos?select=youtube_id&youtube_id=in.(' + ids.map(i => '"' + i + '"').join(',') + ')');
      const existingSet = new Set(existingRes.map(r => r.youtube_id));
      const newIds = ids.filter(i => !existingSet.has(i));
      skippedDupes += ids.length - newIds.length;
      candidates += newIds.length;
      if (newIds.length === 0) continue;

      // Fetch full details for new ids (batches of 50)
      const details = await ytVideos(newIds);

      for (const v of details) {
        try {
          const snippet = v.snippet || {};
          const text = `${snippet.title || ''}\n${snippet.description || ''}`;
          const score = qualityScore(v);
          if (score < 3) { skippedLow++; continue; }

          // Location inference: recordingDetails first, then title/description hints
          let lat = null, lon = null, inferredRaw = null;
          const rec = v.recordingDetails || {};
          if (rec.location?.latitude != null && rec.location?.longitude != null) {
            lat = rec.location.latitude;
            lon = rec.location.longitude;
            inferredRaw = { source: 'recordingDetails', value: rec };
          } else {
            const hints = extractLocationHints(snippet.title + ' ' + snippet.description);
            for (const h of hints) {
              const g = await geocode(h);
              if (g && Number.isFinite(g.lat) && Number.isFinite(g.lon)) {
                lat = g.lat; lon = g.lon;
                inferredRaw = { source: 'nominatim', hint: h, value: g };
                break;
              }
            }
          }

          const cat = inferCategory(q.category, text + ' ' + (snippet.tags || []).join(' '));
          const thumbnail = snippet.thumbnails?.maxres?.url
            || snippet.thumbnails?.standard?.url
            || snippet.thumbnails?.high?.url
            || snippet.thumbnails?.medium?.url
            || snippet.thumbnails?.default?.url;

          const row = {
            title: (snippet.title || '(untitled)').slice(0, 240),
            description: (snippet.description || '').slice(0, 5000),
            category: cat,
            tags: (snippet.tags || []).slice(0, 12),
            status: 'published',
            source: 'youtube',
            youtube_id: v.id,
            youtube_channel: snippet.channelTitle,
            youtube_published_at: snippet.publishedAt,
            ai_summary: snippet.description ? snippet.description.slice(0, 280) : null,
            ai_quality_score: score,
            discovery_batch_id: runId,
            inferred_location_raw: inferredRaw,
            lat, lon,
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
            thumb_url: thumbnail,
            resolution: v.contentDetails?.definition === 'hd' ? 'HD' : 'SD',
            duration_s: parseISO8601Duration(v.contentDetails?.duration || 'PT0S'),
            price_usd: 0,  // external clips are free-to-watch, non-sellable
            license_tiers: ['external'],
            published_at: new Date().toISOString(),
          };

          await sb('/rest/v1/videos?on_conflict=youtube_id', {
            method: 'POST',
            body: row,
            prefer: 'return=minimal,resolution=merge-duplicates',
          });
          inserted++;
        } catch (e) {
          errors.push({ query: q.query, videoId: v.id, error: e.message });
          console.warn('[item error]', v.id, e.message);
        }
      }

      // Update query last_run_at + last_found
      await sb(`/rest/v1/discovery_queries?id=eq.${q.id}`, {
        method: 'PATCH',
        body: { last_run_at: new Date().toISOString(), last_found: details.length },
        prefer: 'return=minimal',
      });
    } catch (e) {
      errors.push({ query: q.query, error: e.message });
      console.error('[query error]', q.query, e.message);
    }
  }

  await sb(`/rest/v1/discovery_runs?id=eq.${runId}`, {
    method: 'PATCH',
    body: {
      finished_at: new Date().toISOString(),
      queries_used: queries.length,
      candidates, inserted, updated, skipped_dupes: skippedDupes, skipped_low: skippedLow,
      errors,
      stats: { quota_used: quotaUsed },
    },
    prefer: 'return=minimal',
  });

  console.log(`[run] done — ${inserted} new / ${skippedDupes} dupes / ${skippedLow} low quality / quota ${quotaUsed}`);
  if (errors.length) console.log(`[run] ${errors.length} errors`);
}

run().catch(e => { console.error('[fatal]', e); process.exit(1); });
