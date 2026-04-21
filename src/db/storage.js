// src/db/storage.js — upload helpers for Supabase Storage.
//
// For uploads we use raw XHR against Storage's REST endpoint so we get real
// progress events (supabase-js's upload() returns a single promise with no
// progress callback). Signed-URL helpers still use the JS SDK because that
// path is a simple POST/GET that resolves quickly.
import { supabase } from '../supabase';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function authToken() {
  try {
    const keys = Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k));
    for (const k of keys) {
      const v = JSON.parse(localStorage.getItem(k) || 'null');
      if (v?.access_token) return v.access_token;
    }
  } catch (_) {}
  return null;
}

/**
 * Upload a File to `bucket` at `path` via raw XHR so we can surface real
 * byte-level progress. Returns { path } on success. Caller can abort by
 * calling the returned `cancel()`.
 */
export function uploadWithProgress({ bucket, path, file, onProgress, upsert = true, cacheControl = '3600' }) {
  const xhr = new XMLHttpRequest();
  const url = `${SUPA_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`;
  const promise = new Promise((resolve, reject) => {
    xhr.open('POST', url);
    const tok = authToken() || SUPA_KEY;
    xhr.setRequestHeader('apikey', SUPA_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + tok);
    if (upsert) xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('cache-control', 'max-age=' + cacheControl);
    if (file.type) xhr.setRequestHeader('content-type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress({ loaded: e.loaded, total: e.total, pct: (e.loaded / e.total) * 100 });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve({ path, ...JSON.parse(xhr.responseText || '{}') }); }
        catch (_) { resolve({ path }); }
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status} ${xhr.responseText?.slice(0, 200)}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(file);
  });
  promise.cancel = () => xhr.abort();
  return promise;
}

/**
 * Upload source video to private `videos` bucket at {ownerId}/{videoId}.{ext}.
 * Returns a promise with a `cancel()` method.
 */
export function uploadVideo({ file, ownerId, videoId, onProgress }) {
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = `${ownerId}/${videoId}.${ext}`;
  const p = uploadWithProgress({ bucket: 'videos', path, file, onProgress });
  // expose path on the promise for chained callers
  const out = p.then(r => ({ path, ...r }));
  out.cancel = p.cancel;
  return out;
}

/** Upload a thumbnail File/Blob to public `thumbs` bucket. */
export async function uploadThumb({ file, ownerId, videoId }) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const path = `${ownerId}/${videoId}.${ext}`;
  await uploadWithProgress({ bucket: 'thumbs', path, file });
  return { path };
}

/** Upload an avatar to public `avatars` bucket at {userId}.{ext}. */
export async function uploadAvatar({ file, userId }) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}.${ext}`;
  await uploadWithProgress({ bucket: 'avatars', path, file });
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
