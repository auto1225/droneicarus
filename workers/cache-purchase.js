/**
 * cache-purchase.js — Cloudflare Worker
 *
 * Triggered after a successful purchase. Streams the pilot's external-hosted
 * file (Dropbox / Vimeo / GDrive / Frame.io / WeTransfer) into our R2 bucket
 * so the buyer gets a stable signed URL even if the pilot's link breaks.
 *
 * Endpoint:
 *   POST /cache
 *     headers:
 *       Authorization: Bearer <buyer's Supabase JWT>
 *       Content-Type: application/json
 *     body: { "orderId": "DI-2026-12345" }
 *
 * Response:
 *   200 { ok: true, cached_url, cache_expires_at }
 *   404 if order or video not found
 *   401 if JWT invalid or user is not the buyer
 *   422 if video has no external_url (storage_path mode — no caching needed)
 *
 * Wrangler config (wrangler.toml in this folder):
 *   [[r2_buckets]]
 *   binding   = "CACHE_BUCKET"
 *   bucket_name = "droneicarus-cache"
 *
 *   [vars]
 *   SUPABASE_URL = "https://eotsbncgkgewgbemaarp.supabase.co"
 *
 *   [secrets]   # set via: wrangler secret put SUPABASE_SERVICE_KEY
 *   SUPABASE_SERVICE_KEY = "sb_secret_..."
 *
 * Deploy:   wrangler deploy
 */

export default {
  async fetch(req, env, ctx) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(req.url);
    // Route: /download — stream an R2 object to the buyer (auth-gated)
    if (url.pathname === '/download' && req.method === 'GET') {
      return handleDownload(req, env, url);
    }
    // /cache requires POST
    if (url.pathname === '/cache' && req.method !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }
    if (url.pathname !== '/cache') {
      return json(404, { error: 'Not found' });
    }

    // 1. Extract buyer JWT
    const auth = req.headers.get('Authorization') || '';
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!jwt) return json(401, { error: 'Missing JWT' });

    // 2. Parse body
    let body;
    try { body = await req.json(); } catch { return json(400, { error: 'Bad JSON' }); }
    const orderId = body?.orderId;
    if (!orderId) return json(400, { error: 'orderId required' });

    // 3. Verify buyer + load order via Supabase REST (using buyer's JWT — RLS will
    //    restrict to their own orders)
    const orderRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?select=id,buyer_id,video_id,cached_url,cache_expires_at&id=eq.${encodeURIComponent(orderId)}&limit=1`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${jwt}` } }
    );
    if (!orderRes.ok) return json(orderRes.status, { error: `order lookup ${orderRes.status}` });
    const orders = await orderRes.json();
    if (!orders.length) return json(404, { error: 'Order not found or not yours' });
    const order = orders[0];

    // Already cached & not expired? Just return it.
    if (order.cached_url && order.cache_expires_at && new Date(order.cache_expires_at) > new Date()) {
      return json(200, { ok: true, cached_url: order.cached_url, cache_expires_at: order.cache_expires_at, cached: true, from: 'existing' });
    }

    // 4. Load video.external_url (use service key — RLS may block buyer)
    const videoRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/videos?select=id,external_url,external_provider,storage_path,title&id=eq.${encodeURIComponent(order.video_id)}&limit=1`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    if (!videoRes.ok) return json(videoRes.status, { error: 'video lookup failed' });
    const videos = await videoRes.json();
    if (!videos.length) return json(404, { error: 'Video not found' });
    const video = videos[0];

    if (!video.external_url) {
      return json(422, { error: 'Video uses internal storage, no external cache needed', storage_path: video.storage_path });
    }

    // 5. Stream the external file → R2
    const fetchUrl = normalizeForDownload(video.external_url, video.external_provider);
    const headRes = await fetch(fetchUrl, { method: 'HEAD' });
    if (!headRes.ok) return json(502, { error: `external link broken: ${headRes.status}` });

    const ext = guessExtension(headRes.headers.get('content-type'), fetchUrl);
    const r2Key = `cache/${order.id}/${video.id}.${ext}`;

    // Stream the body (don't buffer in memory — large files)
    const fileRes = await fetch(fetchUrl);
    if (!fileRes.ok || !fileRes.body) return json(502, { error: `external fetch failed: ${fileRes.status}` });

    await env.CACHE_BUCKET.put(r2Key, fileRes.body, {
      httpMetadata: {
        contentType: headRes.headers.get('content-type') || 'video/mp4',
        contentDisposition: `attachment; filename="${safeFilename(video.title)}.${ext}"`,
      },
      customMetadata: {
        order_id: order.id,
        video_id: video.id,
        cached_at: new Date().toISOString(),
      },
    });

    // 6. Update DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const updRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ cached_url: r2Key, cache_expires_at: expiresAt }),
      }
    );
    if (!updRes.ok) {
      const t = await updRes.text();
      return json(500, { error: `db update failed: ${t.slice(0, 200)}` });
    }

    return json(200, { ok: true, cached_url: r2Key, cache_expires_at: expiresAt, cached: true, from: 'fresh' });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization,content-type',
  };
}
function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
function safeFilename(s) {
  return (s || 'clip').replace(/[^\w\-]+/g, '_').slice(0, 60);
}
function guessExtension(ct, url) {
  if (ct) {
    if (ct.includes('mp4')) return 'mp4';
    if (ct.includes('quicktime')) return 'mov';
    if (ct.includes('matroska')) return 'mkv';
    if (ct.includes('webm')) return 'webm';
  }
  const m = url.match(/\.(mp4|mov|mkv|webm|avi|m4v)(\?|$)/i);
  return m ? m[1].toLowerCase() : 'mp4';
}
function normalizeForDownload(url, provider) {
  // Dropbox: ensure dl=1 for direct download (raw bytes, no HTML wrapper)
  if (provider === 'dropbox') {
    if (/[?&]dl=0\b/.test(url)) return url.replace(/([?&])dl=0\b/, '$1dl=1');
    if (!/[?&]dl=1\b/.test(url)) return url + (url.includes('?') ? '&' : '?') + 'dl=1';
    return url;
  }
  // Google Drive: convert /file/d/{id}/view → uc?export=download&id={id}
  if (provider === 'gdrive') {
    const m = url.match(/\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    return url;
  }
  // Others: pass through
  return url;
}


// GET /download?key=<R2 path>&t=<buyer JWT>
// Validates the JWT belongs to the buyer of the order that owns this R2 key,
// then streams the R2 object back with attachment disposition.
async function handleDownload(req, env, url) {
  const key = url.searchParams.get('key');
  const jwt = url.searchParams.get('t') || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/, '');
  if (!key || !jwt) return json(400, { error: 'key and t (JWT) required' });

  // Load order by cached_url == key (using buyer's JWT so RLS restricts to their own)
  const ordRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/orders?select=id,video_id,cache_expires_at,cached_url&cached_url=eq.${encodeURIComponent(key)}&limit=1`,
    { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${jwt}` } }
  );
  if (!ordRes.ok) return json(ordRes.status, { error: 'order lookup failed' });
  const orders = await ordRes.json();
  if (!orders.length) return json(404, { error: 'Not your order, or key invalid' });
  const ord = orders[0];

  // Check expiry
  if (ord.cache_expires_at && new Date(ord.cache_expires_at) < new Date()) {
    return json(410, { error: 'Download window expired', expired_at: ord.cache_expires_at });
  }

  // Fetch R2 object
  const obj = await env.CACHE_BUCKET.get(key);
  if (!obj) return json(404, { error: 'Cache miss — file not found in R2' });

  const headers = new Headers(corsHeaders());
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'private, max-age=300');

  return new Response(obj.body, { headers });
}
