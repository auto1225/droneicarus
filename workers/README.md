# droneicarus-cache-purchase Worker

Cloudflare Worker that caches a pilot-hosted external file into R2 the moment a buyer completes payment. Provides a stable, time-limited download link that survives the pilot's link breaking.

## One-time deploy steps

1. **Enable R2** in Cloudflare Dashboard
   https://dash.cloudflare.com/ffafa8061cee01c22bf12b07385fd870/r2/overview
2. **Create the bucket** (after R2 is enabled — assistant can do this via MCP, or run): `wrangler r2 bucket create droneicarus-cache`
3. **Install Wrangler** (if not already):  `npm install -g wrangler`
4. **Authenticate**: `wrangler login`
5. **Set the Supabase service key as a secret**:
   ```
   wrangler secret put SUPABASE_SERVICE_KEY
   # paste: sb_secret_<paste-from-Supabase-dashboard>
   ```
6. **Deploy**: `wrangler deploy`

The Worker URL will be printed — typically `https://droneicarus-cache-purchase.<account>.workers.dev`.
Add that URL as `VITE_CACHE_WORKER_URL` env var in GitHub Actions secrets so the frontend can call it.

## Endpoint

`POST /cache`
- Header: `Authorization: Bearer <buyer Supabase JWT>`
- Body:   `{ "orderId": "DI-2026-12345" }`
- Returns: `{ ok, cached_url, cache_expires_at }`

## How it works

1. Validates buyer JWT against Supabase (RLS lookups)
2. Loads `orders.video_id` → `videos.external_url`
3. Streams the external file directly to R2 via `env.CACHE_BUCKET.put(stream)`
4. Updates `orders.cached_url` + `cache_expires_at` (7 days from now)

If the order is already cached and not expired, returns existing path without re-fetching.

## Free tier headroom

Cloudflare Worker:
- 100,000 requests/day (free) — covers ~3,000 purchases/day comfortably
- Each cache call = 1 request + 1 R2 PUT + 2-3 Supabase reads/writes

R2:
- 10 GB storage free → ~10 average drone clips at any time
- Class A (PUT) ops: 1M/month free
- Class B (GET) ops: 10M/month free
- Egress: free always
