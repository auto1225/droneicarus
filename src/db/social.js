// src/db/social.js — likes, follows, collections
import { supabase } from '../supabase';

// ——— Likes ———
export async function hasLiked(videoId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('likes')
    .select('video_id').eq('user_id', user.id).eq('video_id', videoId).maybeSingle();
  return !!data;
}

export async function toggleLike(videoId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to like');
  const liked = await hasLiked(videoId);
  if (liked) {
    await supabase.from('likes').delete().match({ user_id: user.id, video_id: videoId });
    return false;
  }
  await supabase.from('likes').insert({ user_id: user.id, video_id: videoId });
  return true;
}

// ——— Follows ———
export async function isFollowing(followeeId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('follows')
    .select('followee_id').eq('follower_id', user.id).eq('followee_id', followeeId).maybeSingle();
  return !!data;
}

export async function toggleFollow(followeeId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to follow');
  const following = await isFollowing(followeeId);
  if (following) {
    await supabase.from('follows').delete().match({ follower_id: user.id, followee_id: followeeId });
    return false;
  }
  await supabase.from('follows').insert({ follower_id: user.id, followee_id: followeeId });
  return true;
}

// ——— Collections (Pinterest-style boards) ———
import { COLLECTIONS as MOCK_COLLECTIONS } from '../data';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

export async function fetchCollections({ ownerId } = {}) {
  if (!USE_SUPABASE) return MOCK_COLLECTIONS;
  const { data: { user } } = await supabase.auth.getUser();
  const targetOwner = ownerId || user?.id;
  if (!targetOwner) return [];
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description, is_private, cover_urls, updated_at')
    .eq('owner_id', targetOwner)
    .order('updated_at', { ascending: false });
  if (error) { console.warn('[collections]', error.message); return MOCK_COLLECTIONS; }
  return (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    count: c.cover_urls?.length || 0,
    cover: c.cover_urls || [],
    updated: humanDate(c.updated_at),
    private: c.is_private,
  }));
}

export async function createCollection({ name, description, isPrivate = false }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to create collections');
  const { data, error } = await supabase.from('collections').insert({
    owner_id: user.id,
    name,
    description,
    is_private: isPrivate,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function addToCollection({ collectionId, videoId }) {
  const { error } = await supabase.from('collection_items').insert({
    collection_id: collectionId,
    video_id: videoId,
  });
  if (error) throw error;
}

function humanDate(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}
