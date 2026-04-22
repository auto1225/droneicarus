// src/pages/admin/Docs.jsx — Operations & Legal documentation viewer
// Rendered inside AdminShell. Self-contained markdown parser (no extra deps).
import React, { useState, useMemo } from 'react';

const TOPICS = [
  { id: 'overview',       label: 'Overview & Stack',       icon: '◆' },
  { id: 'architecture',   label: 'System Architecture',    icon: '⌧' },
  { id: 'legal',          label: 'Legal & Terms',          icon: '§' },
  { id: 'revenue',        label: 'Revenue & Pricing',      icon: '$' },
  { id: 'storage',        label: 'Storage & R2 Cache',     icon: '⊕' },
  { id: 'discovery',      label: 'Video Discovery Pipeline', icon: '▶' },
  { id: 'schema',         label: 'Database Schema',        icon: '▦' },
  { id: 'deployment',     label: 'Deployment Runbook',     icon: '↑' },
  { id: 'troubleshooting',label: 'Troubleshooting',        icon: '!' },
  { id: 'secrets',        label: 'Secrets & Credentials',  icon: '⚿' },
  { id: 'cost',           label: 'Cost Projections',       icon: '%' },
  { id: 'changelog',      label: 'Changelog',              icon: '⌖' },
];

// ──────────────────────────────────────────────────────────────────────
// Doc bodies — markdown-ish (h1/h2/h3, tables, code blocks, lists, links)
// ──────────────────────────────────────────────────────────────────────
const DOCS = {
overview: `
# Overview & Stack

droneicarus.com — a marketplace for aerial drone footage. Curated YouTube CC-BY clips for free discovery + paid licensing of pilot-uploaded masters.

## Live URLs
- **Public site**: https://droneicarus.com
- **Admin (this page)**: https://droneicarus.com/#admin
- **GitHub repo**: https://github.com/auto1225/droneicarus
- **Cache Worker**: https://droneicarus-cache-purchase.droneicarus.workers.dev

## Service stack (all on free tiers as of 2026-04-22)

| Layer | Service | Tier | What it holds |
|---|---|---|---|
| Frontend | GitHub Pages | Free | React SPA, Vite-built static |
| DB / Auth | Supabase | Free (500MB DB, 1GB storage, 50K MAU) | videos, orders, profiles, site_content, etc. |
| Pilot files (master) | Cloudflare R2 | Free (10GB, unlimited egress) | Just-in-time cache for purchased clips |
| YouTube clip metadata | YouTube Data API v3 | Free (10K units/day) | Discovery only — files stay on YouTube |
| Cache worker | Cloudflare Workers | Free (100K req/day) | Streams pilot's external link → R2 on purchase |
| OAuth | Google OAuth | Free | Sign-in |
| Domain | Gabia (가비아) | Paid annually | DNS → GH Pages |
| Payments | PayPal Smart Buttons | sandbox now, % fee on live | Card + PayPal |

## Two video sources, one table

| source | youtube_id | external_url | storage_path | who paid? |
|---|---|---|---|---|
| 'youtube' | set | null | null | nobody — free CC-BY embed |
| 'original' | null | set (after pilot upload) | optional (legacy) | buyer pays per license |

Both kinds live in \`videos\` table. Player auto-routes by \`source\`.
`,

architecture: `
# System Architecture

## High-level data flow

\`\`\`
                  ┌─────────────────────────┐
                  │   GitHub Pages          │
                  │   droneicarus.com       │
                  │   (React SPA)           │
                  └──────────┬──────────────┘
                             │ REST (JWT)
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌─────────────┐  ┌──────────┐  ┌─────────────┐
      │  Supabase   │  │ YouTube  │  │ Cloudflare  │
      │  Postgres   │  │ Data API │  │   Worker    │
      │  + Storage  │  │   v3     │  │  /cache     │
      │  + Auth     │  │          │  │  /download  │
      └──────┬──────┘  └──────────┘  └──────┬──────┘
             │                              │
             │ background                   │ R2 binding
             │ cron                         │
             ▼                              ▼
      ┌─────────────┐                ┌──────────────┐
      │ GH Actions  │                │  R2 bucket   │
      │ discover    │                │ droneicarus  │
      │ enrich      │                │   -cache     │
      │ deploy      │                └──────────────┘
      └─────────────┘
\`\`\`

## Frontend (Vite + React)

- Single-page app, hash-based routing (\`/#explore\`, \`/#mypage\`, etc.)
- 200+ user-facing strings live in DB (\`site_content\` table) and load via \`useContent('key', 'fallback')\`
- Map: Leaflet + OpenStreetMap tiles
- 33 fine categories collapsed into 13 frontend slot codes (see [Discovery](#)).

## Critical workaround: Supabase JS client hangs

\`supabase.from('xxx').select()\` never resolves on first paint. All initial reads use **raw fetch** to \`/rest/v1/...\` with the publishable key (or session JWT for admin). \`supabase.auth.*\` (signin/signout) works fine — only the table query path was broken.

Files using raw REST: \`src/content/ContentContext.jsx\`, \`src/auth/AuthContext.jsx\`, \`src/db/admin.js\`, \`src/pages/admin/ContentEditor.jsx\`.

## Backend (Supabase)

- **Auth**: email/password + Google OAuth
- **RLS policies** on every table — public reads where appropriate, admin via \`public.is_admin()\` function
- **9 migrations** applied (\`supabase/migrations/*.sql\`)

## Storage strategy (3 tiers)

1. **Supabase Storage** (\`thumbs\` public bucket) — small images, public CDN
2. **Cloudflare R2** (\`droneicarus-cache\`) — pilot master files, just-in-time cached on purchase, 7-day TTL
3. **Pilot's own host** (Dropbox/Vimeo/GDrive/Frame.io/WeTransfer) — long-term storage, we hold only the URL

## Cache Worker (\`workers/cache-purchase.js\`)

Two routes:
- \`POST /cache\` — triggered after order created. Streams pilot's external_url → R2.
- \`GET /download?key=&t=\` — buyer downloads from R2 with JWT validation.

Worker has R2 native binding (\`env.CACHE_BUCKET\`), so no separate auth needed for R2 ops.

## Discovery (background)

GitHub Actions cron runs 4x/day at 01/07/13/19 UTC. Calls YouTube Data API v3 with curated queries from \`discovery_queries\` table, inserts new \`videos\` rows. Followed by enrichment (\`enrich-locations.mjs\`) that geocodes via 5-step pipeline.
`,

legal: `
# Legal & Terms

## Single-download delivery model

We sell **perpetual license** + **one-time delivery within 7 days**. Critical legal points:

### What buyer agrees to (at checkout)

> I understand this is a one-time download. I have 7 days from purchase to download the master file. droneicarus does not keep a copy after that window — I am responsible for backing up the file on my own systems. My usage license is perpetual, but file delivery is a one-time event.

This text is rendered as a **required checkbox** above payment buttons. The agreement is logged to \`orders.single_download_agreed = true\` with timestamp — chargeback defense evidence.

### Why this model is legal

| Jurisdiction | Justification |
|---|---|
| **US (UCC + state)** | Digital goods commonly sold with limited delivery; clear pre-purchase disclosure |
| **EU (CRD + Directive 2019/770)** | Distance selling rules permit limited delivery if disclosed before purchase |
| **Korea (전자상거래법)** | Must disclose delivery terms clearly upfront — checkbox satisfies |
| **UK (Consumer Rights Act)** | "Satisfactory quality, fit for purpose" — once delivered, met |

### Required safeguards (all implemented)

- **Pre-purchase disclosure** — checkbox checked before pay button enables
- **Download verification log** — \`download_events\` table records IP, UA, timestamp, bytes_delivered
- **Reasonable retry window** — 7 days, multiple attempts allowed for connection issues
- **License vs delivery split** — license is perpetual, delivery is one-time event

## Pilot Hosting Terms

> If you link your video from an external host (Dropbox, Vimeo, Google Drive, Frame.io, WeTransfer, etc.), the link must remain accessible for at least 30 days after upload OR until the first purchase, whichever comes first. After a sale, droneicarus caches the file and your link breakage no longer affects buyers.

Stored in \`site_content\` key \`pilot.terms.hosting_min\`.

## Revenue Split Terms

> Pilots keep 70% of each license fee. droneicarus retains 30% to cover payment processing, marketplace operations, and marketing. Payouts are processed monthly for balances ≥ \\$50.

Stored in \`site_content\` key \`pilot.terms.revenue_split\`.

## YouTube videos (free CC-BY only)

We only embed videos with \`videoLicense=creativeCommon\` filter. Player shows YouTube logo + "Watch on YouTube" + creator credit. We do NOT charge for these — they're free discovery content.

## Refund policy

- **File genuinely broken on delivery** → full refund
- **Buyer downloaded successfully but lost their copy** → no refund (per Terms)
- **Pilot link was broken at first cache attempt** → full refund + we contact pilot

## DMCA

- Notices sent to: dmca@droneicarus.com (set up forwarder)
- Counter-notices: 14-day takedown window
- Repeat infringer policy: 3 strikes → account termination

## i18n (Korean)

All legal strings have Korean translations under \`i18n.ko.*\` keys in \`site_content\`. 21 keys total seeded 2026-04-22.

| English key | Korean key | Subject |
|---|---|---|
| \`checkout.policy.body\` | \`i18n.ko.checkout.policy.body\` | 단일 다운로드 동의서 |
| \`license.terms.delivery\` | \`i18n.ko.license.terms.delivery\` | 라이선스 약관 |
| \`pilot.terms.hosting_min\` | \`i18n.ko.pilot.terms.hosting_min\` | 파일럿 호스팅 의무 |
| \`pilot.terms.revenue_split\` | \`i18n.ko.pilot.terms.revenue_split\` | 70/30 수익 분배 |
| \`my_purchases.expiry_notice\` | \`i18n.ko.my_purchases.expiry_notice\` | 7일 만료 안내 |
`,

revenue: `
# Revenue & Pricing

## Current model

- **Pilot keeps 70%** of each license fee
- **droneicarus takes 30%** to cover ops, payment processing, marketing

## Industry comparison

| Platform | Pilot share | Platform share |
|---|---|---|
| Adobe Stock | 33% | 67% |
| Shutterstock | 15-40% (tiered) | 60-85% |
| Getty/iStock | 15-45% (tiered) | 55-85% |
| Pond5 | 50% | 50% |
| Vimeo Stock | 50% | 50% |
| **droneicarus (current)** | **70%** | **30%** |
| VideoHive (Envato) | 50-87.5% (tiered) | 12.5-50% |

Our 70% to creators is **best-in-class** — strongest competitive lever for attracting top pilots.

## Real margin (after fees on our 30%)

| Cost | % of revenue |
|---|---|
| Stripe / PayPal processing fees | ~3-4% |
| Currency conversion (cross-border payouts) | ~1-2% |
| Cloudflare R2 (currently free tier) | 0% |
| Chargeback risk reserve | ~1% |
| Tax compliance | ~1-2% |
| **Net to droneicarus** | **~22-25%** |

## Tier model (recommended for v2 — not yet implemented)

\`\`\`
Tier 1 (default):       30% platform / 70% pilot
Tier 2 (LTV \\$1k+):      25% platform / 75% pilot
Tier 3 (LTV \\$10k+):     20% platform / 80% pilot
Tier 4 (Pro/invite):    15% platform / 85% pilot
\`\`\`

Lock-in for top performers + simple "Earn up to 85%" marketing message.

## License tiers (pricing per clip)

| Tier | Use case | Price multiplier |
|---|---|---|
| Personal | Edits, social reels, non-commercial | 1× base |
| Commercial 1yr | Ads, client work, online spots | ~1.8× base |
| Extended | Broadcast, exclusive window, resale | ~3.5× base |
| Exclusive | Buyout, removed from catalog | By quote |

Pilot sets the **base price** at upload. Multipliers are applied automatically in the checkout UI.

## Default base prices by category (suggested)

| Category | Suggested base \\$ |
|---|---|
| FPV racing | $19 |
| Aurora / phenomena | $39 |
| Volcano / glacier | $49 |
| Heritage (temples/castles/ruins) | $35 |
| Cityscape / architecture | $25 |
| Wildlife / safari | $59 |

These are guidelines — pilot can override at upload.
`,

storage: `
# Storage & R2 Cache Strategy

## Why we don't host originals long-term

1. Drone master files are 500MB - 5GB each. 1000 clips × 2GB = 2TB.
2. Supabase Storage at scale: $42/mo for 2TB + $0.09/GB egress on downloads.
3. Most clips have **0 lifetime sales** (long-tail) — paying to store dead inventory is wasteful.

## Three-tier strategy

### Tier 1 — Pilot's external host
- Dropbox / Vimeo / Google Drive / Frame.io / WeTransfer
- We store only the URL in \`videos.external_url\`
- Pilot's responsibility for first 30 days OR until first sale
- Cost to us: **\\$0**

### Tier 2 — R2 cache (just-in-time, on purchase)
- When buyer pays, Cloudflare Worker fetches external URL → streams to R2
- R2 path: \`cache/{order_id}/{video_id}.{ext}\`
- TTL: 7 days (matches buyer's download window)
- After 7 days: R2 lifecycle policy auto-deletes
- Cost to us: ~\\$0.015/GB-month (effectively free under 10GB free tier)

### Tier 3 — Public bucket
- Supabase Storage \`thumbs\` for poster images (small, public CDN)
- Always-available, fast first paint

## Why R2 (not S3)

| Provider | Storage \\$/GB | Egress \\$/GB | 10TB scenario monthly |
|---|---|---|---|
| **R2** | **0.015** | **\\$0** (free!) | **\\$150** |
| AWS S3 | 0.023 | 0.09 | $1130 |
| Backblaze B2 | 0.006 | 0.01 | $160 |
| Wasabi | 0.0059 | $0 | $59 |

R2's free egress is the killer feature — most stock footage cost is **download bandwidth**, not storage.

## R2 bucket details

- Account ID: \`ffafa8061cee01c22bf12b07385fd870\`
- Bucket name: \`droneicarus-cache\`
- Region: ENAM (East North America)
- Created: 2026-04-22

## Worker secrets

Set on Cloudflare Worker (\`droneicarus-cache-purchase\`):
- \`SUPABASE_URL\` — env var
- \`SUPABASE_SERVICE_KEY\` — secret (set via \`wrangler secret put\`)

R2 binding is automatic via \`wrangler.toml\`:
\`\`\`toml
[[r2_buckets]]
binding     = "CACHE_BUCKET"
bucket_name = "droneicarus-cache"
\`\`\`
`,

discovery: `
# Video Discovery Pipeline

## YouTube Data API v3

- Quota: 10,000 units/day (resets at PT midnight = 07:00 UTC)
- search.list = 100 units, videos.list = 1 unit
- Budget: ~95 queries/day max (9,500 units, 500 buffer)
- Required filters: \`videoLicense=creativeCommon\`, \`videoEmbeddable=true\`, \`videoDuration=medium\`

## Cron schedule (.github/workflows/discover.yml)

| UTC | KST | Run |
|---|---|---|
| 01:00 | 10:00 | Run #1 |
| 07:00 | 16:00 | Run #2 (right after quota reset) |
| 13:00 | 22:00 | Run #3 |
| 19:00 | 04:00+ | Run #4 |

## Two-layer category taxonomy

**Layer 1** — Frontend slot codes (13 used + 2 empty), stored in \`videos.category\`:

\`landscape · cityscape · mountain · ocean · desert · forest · fpv-racing · sports · conflict-zone · fishing · wildlife · ruins-heritage · stratosphere · storm-chasing · night-flight\`

**Layer 2** — 33 fine categories, stored in \`videos.tags[0]\`:

| Group | Fine categories |
|---|---|
| Land | landscape, mountain, desert, dunes, glacier, polar, rainforest |
| Water | ocean, atoll, coastal-cliff, waterfall |
| Sky/Phenomena | aurora, phenomena, fireworks |
| City/Built | cityscape, architecture, bridge, port |
| Heritage | ancient-ruins, temple, castle |
| Agri/Industry | vineyard, rice-terrace, flower-field, wind-farm, solar-farm |
| Wildlife | marine-life, wildlife-safari |
| Sports/Action | aerial-sports, surfing, skiing, drone-show |
| Nature event | volcano |

The Explore page sidebar tree maps Layer 2 → Layer 1 visually.

## Location mapping decision tree

For each new video, take the first non-null result:

1. **YouTube \`recordingDetails.location\`** — most accurate (publisher told us the GPS)
2. **Description regex** — DMS (\`64.96°N, 19.02°W\`), labeled (\`lat: 35.68, lon: 139.69\`), or bare decimal
3. **Wikidata SPARQL P625** — landmark name from title → entity coordinate
4. **Curated anchor** from query manifest — apply ±0.02° jitter to prevent stacking
5. **Nominatim** — last resort with mandatory guards

If even step 5 fails: \`lat=null, lon=null\` and place in moderation queue.

## Anti-patterns (learned the hard way)

- ❌ Bare common-noun queries: "Sunrise" → Sunrise FL, "Desert" → Desert TX
- ❌ Country names alone: "Iceland" → country centroid → all stack
- ❌ Skip jitter on anchor coords → multiple videos at same point
- ❌ Trust Nominatim importance < 0.3 — mostly noise

## Current scale (as of 2026-04-22)

- **Total YT videos**: 470
- **Categories used**: 33 fine / 13 frontend slots
- **Unique pin positions**: 452 / 470 (96.2%)
- **Discovery queries in DB**: 186 (cycling via LRU)

## Full playbook

See \`VIDEO_COLLECTION_PLAYBOOK.md\` in repo root for the full canonical spec including query manifest, Nominatim guards, dedup pass, and quota strategy.
`,

schema: `
# Database Schema

All on Supabase Postgres. RLS enabled on every public-readable table.

## Tables (current)

### \`videos\`
Both YouTube collected + pilot-uploaded clips live here.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| title | text | ≤200 chars |
| description | text | ≤1500 chars |
| category | text | one of 13 frontend slots |
| tags | text[] | tags[0] = fine category (33 codes) |
| source | text | 'youtube' \\| 'original' |
| youtube_id | text UNIQUE | for source='youtube' |
| external_url | text | for source='original' + external host |
| external_provider | text | dropbox/vimeo/gdrive/frame-io/wetransfer/other |
| external_check_status | text | ok/broken/pending |
| storage_path | text | for source='original' + Supabase Storage |
| owner_id | uuid → auth.users | nullable for YouTube |
| location_id | uuid → locations | nullable |
| lat, lon | float8 | shoot location |
| shot_lat, shot_lon | float8 | pilot-supplied (more authoritative) |
| price_usd | numeric | base price (multipliers in checkout) |
| license_tiers | text[] NOT NULL | use \`[]\` not null |
| status | text | draft/published/removed |
| thumb_path | text | Supabase Storage path |
| thumb_url | text | external (e.g. ytimg) |
| inferred_location_raw | jsonb | { name, source, country } |

### \`orders\`

| Column | Type | Notes |
|---|---|---|
| id | text PK | DI-2026-12345 format |
| buyer_id | uuid → auth.users | RLS: buyer reads own |
| video_id | uuid → videos | |
| license | text | personal/commercial/extended/exclusive |
| subtotal/tax/total | numeric | |
| status | text | complete/refunded |
| payment_brand/last4 | text | |
| **single_download_agreed** | boolean | legal evidence — was checkbox checked? |
| **cached_url** | text | R2 path after Worker copies file |
| **cache_expires_at** | timestamptz | now() + 7 days at order time |
| **download_count** | int | bumped on each successful download |
| **first/last_download_at** | timestamptz | |

### \`download_events\`

Chargeback defense + analytics. Inserted by Worker + frontend on every download attempt.

| Column | Type |
|---|---|
| id | uuid PK |
| order_id | text |
| video_id | uuid |
| buyer_id | uuid |
| ip_address | text |
| user_agent | text |
| bytes_delivered | bigint |
| http_status | smallint |
| started_at, completed_at | timestamptz |

### \`site_content\`
200+ keys for all UI strings. \`useContent('key', 'fallback')\` reads them.

| Column | Type |
|---|---|
| key | text PK |
| category | text |
| type | text/longtext/markdown/html/url/image/json |
| value | text |
| description | text |

### \`discovery_queries\` / \`discovery_runs\`
Manages the YouTube cron job — query manifest + run history.

### \`profiles\`, \`locations\`, \`reviews\`, \`comments\`, \`payouts\`, \`audit_log\`, etc.
Standard CRUD tables, RLS-scoped.

## Migrations applied

| File | Date | What |
|---|---|---|
| 0001_init.sql | initial | base tables |
| 0002_rls.sql | initial | row-level security |
| 0003_storage.sql | initial | Supabase Storage buckets |
| 0004_seed_locations.sql | initial | 28 landmarks |
| 0005_admin_cms.sql | | site_settings + admin |
| 0006_fix_admin_rls.sql | | RLS bug fixes |
| 0007_site_content.sql | | site_content KV store |
| 0008_discovery.sql | | discovery_queries + discovery_runs + videos.source/youtube_id |
| **0009_external_hosting.sql** | 2026-04-22 | external_url, download_events, orders.cached_url + 7-day fields |

## RLS policies

- Public can SELECT \`videos\` where status='published'
- Buyers can SELECT/INSERT own \`orders\` (buyer_id = auth.uid())
- Buyers can SELECT own \`download_events\`
- \`is_admin()\` SECURITY DEFINER function gates admin-only ops
- Service role (Worker) bypasses RLS for cross-user reads
`,

deployment: `
# Deployment Runbook

## Frontend deploy

Auto-triggered on push to main → \`.github/workflows/pages.yml\` runs Vite build → uploads dist → GH Pages.

Build env vars (set in GH Actions secrets/vars):
- \`VITE_SUPABASE_URL\` (secret)
- \`VITE_SUPABASE_PUBLISHABLE_KEY\` (secret)
- \`VITE_USE_SUPABASE_DATA\` = "true" (var)
- \`VITE_CACHE_WORKER_URL\` (literal in pages.yml — not secret)

Manual rebuild: https://github.com/auto1225/droneicarus/actions/workflows/pages.yml → "Run workflow"

## Database migration

\`supabase/migrations/NNNN_*.sql\` files in repo. **Apply manually** via Supabase Dashboard SQL Editor:

👉 https://supabase.com/dashboard/project/eotsbncgkgewgbemaarp/sql/new

Paste file contents, click Run. Migrations are idempotent (use \`IF NOT EXISTS\`).

## Cache Worker deploy

\`\`\`bash
cd workers
export CLOUDFLARE_API_TOKEN=<your token>
export CLOUDFLARE_ACCOUNT_ID=ffafa8061cee01c22bf12b07385fd870
npx wrangler deploy
\`\`\`

After first deploy, set the Supabase secret on the Worker:
\`\`\`bash
echo "sb_secret_..." | npx wrangler secret put SUPABASE_SERVICE_KEY
\`\`\`

If routes change, re-register subdomain via API:
\`\`\`bash
curl -X POST -H "Authorization: Bearer $CF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"enabled":true}' \\
  https://api.cloudflare.com/client/v4/accounts/$ACCT/workers/scripts/droneicarus-cache-purchase/subdomain
\`\`\`

## YouTube discovery

Auto-runs 4×/day via cron. Manual trigger:
👉 https://github.com/auto1225/droneicarus/actions/workflows/discover.yml → "Run workflow"

GH Actions secrets needed:
- \`YT_API_KEY\`
- \`SUPABASE_URL\`
- \`SUPABASE_SERVICE_ROLE_KEY\`

## Add a new fine category

1. Insert rows in \`discovery_queries\` table with new \`category\` value
2. Wait for next discovery cron OR manual trigger
3. Edit \`site_content.explore.hierarchy\` JSON to add the new fine category under appropriate parent group
4. (Optional) Add an SVG icon to \`Ic\` in \`src/components.jsx\` if needed

No code change required for adding categories — all data-driven.

## Add a new admin user

1. User signs up via Google OAuth as normal
2. Edit their \`profiles.role = 'admin'\` (via Supabase Dashboard table editor)

OR add their email to \`is_admin()\` function's email list (more robust):
👉 SQL Editor → ALTER FUNCTION public.is_admin → add to email check list

## Rotate a key

See "Secrets & Credentials" page for the full list + rotation steps.
`,

troubleshooting: `
# Troubleshooting

## "Page stuck on 'Loading...'"

**Cause**: Supabase JS client hangs on first-paint queries (\`supabase.from(...).select()\` never resolves).
**Fix**: That code path should already be raw REST. If you find a regression, replace with \`fetch(SUPA_URL + '/rest/v1/...')\` + service or session token.

## "FPV Racing 0 clips" (any category showing 0 despite videos in DB)

**Cause**: DB \`videos.category\` value doesn't match the frontend slot code.
**Fix**: Check \`videos.tags[0]\` for fine category. Map to frontend slot. We have a script in commit history (#112) that bulk-remaps.

## Map pins stacked on one point

**Cause**: Nominatim returned country/admin1 centroid OR no jitter on anchor coords.
**Fix**: Run dedup + jitter pass:
\`\`\`sql
-- find clusters
SELECT round(lat::numeric, 3) lat3, round(lon::numeric, 3) lon3, count(*), array_agg(id)
FROM videos WHERE source='youtube' GROUP BY 1,2 HAVING count(*) > 1;
\`\`\`
For each cluster, jitter all but first by ±0.05° (≈ ±5km).

## YouTube quota exhausted (403 quotaExceeded)

**Cause**: Burnt 10,000 units in single run (186 queries × 100 = 18,600 units > limit).
**Fix**: Wait until next 07:00 UTC reset. Long-term: cap queries-per-run to ~80 with LRU rotation on \`discovery_queries.last_run_at\`.

## "23502 NOT NULL violation" on insert

**Cause**: A column that should be nullable isn't.
**Fix**: \`ALTER TABLE videos ALTER COLUMN <col> DROP NOT NULL;\`
Known nullable: owner_id, location_id, slug.

## "42P10 on_conflict" on upsert

**Cause**: Partial unique index doesn't support \`on_conflict\`.
**Fix**: Replace with regular \`UNIQUE INDEX\`:
\`\`\`sql
DROP INDEX idx_videos_youtube_id_partial;
CREATE UNIQUE INDEX idx_videos_youtube_id_unique ON videos(youtube_id) WHERE youtube_id IS NOT NULL;
\`\`\`

## "Forbidden use of secret API key in browser"

**Cause**: \`sb_secret_*\` (service role) used in frontend code.
**Fix**: Browser code must use \`sb_publishable_*\` (anon) OR the user's session JWT. Service role only in Workers/edge functions/scripts.

## Worker returns 500 on every request

**Cause**: Often a runtime error from referencing variables before declaration.
**Fix**: Check \`wrangler tail droneicarus-cache-purchase\` for stack trace, or re-deploy after fixing code.

## Worker subdomain returns 522/SSL handshake fail

**Cause**: Brand-new \`workers.dev\` subdomain — TLS cert provisioning takes 1-2 min.
**Fix**: Wait 60 seconds and retry.

## Build fails on GH Pages

**Cause**: Usually missing import or env var not set.
**Fix**: Check Actions log: https://github.com/auto1225/droneicarus/actions/workflows/pages.yml
Common: relative import path (\`./foo\` vs \`../foo\`), or env var referenced in code without fallback.

## Supabase MCP "permission denied"

**Cause**: The Supabase MCP token doesn't have access to droneicarus project (it's authenticated to a different account).
**Fix**: Use raw REST + service_role key (\`sb_secret_...\`) directly — avoid MCP for this project.
`,

secrets: `
# Secrets & Credentials

## Where each secret lives

| Secret | Used by | Stored in | Rotation URL |
|---|---|---|---|
| Supabase service_role | Worker, scripts | Worker secret + GH Actions \`SUPABASE_SERVICE_ROLE_KEY\` + admin scripts | https://supabase.com/dashboard/project/eotsbncgkgewgbemaarp/settings/api |
| Supabase publishable (anon) | Frontend | GH Actions \`VITE_SUPABASE_PUBLISHABLE_KEY\` | same as above |
| YouTube Data API v3 key | Discovery cron | GH Actions \`YT_API_KEY\` | https://console.cloud.google.com/apis/credentials |
| Cloudflare API Token | Worker deploy (manual) | Local only — use & delete | https://dash.cloudflare.com/profile/api-tokens |
| GitHub PAT | Local only — direct push | Not stored — re-issue per session | https://github.com/settings/tokens |
| PayPal client id | Frontend | GH Actions \`VITE_PAYPAL_CLIENT_ID\` (currently 'sb' = sandbox) | https://developer.paypal.com/dashboard |
| Google OAuth client id/secret | Supabase Auth | Supabase Auth dashboard | https://console.cloud.google.com/apis/credentials |

## How to rotate a key (general procedure)

1. Generate new key in provider dashboard
2. Update wherever it's stored (GH Secrets, Supabase Auth, Worker secret)
3. Verify deploy/ops still work
4. Revoke old key in provider dashboard

## GitHub Secrets URL

https://github.com/auto1225/droneicarus/settings/secrets/actions

Required secrets:
- \`VITE_SUPABASE_URL\`
- \`VITE_SUPABASE_PUBLISHABLE_KEY\`
- \`SUPABASE_URL\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`YT_API_KEY\`
- (optional) \`VITE_PAYPAL_CLIENT_ID\` for live payments
- (optional) \`ANTHROPIC_API_KEY\` for Claude NER step in enrichment

## GitHub Vars (non-secret config)

- \`VITE_USE_SUPABASE_DATA\` = "true"

## Cloudflare account

- Account ID: \`ffafa8061cee01c22bf12b07385fd870\`
- Email: auto0104@gmail.com
- R2 bucket: \`droneicarus-cache\`
- Worker: \`droneicarus-cache-purchase\` → \`https://droneicarus-cache-purchase.droneicarus.workers.dev\`

## Supabase project

- Project ref: \`eotsbncgkgewgbemaarp\`
- URL: \`https://eotsbncgkgewgbemaarp.supabase.co\`
- Region: us-east-2

## Domain

- Registrar: 가비아 (Gabia)
- DNS records: 4 A + 4 AAAA → GH Pages IPs, CNAME www → auto1225.github.io
- Renewal: annual

## Security best practices

- Never commit any \`sb_secret_*\`, \`ghp_*\`, \`cfut_*\`, etc. to git (GH push protection blocks most)
- Cloudflare API tokens — use temporary tokens, delete after use
- Supabase service_role — server-side only, never browser
- Document any new secret here when introduced
`,

cost: `
# Cost Projections

All currently $0/mo. Free-tier limits and crossover points:

## Supabase Free tier

- DB: 500 MB
- Storage: 1 GB
- Auth users: 50,000 MAU
- Realtime: 2 concurrent connections
- Edge functions: 500K invocations/mo

**Crossover scenarios**:
- 100K registered users → still free
- 5,000 active videos × ~2KB metadata each = 10MB → far from limit
- Real concern: if we cache thumbnails in Supabase Storage and exceed 1GB, that's $0.021/GB-mo over

## Cloudflare R2 Free tier

- Storage: 10 GB
- Class A operations (PUT, LIST): 1M/mo
- Class B operations (GET, HEAD): 10M/mo
- **Egress: ALWAYS FREE** (this is the differentiator)

**Crossover scenarios**:
- 100 simultaneously cached clips × 1GB avg = 100GB → $1.35/mo
- 1000 purchases/mo × 1GB cache × 7 days = ~233GB-day = ~7.7GB-mo avg → still free
- Egress to buyers: free regardless of volume

## Cloudflare Workers Free tier

- 100,000 requests/day
- CPU time: 10ms/request

**Crossover scenarios**:
- 3,000 purchases/day = ~3,000 cache calls/day → fits easily
- Each cache invocation: 1 fetch (external) + 1 R2 PUT + 2 Supabase REST = ~4 ops, fast

## YouTube Data API v3

- 10,000 units/day, free
- search.list = 100 units, videos.list = 1 unit
- Practical max: ~95 search calls/day = ~10 candidate videos/each = ~950 candidates/day

**Pricing tier above**: not available — must apply to Google for higher quota (free for valid use cases).

## GitHub Pages + Actions

- Bandwidth: 100 GB/mo soft limit (rarely enforced for GH Pages)
- Actions: 2,000 minutes/mo (private) — public repos = unlimited

## PayPal / Stripe (when live)

- PayPal: 2.9% + \\$0.30 per US transaction, 3.9% + currency conversion for cross-border
- Stripe: 2.9% + \\$0.30 (similar)
- Withdrawal fees to bank: small (varies)

## Domain

- 가비아 (Gabia): ~₩15,000/year for .com
- Cloudflare can also register at-cost (~$10/yr)

## Total cost projection

| Stage | Videos | Sales/mo | Approx monthly cost |
|---|---|---|---|
| Now (MVP) | 470 | 0 | **$0** |
| Early traction | 2,000 | 50 | $0 (still free tiers) |
| Growth | 10,000 | 500 | $0-$25 (Supabase Pro becomes needed) |
| Scale | 50,000 | 5,000 | ~$120 (Supabase Pro $25 + R2 ~$30 + payment fees ~$65 abs) |
| Hyper | 200,000 | 50,000 | ~$2K (Supabase team + R2 $300 + ops) |

The free tiers carry us comfortably to first $10K MRR.

## When to upgrade

- **Supabase Pro $25/mo** — when DB > 400MB or > 40K MAU
- **Cloudflare Workers Paid $5/mo** — when > 90K req/day (gives 10M req/mo + more CPU)
- **R2 paid** — when storage > 8GB sustained
`,

changelog: `
# Changelog

Most recent commits to droneicarus repo (latest first):

## 2026-04-22

- **bdc3f72** Worker deploy: wire VITE_CACHE_WORKER_URL into Pages build + fix routing bug
- **a10f99d** P5: My purchases tab + 7-day countdown + download event log
- **fd24bb4** fix(cache): correct supabase import path
- **8f8b32d** P4: Cloudflare Worker for JIT cache + client trigger
- **f1e460f** Checkout UX: move DELIVERY POLICY above payment method tabs
- **63e3c29** Checkout: mandatory single-download agreement + legal evidence trail
- **90c2312** Upload: add external-host link mode (Dropbox/Vimeo/GDrive/Frame.io/WeTransfer)
- **a52644d** Upload: location MANDATORY + 3-mode picker + required-field checklist
- **02471e8** Player FLIGHT NOTES: compact 2-col grid + chip-style links
- **1d8ce9d** Player: structured FLIGHT NOTES + free vs licensed UI split
- **17924a5** Explore: replace emoji icons with SVG components in sidebar hierarchy
- **47b69d3** Explore: replace top 15-card grid + overflowing chip bar with hierarchical sidebar

## 2026-04-21

- **fd75bd6** ci(discover): 4x/day cron + auto-enrich after each run
- **ce5cbe8** feat(enrich): 5-step precision pipeline — recordingDetails → desc coords → Wikidata SPARQL → Claude NER → Nominatim
- Earlier: 470 YouTube videos collected across 33 fine categories, location enrichment + dedup + jitter pass

## Major milestones

| Date | Milestone |
|---|---|
| 2026-03 | Initial Supabase + GH Pages setup, domain droneicarus.com live |
| 2026-04-04 | Cloudflare account created |
| 2026-04 (mid) | Site_content CMS + admin shell |
| 2026-04-21 | YouTube discovery pipeline live, first 41 videos |
| 2026-04-22 | Scale to 470 videos · Worker + R2 cache deployed · 2-layer taxonomy · single-download legal model live |

## Pending backlog

- #105 discover script LRU + daily quota throttle (avoid 18,600 units/run)
- #107 enrich-locations.mjs Nominatim mismatch guards (reject street/shop/admin centroids)
- #89 Admin Discover section — query CRUD + manual trigger + run history
- #90 Home map — YouTube source badge + pin color + filter toggle
- Switch PayPal sandbox → live (set \`VITE_PAYPAL_CLIENT_ID\` GH secret)
- Tier-based revenue split (#proposed not implemented)
- Subscription / bulk-license model (future)
`,
};

// ──────────────────────────────────────────────────────────────────────
// Tiny markdown renderer (no external deps)
// Supports: # h1, ## h2, ### h3, **bold**, \`inline\`, \`\`\` blocks,
//           tables, ordered/unordered lists, [text](url), > blockquotes
// ──────────────────────────────────────────────────────────────────────
function renderMarkdown(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  let key = 0;

  const inline = (text) => {
    // links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--amber);text-decoration:underline">$1</a>');
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // inline code
    text = text.replace(/`([^`]+)`/g, '<code style="background:var(--forest-800);padding:1px 6px;border-radius:3px;font-size:0.9em;font-family:var(--font-mono)">$1</code>');
    return text;
  };

  while (i < lines.length) {
    const ln = lines[i];

    // Code block
    if (ln.startsWith('```')) {
      i++;
      const code = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]); i++;
      }
      i++;
      out.push(<pre key={key++} style={{
        background: 'var(--forest-900)', padding: '12px 16px', borderRadius: 4,
        border: '1px solid var(--line)', overflowX: 'auto', fontSize: 12,
        fontFamily: 'var(--font-mono)', color: 'var(--bone)', lineHeight: 1.5,
        margin: '12px 0',
      }}><code>{code.join('\n')}</code></pre>);
      continue;
    }

    // Table (header | sep | rows)
    if (ln.includes('|') && i + 1 < lines.length && /^[\s\-|]+$/.test(lines[i+1])) {
      const headers = ln.split('|').map(s => s.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(s => s.trim()).filter(Boolean));
        i++;
      }
      out.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '14px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--forest-900)' }}>
                {headers.map((h, j) => (
                  <th key={j} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--line-strong)', fontWeight: 600 }}
                      dangerouslySetInnerHTML={{ __html: inline(h) }}/>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid var(--line)' }}>
                  {r.map((c, ci) => (
                    <td key={ci} style={{ padding: '7px 12px', verticalAlign: 'top' }}
                        dangerouslySetInnerHTML={{ __html: inline(c) }}/>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (ln.startsWith('### ')) {
      out.push(<h3 key={key++} style={{ fontSize: 16, marginTop: 20, marginBottom: 8, fontWeight: 600 }}
                   dangerouslySetInnerHTML={{ __html: inline(ln.slice(4)) }}/>);
      i++; continue;
    }
    if (ln.startsWith('## ')) {
      out.push(<h2 key={key++} style={{ fontSize: 20, marginTop: 28, marginBottom: 10, fontWeight: 700, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}
                   dangerouslySetInnerHTML={{ __html: inline(ln.slice(3)) }}/>);
      i++; continue;
    }
    if (ln.startsWith('# ')) {
      out.push(<h1 key={key++} style={{ fontSize: 28, marginTop: 0, marginBottom: 14, fontWeight: 700, letterSpacing: '-0.01em' }}
                   dangerouslySetInnerHTML={{ __html: inline(ln.slice(2)) }}/>);
      i++; continue;
    }

    // Blockquote
    if (ln.startsWith('> ')) {
      const lines_ = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        lines_.push(lines[i].slice(2)); i++;
      }
      out.push(<blockquote key={key++} style={{
        borderLeft: '3px solid var(--amber)', paddingLeft: 14, margin: '12px 0',
        color: 'var(--parchment)', fontStyle: 'italic', fontSize: 14,
      }} dangerouslySetInnerHTML={{ __html: inline(lines_.join(' ')) }}/>);
      continue;
    }

    // List (- or 1.)
    if (/^\s*[-*]\s/.test(ln) || /^\s*\d+\.\s/.test(ln)) {
      const ordered = /^\s*\d+\./.test(ln);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s/.test(lines[i]) || /^\s*\d+\.\s/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s/, ''));
        i++;
      }
      const Tag = ordered ? 'ol' : 'ul';
      out.push(
        <Tag key={key++} style={{ paddingLeft: 22, margin: '8px 0', fontSize: 14, lineHeight: 1.7 }}>
          {items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(it) }}/>)}
        </Tag>
      );
      continue;
    }

    // Empty line
    if (ln.trim() === '') { i++; continue; }

    // Paragraph
    out.push(<p key={key++} style={{ fontSize: 14, lineHeight: 1.65, margin: '8px 0' }}
                 dangerouslySetInnerHTML={{ __html: inline(ln) }}/>);
    i++;
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
// Main exported component — used by AdminShell
// ──────────────────────────────────────────────────────────────────────
export function AdminDocs() {
  const [topicId, setTopicId] = useState('overview');
  const md = useMemo(() => DOCS[topicId] || '# Not found', [topicId]);
  const rendered = useMemo(() => renderMarkdown(md), [md]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, minHeight: 'calc(100vh - 130px)' }}>
      {/* Sub-sidebar */}
      <aside style={{
        position: 'sticky', top: 80, alignSelf: 'start',
        background: 'var(--forest-900)', borderRadius: 6, padding: 10,
        border: '1px solid var(--line)', maxHeight: 'calc(100vh - 110px)',
        overflowY: 'auto',
      }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--parchment-dim)', padding: '6px 10px 10px' }}>OPERATIONS DOCS</div>
        {TOPICS.map(t => {
          const active = t.id === topicId;
          return (
            <button key={t.id} onClick={() => setTopicId(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', borderRadius: 4, fontSize: 12,
              background: active ? 'var(--bone)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--parchment)',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontWeight: active ? 600 : 400,
            }}>
              <span className="mono" style={{ width: 16, opacity: 0.7 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Content */}
      <article style={{
        background: 'var(--forest-950)', padding: '28px 36px', borderRadius: 6,
        border: '1px solid var(--line)', maxWidth: 980,
      }}>
        {rendered}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--parchment-dim)' }}>
          Documentation generated 2026-04-22 · Edit content in <code style={{ background: 'var(--forest-800)', padding: '1px 6px', borderRadius: 3 }}>src/pages/admin/Docs.jsx</code> · Push to main to update.
        </div>
      </article>
    </div>
  );
}
