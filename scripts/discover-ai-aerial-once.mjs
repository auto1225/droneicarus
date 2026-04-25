// scripts/discover-ai-aerial-once.mjs
// One-shot YouTube discovery for AI-generated aerial / drone footage.
// Inserts videos into the `videos` table with tags[0]='ai-aerial' so the
// Map sidebar slot + Explore filter pick them up automatically.
//
// ENV: YT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/discover-ai-aerial-once.mjs

const YT_API_KEY = process.env.YT_API_KEY;
const SUPA_URL   = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPA_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_PER_QUERY = Number(process.env.MAX_PER_QUERY || 25);
const DAILY_QUOTA   = Number(process.env.DAILY_QUOTA_UNITS || 9000);

if (!YT_API_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('Missing env: YT_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const QUERIES = [
  'Sora 2 drone aerial cinematic',
  'Sora drone footage AI generated',
  'Sora aerial city flythrough',
  'Sora generated landscape aerial 4K',
  'Veo 3 drone aerial AI footage',
  'Google Veo aerial cinematic',
  'Veo drone city sunset AI',
  'Runway Gen-3 aerial drone',
  'Runway Gen-2 cinematic flythrough',
  'Runway AI drone over mountains',
  'Kling AI aerial drone cinematic',
  'Kling 2.0 drone footage AI',
  'Kling AI city flyover',
  'Luma Dream Machine drone',
  'Luma AI aerial cinematic',
  'Luma Ray drone footage',
  'Pika aerial drone cinematic',
  'Pika labs drone flyover',
  'Pixverse AI drone aerial',
  'Hailuo AI drone cinematic',
  'Hailuo 02 aerial AI footage',
  'AI generated drone footage cinematic',
  'AI aerial fly through dystopian city',
  'AI generated aerial seascape',
  'AI-generated drone cinematic 4K',
  'AI drone shot showreel',
  'text to video drone aerial',
  'text to video aerial cinematic',
  'AI cinematic drone reel',
  'AI surrealist aerial flythrough',
  'Sora drone over alien planet',
  'Veo drone Tokyo neon AI',
  'Runway aerial Faroe Islands AI',
  'Kling AI aerial Iceland',
  'Luma AI Antarctica drone',
];

let quotaUsed = 0;

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPA_URL + path, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

async function ytSearch(q) {
  quotaUsed += 100;
  const params = new URLSearchParams({
    key: YT_API_KEY, part: 'snippet', q, type: 'video',
    videoEmbeddable: 'true', videoDuration: 'medium',
    maxResults: '25', order: 'relevance',
    relevanceLanguage: 'en', safeSearch: 'moderate',
  });
  const res = await fetch('https://www.googleapis.com/youtube/v3/search?' + params);
  const json = await res.json();
  if (!res.ok) throw new Error(`YT search ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.items || [];
}

async function ytVideos(ids) {
  if (!ids.length) return [];
  quotaUsed += 1;
  const params = new URLSearchParams({
    key: YT_API_KEY,
    part: 'snippet,contentDetails,statistics,recordingDetails,status',
    id: ids.join(','), maxResults: '50',
  });
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?' + params);
  const json = await res.json();
  if (!res.ok) throw new Error(`YT videos ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.items || [];
}

function parseISO8601Duration(iso) {
  const m = (iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

function looksLikeAiContent(snippet) {
  const text = ((snippet.title || '') + ' ' + (snippet.description || '')).toLowerCase();
  const aiHits = ['sora', 'veo', 'runway', 'gen-3', 'gen-2', 'kling', 'luma', 'pika', 'pixverse', 'hailuo', 'minimax', 'ai generated', 'ai-generated', 'text to video', 'text-to-video', 'generative video'].filter(k => text.includes(k)).length;
  const droneHits = ['drone', 'aerial', 'fly through', 'flythrough', 'cinematic', 'flyover', 'fly over', 'birds eye', "bird's eye"].filter(k => text.includes(k)).length;
  return aiHits >= 1 && droneHits >= 1;
}

function qualityScore(v) {
  const views = Number(v.statistics?.viewCount || 0);
  const likes = Number(v.statistics?.likeCount || 0);
  const dur = parseISO8601Duration(v.contentDetails?.duration || 'PT0S');
  const hd = v.contentDetails?.definition === 'hd';
  let s = 0;
  if (views >= 1_000)   s += 1;
  if (views >= 10_000)  s += 1;
  if (views >= 100_000) s += 1;
  if (likes > 0 && views > 0 && (likes / views) >= 0.01) s += 2;
  if (dur >= 30 && dur <= 600) s += 2;
  if (hd) s += 1;
  return Math.min(10, s);
}

async function run() {
  console.log(`[ai-aerial] starting — ${QUERIES.length} queries, max ${MAX_PER_QUERY} per query`);
  const runRow = await sb('/rest/v1/discovery_runs', {
    method: 'POST',
    body: { triggered_by: 'ai-aerial-oneshot' },
    prefer: 'return=representation',
  });
  const runId = Array.isArray(runRow) ? runRow[0].id : runRow.id;

  let candidates = 0, inserted = 0, skippedDupes = 0, skippedLow = 0, skippedNotAi = 0;
  const errors = [];

  for (const query of QUERIES) {
    if (quotaUsed >= DAILY_QUOTA) { console.log(`[ai-aerial] quota cap (${quotaUsed}) — stopping`); break; }
    try {
      console.log(`[q] ${query}`);
      const items = await ytSearch(query);
      const ids = items.map(it => it.id?.videoId).filter(Boolean).slice(0, MAX_PER_QUERY);
      if (!ids.length) continue;
      const existingRes = await sb('/rest/v1/videos?select=youtube_id&youtube_id=in.(' + ids.map(i => '"' + i + '"').join(',') + ')');
      const existing = new Set(existingRes.map(r => r.youtube_id));
      const newIds = ids.filter(i => !existing.has(i));
      skippedDupes += ids.length - newIds.length;
      if (!newIds.length) continue;
      const details = await ytVideos(newIds);
      candidates += details.length;
      for (const v of details) {
        try {
          const snippet = v.snippet || {};
          if (!looksLikeAiContent(snippet)) { skippedNotAi++; continue; }
          const score = qualityScore(v);
          if (score < 2) { skippedLow++; continue; }
          const ytTags = (snippet.tags || []).slice(0, 8).filter(t => !!t);
          const row = {
            title: (snippet.title || '(untitled)').slice(0, 240),
            description: (snippet.description || '').slice(0, 5000),
            category: 'ai-aerial',
            tags: ['ai-aerial', 'ai-generated', 'drone', ...ytTags],
            status: 'published',
            source: 'youtube',
            youtube_id: v.id,
            youtube_channel: snippet.channelTitle,
            youtube_published_at: snippet.publishedAt,
            ai_summary: snippet.description ? snippet.description.slice(0, 280) : null,
            ai_quality_score: score,
            discovery_batch_id: runId,
            inferred_location_raw: { source: 'ai-generated', value: 'no real-world coords' },
            lat: null, lon: null,
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
            thumb_url: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.standard?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
            resolution: v.contentDetails?.definition === 'hd' ? 'HD' : 'SD',
            duration_s: parseISO8601Duration(v.contentDetails?.duration || 'PT0S'),
            price_usd: 0,
            published_at: new Date().toISOString(),
          };
          await sb('/rest/v1/videos?on_conflict=youtube_id', { method: 'POST', body: row, prefer: 'return=minimal,resolution=merge-duplicates' });
          inserted++;
        } catch (e) { errors.push({ query, videoId: v.id, error: e.message }); }
      }
    } catch (e) { errors.push({ query, error: e.message }); }
  }

  try {
    await sb(`/rest/v1/discovery_runs?id=eq.${runId}`, {
      method: 'PATCH',
      body: { finished_at: new Date().toISOString(), queries_used: QUERIES.length, candidates, inserted, skipped_dupes: skippedDupes, skipped_low: skippedLow, errors: errors.slice(0, 50), stats: { quota_used: quotaUsed, skipped_not_ai: skippedNotAi } },
      prefer: 'return=minimal',
    });
  } catch (_) {}

  console.log(`[ai-aerial] done — ${inserted} new / ${skippedDupes} dupes / ${skippedNotAi} not AI / ${skippedLow} low / quota ${quotaUsed}`);
}

run().catch(e => { console.error('[fatal]', e); process.exit(1); });
