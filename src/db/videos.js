// src/db/videos.js — video + location data access via raw REST (avoids
// Supabase JS hang). Returns DB rows adapted to the shape the existing UI
// components expect.

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function restGet(path) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const res = await fetch(SUPA_URL + path, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      // Request a very large range so Supabase returns all matching rows
      // instead of the default 1000-row cap. Server-side PG still caps this
      // to whatever max_rows is configured.
      'Range-Unit': 'items',
      Range: '0-49999',
    },
  });
  if (!res.ok) {
    console.warn('[db]', path, res.status, (await res.text()).slice(0, 120));
    return [];
  }
  return await res.json();
}

export async function fetchLocations() {
  const rows = await restGet('/rest/v1/locations?select=*&order=featured.desc.nullslast,name.asc');
  return rows;
}

export async function fetchVideos({ limit = null, category, locationId, ownerId, source } = {}) {
  const parts = [
    `select=id,title,description,category,resolution,duration_s,views,likes,price_usd,license_tiers,owner_id,is_demo,tags,thumb_path,thumb_url,yt_id,youtube_id,youtube_channel,source,lat,lon,published_at,location_id,ai_quality_score,status`,
    `status=eq.published`,
    `order=published_at.desc.nullslast`,
  ];
  if (limit != null) parts.push(`limit=${limit}`);
  if (category && category !== 'all') parts.push(`category=eq.${encodeURIComponent(category)}`);
  if (locationId) parts.push(`location_id=eq.${encodeURIComponent(locationId)}`);
  if (ownerId)    parts.push(`owner_id=eq.${encodeURIComponent(ownerId)}`);
  if (source)     parts.push(`source=eq.${encodeURIComponent(source)}`);
  const rows = await restGet('/rest/v1/videos?' + parts.join('&'));
  return rows.map(adaptVideo);
}

export async function fetchVideo(id) {
  // id may be a UUID (pilot original) or a YouTube id (discovered)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const key = isUuid ? 'id' : 'youtube_id';
  const rows = await restGet(`/rest/v1/videos?select=*&${key}=eq.${encodeURIComponent(id)}&limit=1`);
  return rows.length > 0 ? adaptVideo(rows[0]) : null;
}

// Map DB shape → UI shape
function adaptVideo(row) {
  const isYouTube = row.source === 'youtube';
  const ytId = isYouTube ? (row.youtube_id || row.yt_id) : row.yt_id;
  return {
    id: row.id,
    source: row.source || 'original',
    ytId,
    youtubeId: ytId,
    title: row.title,
    description: row.description ?? '',
    locationId: row.location_id,
    category: row.category,
    lat: row.lat,
    lon: row.lon,
    // YouTube rows have a thumb_url hosted on ytimg; pilot rows use a Supabase storage thumb_path
    thumbUrl: row.thumb_url
      || (row.thumb_path ? `${SUPA_URL}/storage/v1/object/public/thumbs/${row.thumb_path}` : null)
      || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null),
    thumbPath: row.thumb_path,
    storagePath: row.storage_path,
    duration: secondsToClock(row.duration_s),
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    uploadedDaysAgo: row.published_at
      ? Math.max(0, Math.round((Date.now() - new Date(row.published_at)) / 86400000))
      : 0,
    price: Number(row.price_usd) || 0,
    licenseTiers: Array.isArray(row.license_tiers) ? row.license_tiers : [],
    ownerId: row.owner_id || null,
    isDemo: !!row.is_demo,
    resolution: row.resolution,
    tags: row.tags ?? [],
    qualityScore: row.ai_quality_score,
    channel: row.youtube_channel,
    creator: row.youtube_channel ? {
      handle: row.youtube_channel.toLowerCase().replace(/\s+/g, ''),
      name: row.youtube_channel,
      verified: false,
      external: true,
    } : null,
  };
}

function secondsToClock(s) {
  if (!s || Number.isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}
