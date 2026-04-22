// src/db/commerce.js — orders, payouts, reviews
import { supabase } from '../supabase';
import { ORDERS as MOCK_ORDERS, PAYOUTS as MOCK_PAYOUTS, REVIEWS as MOCK_REVIEWS } from '../data';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

// ——— Orders ———
export async function fetchOrders({ buyerId } = {}) {
  if (!USE_SUPABASE) return MOCK_ORDERS;
  const { data: { user } } = await supabase.auth.getUser();
  const uid = buyerId || user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, video_id, license, subtotal, tax, total, currency,
      payment_brand, payment_last4, status, file_format, file_size, created_at,
      cached_url, cache_expires_at, single_download_agreed, download_count,
      first_download_at, last_download_at,
      video:videos!video_id ( id, title, thumb_path, thumb_url, youtube_id, yt_id, source, external_url, storage_path, resolution, duration_s )
    `)
    .eq('buyer_id', uid)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[orders]', error.message); return MOCK_ORDERS; }
  return (data ?? []).map(o => ({
    id: o.id,
    videoId: o.video_id,
    license: capitalize(o.license),
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    total: Number(o.total),
    card: o.payment_last4 ? `${o.payment_brand} •• ${o.payment_last4}` : o.payment_brand,
    date: formatDateTime(o.created_at),
    fileFormat: o.file_format,
    fileSize: o.file_size,
    status: o.status,
    cachedUrl: o.cached_url,
    cacheExpiresAt: o.cache_expires_at,
    singleDownloadAgreed: o.single_download_agreed,
    downloadCount: o.download_count ?? 0,
    firstDownloadAt: o.first_download_at,
    lastDownloadAt: o.last_download_at,
    video: o.video,
  }));
}

export async function fetchOrder(id) {
  if (!USE_SUPABASE) return MOCK_ORDERS.find(o => o.id === id) ?? null;
  const { data, error } = await supabase.from('orders').select('*, video:videos!video_id(*)').eq('id', id).maybeSingle();
  if (error) { console.warn('[order]', error.message); return null; }
  return data;
}

export async function createOrder({ videoId, license, subtotal, tax, total, paymentBrand, paymentLast4, singleDownloadAgreed = false }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to purchase');
  const id = `DI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const { data, error } = await supabase.from('orders').insert({
    id,
    buyer_id: user.id,
    video_id: videoId,
    license,
    subtotal, tax, total,
    payment_brand: paymentBrand,
    payment_last4: paymentLast4,
    status: 'complete',
    file_format: 'MP4 H.265',
    single_download_agreed: !!singleDownloadAgreed,
    cache_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('*').single();
  if (error) throw error;

  // Fire-and-forget: trigger Cloudflare Worker to copy external file to R2.
  // We don't await the result — the buyer's My Purchases page will poll for cached_url.
  // Awaiting would block the thank-you screen for large files.
  if (data?.id) {
    import('./cache').then(({ triggerCachePurchase }) => {
      triggerCachePurchase(data.id).then(r => {
        if (r.ok) console.log('[cache] purchase cached:', r.cached_url);
      });
    });
  }
  return data;
}


// Log a download event (chargeback defense + analytics)
export async function logDownloadEvent({ orderId, videoId, bytesDelivered, httpStatus }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const body = {
      order_id: orderId,
      video_id: videoId,
      buyer_id: user?.id,
      user_agent: (typeof navigator !== 'undefined') ? navigator.userAgent : null,
      bytes_delivered: bytesDelivered ?? null,
      http_status: httpStatus ?? 200,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('download_events').insert(body);
    if (error) { console.warn('[download_events]', error.message); return false; }
    // Bump counter + set timestamps on order (fire-and-forget)
    supabase.from('orders').update({
      download_count: (await fetchDownloadCount(orderId)) + 1,
      last_download_at: new Date().toISOString(),
    }).eq('id', orderId).then(() => {});
    return true;
  } catch (e) {
    console.warn('[logDownloadEvent]', e.message);
    return false;
  }
}
async function fetchDownloadCount(orderId) {
  const { data } = await supabase.from('orders').select('download_count').eq('id', orderId).maybeSingle();
  return data?.download_count ?? 0;
}

// Build a signed URL for an R2 cache_url (via the same Worker — /signed endpoint)
// Or, if your Worker only stores path keys, fetch through a presign worker endpoint.
// Simpler: just return the Worker URL with path since our Worker can also serve auth'd fetch.
export async function buildCacheDownloadUrl(cachedPath) {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CACHE_WORKER_URL) || '';
  if (!base) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  // Worker download endpoint will add R2 presign server-side. For now, point at /download?key=...
  return `${base}/download?key=${encodeURIComponent(cachedPath)}&t=${encodeURIComponent(token || '')}`;
}

// ——— Payouts ———
export async function fetchPayouts({ pilotId } = {}) {
  if (!USE_SUPABASE) return MOCK_PAYOUTS;
  const { data: { user } } = await supabase.auth.getUser();
  const uid = pilotId || user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('pilot_id', uid)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[payouts]', error.message); return MOCK_PAYOUTS; }
  return data ?? [];
}

// ——— Reviews ———
export async function fetchReviews(videoId) {
  if (!USE_SUPABASE) return MOCK_REVIEWS;
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, role, body, created_at, author:profiles!author_id(display_name, handle)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[reviews]', error.message); return MOCK_REVIEWS; }
  return (data ?? []).map(r => ({
    author: r.author?.display_name || 'Anonymous',
    role: r.role || '',
    rating: r.rating,
    date: humanAgo(r.created_at),
    text: r.body,
  }));
}

export async function postReview({ videoId, rating, body, role }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to review');
  const { error } = await supabase.from('reviews').upsert({
    video_id: videoId,
    author_id: user.id,
    rating, body, role,
  });
  if (error) throw error;
}

// ——— helpers ———
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function humanAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.round(d / 7)} weeks ago`;
  if (d < 365) return `${Math.round(d / 30)} months ago`;
  return `${Math.round(d / 365)} years ago`;
}
