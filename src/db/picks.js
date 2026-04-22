// src/db/picks.js — fetch home right-sidebar slots
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = () => ({ apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` });

async function get(path) {
  try {
    const r = await fetch(`${SUPA_URL}${path}`, { headers: headers() });
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

export async function fetchSidebarSlots() {
  const [picks, topVids, ads, liveActive] = await Promise.all([
    get('/rest/v1/home_sidebar_picks?select=id,kind,ref_id,payload,sort_order&active=eq.true&order=sort_order.asc&limit=30'),
    get('/rest/v1/videos?select=id,slug,title,youtube_id,thumb_url,views,duration_s,owner_id&order=views.desc.nullslast&limit=8'),
    get('/rest/v1/ads?select=id,title,brand,image_url,click_url,cta_label&active=eq.true&limit=4'),
    get('/rest/v1/live_streams?select=id,title,thumb_url,status,yt_video_id,viewers_peak&status=eq.live&order=started_at.desc.nullslast&limit=2'),
  ]);

  const liveCurated = picks.filter(p => p.kind === 'live');
  const adCurated   = picks.filter(p => p.kind === 'ad');
  const hotCurated  = picks.filter(p => p.kind === 'hot');

  // HOT: prefer curated picks, else top-viewed
  let hot = [];
  if (hotCurated.length > 0) {
    const refIds = hotCurated.map(h => `"${h.ref_id}"`).filter(Boolean).join(',');
    if (refIds) {
      const rows = await get(`/rest/v1/videos?select=id,slug,title,youtube_id,thumb_url,views,duration_s,owner_id&id=in.(${refIds})&limit=20`);
      const byId = Object.fromEntries(rows.map(r => [r.id, r]));
      hot = hotCurated.map(h => byId[h.ref_id]).filter(Boolean);
    }
  }
  if (hot.length === 0) hot = topVids;

  // LIVE: empty if nothing live
  let live = liveActive;
  if (liveCurated.length > 0) {
    const refIds = liveCurated.map(l => `"${l.ref_id}"`).filter(Boolean).join(',');
    if (refIds) {
      live = await get(`/rest/v1/live_streams?select=id,title,thumb_url,status,yt_video_id,viewers_peak&id=in.(${refIds})&status=in.(scheduled,live)&limit=8`);
    }
  }

  // ADS: prefer curated payload, else any active ad
  let adRows = [];
  if (adCurated.length > 0) {
    adRows = adCurated.map(a => ({ id: a.id, ...(a.payload || {}) }));
  } else {
    adRows = ads;
  }

  return { hot, live, ads: adRows };
}
