// src/db/videos.js — video + location data access layer
// When Supabase is populated, these replace direct VIDEOS/LOCATIONS reads.
import { supabase } from '../supabase';
import { VIDEOS as MOCK_VIDEOS, LOCATIONS as MOCK_LOCATIONS } from '../data';

// Feature flag — falls back to mock data if Supabase tables are empty.
// Once the seed SQL is run in production, set this to true via env var.
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

export async function fetchLocations() {
  if (!USE_SUPABASE) return MOCK_LOCATIONS;
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('featured', { ascending: false });
  if (error) { console.warn('[db] locations:', error.message); return MOCK_LOCATIONS; }
  return data ?? MOCK_LOCATIONS;
}

export async function fetchVideos({ limit = 100, category, locationId, ownerId } = {}) {
  if (!USE_SUPABASE) {
    let v = [...MOCK_VIDEOS];
    if (category && category !== 'all') v = v.filter(x => x.category === category);
    if (locationId) v = v.filter(x => x.locationId === locationId);
    if (ownerId) v = v.filter(x => x.creator?.handle === ownerId);
    return v.slice(0, limit);
  }
  let q = supabase.from('videos').select(`
    id, slug, title, description, category, resolution, duration_s, views, likes,
    price_usd, tags, thumb_path, yt_id, published_at,
    location_id,
    owner:profiles!owner_id (id, handle, display_name, avatar_url, pilot_verified)
  `).eq('status', 'published').limit(limit);
  if (category && category !== 'all') q = q.eq('category', category);
  if (locationId) q = q.eq('location_id', locationId);
  if (ownerId) q = q.eq('owner_id', ownerId);
  const { data, error } = await q;
  if (error) { console.warn('[db] videos:', error.message); return MOCK_VIDEOS.slice(0, limit); }
  return (data ?? []).map(adaptVideo);
}

export async function fetchVideo(id) {
  if (!USE_SUPABASE) return MOCK_VIDEOS.find(v => v.id === id) ?? null;
  const { data, error } = await supabase
    .from('videos')
    .select(`*, owner:profiles!owner_id (id, handle, display_name, avatar_url, pilot_verified)`)
    .eq('id', id)
    .maybeSingle();
  if (error) { console.warn('[db] video:', error.message); return null; }
  return data ? adaptVideo(data) : null;
}

// Map DB shape → UI shape used by existing components
function adaptVideo(row) {
  return {
    id: row.id,
    ytId: row.yt_id,
    title: row.title,
    locationId: row.location_id,
    category: row.category,
    creator: row.owner ? {
      handle: row.owner.handle,
      name: row.owner.display_name,
      verified: row.owner.pilot_verified,
    } : null,
    duration: secondsToClock(row.duration_s),
    views: row.views ?? 0,
    uploadedDaysAgo: row.published_at ? Math.max(0, Math.round((Date.now() - new Date(row.published_at)) / 86400000)) : 0,
    price: Number(row.price_usd) || 0,
    resolution: row.resolution,
    likes: row.likes ?? 0,
    description: row.description ?? '',
    tags: row.tags ?? [],
    thumbPath: row.thumb_path,
  };
}

function secondsToClock(s) {
  if (!s || Number.isNaN(s)) return '0:00';
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
