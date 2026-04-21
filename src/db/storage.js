// src/db/storage.js — upload helpers for Supabase Storage
import { supabase } from '../supabase';

/**
 * Upload a source video file to the private `videos` bucket.
 * Path: videos/{ownerId}/{videoId}.{ext}
 */
export async function uploadVideo({ file, ownerId, videoId, onProgress }) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${ownerId}/${videoId}.${ext}`;
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
  if (error) throw error;
  return { path, ...data };
}

/**
 * Upload a thumbnail to the public `thumbs` bucket.
 * Path: thumbs/{ownerId}/{videoId}.jpg
 */
export async function uploadThumb({ file, ownerId, videoId }) {
  const ext = file.name?.split('.').pop().toLowerCase() || 'jpg';
  const path = `${ownerId}/${videoId}.${ext}`;
  const { data, error } = await supabase.storage
    .from('thumbs')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return { path, ...data };
}

/**
 * Upload an avatar to the public `avatars` bucket.
 * Path: avatars/{userId}.{ext}
 */
export async function uploadAvatar({ file, userId }) {
  const ext = file.name?.split('.').pop().toLowerCase() || 'jpg';
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return publicUrl('avatars', path);
}

/** Return public URL for a file in a public bucket. */
export function publicUrl(bucket, path) {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl;
}

/** Generate a signed URL for a private-bucket file (e.g. videos). */
export async function signedUrl(bucket, path, expiresIn = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) { console.warn('[storage] signed url:', error.message); return null; }
  return data?.signedUrl;
}
