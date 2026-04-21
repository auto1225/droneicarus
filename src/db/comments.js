// src/db/comments.js — threaded comments for the player page
import { supabase } from '../supabase';

export async function fetchComments(videoId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, body, parent_id, likes_count, pinned, created_at,
      author:profiles!author_id (id, handle, display_name, avatar_url, pilot_verified, role)
    `)
    .eq('video_id', videoId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { console.warn('[comments]', error.message); return []; }
  return buildThread(data ?? []);
}

/**
 * Post a new comment (top-level or reply).
 * Returns the created row, or throws on error.
 */
export async function postComment({ videoId, body, parentId = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to comment');
  const { data, error } = await supabase.from('comments').insert({
    video_id: videoId,
    author_id: user.id,
    body,
    parent_id: parentId,
  }).select(`
    id, body, parent_id, likes_count, pinned, created_at,
    author:profiles!author_id (id, handle, display_name, avatar_url, pilot_verified, role)
  `).single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

/** Group flat list into a tree of top-level comments, each with `replies[]`. */
function buildThread(rows) {
  const byParent = new Map();
  rows.forEach(r => {
    const k = r.parent_id || '__root__';
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(r);
  });
  const roots = byParent.get('__root__') || [];
  return roots.map(r => ({ ...r, replies: byParent.get(r.id) || [] }));
}
