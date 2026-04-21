// src/db/search.js — cross-entity search
import { supabase } from '../supabase';
import { VIDEOS as MOCK_VIDEOS, LOCATIONS as MOCK_LOCATIONS, CREATORS as MOCK_CREATORS } from '../data';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

/**
 * Returns { videos, locations, creators } matching the query.
 * Falls back to mock filtering when the DB flag is off.
 */
export async function searchAll(q, { limit = 12 } = {}) {
  const query = (q || '').trim().toLowerCase();
  if (!query) return { videos: [], locations: [], creators: [] };

  if (!USE_SUPABASE) {
    return {
      videos: MOCK_VIDEOS.filter(v =>
        v.title.toLowerCase().includes(query) ||
        v.tags?.some(t => t.toLowerCase().includes(query))
      ).slice(0, limit),
      locations: MOCK_LOCATIONS.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.country.toLowerCase().includes(query)
      ).slice(0, limit),
      creators: MOCK_CREATORS.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.handle.toLowerCase().includes(query)
      ).slice(0, limit),
    };
  }

  const like = `%${query}%`;
  const [vidRes, locRes, profRes] = await Promise.all([
    supabase.from('videos')
      .select('id, title, category, resolution, duration_s, views, price_usd, yt_id, location_id, owner:profiles!owner_id (handle, display_name, pilot_verified)')
      .ilike('title', like)
      .eq('status', 'published')
      .limit(limit),
    supabase.from('locations')
      .select('id, name, country, category, featured')
      .or(`name.ilike.${like},country.ilike.${like}`)
      .limit(limit),
    supabase.from('profiles')
      .select('id, handle, display_name, avatar_url, pilot_verified, followers_count')
      .or(`display_name.ilike.${like},handle.ilike.${like}`)
      .limit(limit),
  ]);

  const videos = (vidRes.data || []).map(v => ({
    id: v.id, ytId: v.yt_id, title: v.title, category: v.category, locationId: v.location_id,
    resolution: v.resolution, duration: v.duration_s ? `${Math.floor(v.duration_s/60)}:${String(v.duration_s%60).padStart(2,'0')}` : '',
    views: v.views, price: Number(v.price_usd) || 0,
    creator: v.owner ? { handle: v.owner.handle, name: v.owner.display_name, verified: v.owner.pilot_verified } : null,
  }));
  // Supabase locations lack a video count column — enrich from mock data by id
  const locations = (locRes.data || []).map(l => ({
    ...l,
    videos: MOCK_LOCATIONS.find(ml => ml.id === l.id)?.videos ?? 0,
  }));
  const creators = (profRes.data || []).map(p => ({
    id: p.id, handle: p.handle, name: p.display_name, verified: p.pilot_verified,
    followers: p.followers_count, avatarUrl: p.avatar_url,
  }));
  return { videos, locations, creators };
}
