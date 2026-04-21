# 02 · System Architecture

## Recommended production stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│   Web SPA (Next.js)     Future: iOS / Android                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               Edge / CDN  (Cloudflare / Fastly)                 │
│  - static assets, HLS manifests, signed URLs, image transform   │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API Gateway  (GraphQL or REST)              │
│               (AWS API Gateway / Kong / Apollo Router)           │
└───┬────────┬────────┬────────┬────────┬───────────┬──────────────┘
    ▼        ▼        ▼        ▼        ▼           ▼
┌────────┐┌──────┐┌───────┐┌──────┐┌────────┐┌──────────────┐
│  Auth  ││Video ││ Geo   ││Order ││Creator ││  Search       │
│ (OIDC) ││ Svc  ││ Svc   ││ Svc  ││  Svc   ││ (Typesense /  │
│        ││      ││       ││      ││        ││  Elasticsearch)│
└───┬────┘└──┬───┘└───┬───┘└──┬───┘└───┬────┘└──────┬──────────┘
    ▼        ▼        ▼       ▼        ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Postgres (primary)                         │
│     users · videos · locations · orders · licenses · …       │
└──────────────────────────────────────────────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────┐
│ Object Storage (S3) │       │ Queue (SQS / NATS)      │
│  - originals        │       │  - transcode jobs       │
│  - HLS renditions   │       │  - thumbnail jobs       │
│  - thumbnails       │       │  - notification fanout  │
└──────────┬──────────┘       └──────────┬──────────────┘
           ▼                             ▼
┌─────────────────────┐       ┌─────────────────────────┐
│ Transcode workers   │       │ Background workers      │
│  (MediaConvert /    │       │  (Node / Go)            │
│   custom ffmpeg)    │       │                         │
└─────────────────────┘       └─────────────────────────┘
```

---

## Services breakdown

### Auth service
- OIDC provider (Auth0 / Clerk / Cognito)
- Roles: `viewer`, `pilot`, `studio`, `admin`
- MFA required for payouts and admin actions
- JWT access tokens (15 min), refresh tokens (30 days, revocable)

### Video service
- Upload presigned URLs → S3 multipart
- Triggers transcode job on completion
- Stores rendition manifest, runs perceptual hash (de-dup)
- Issues signed CDN URLs per license tier (watermark/no-watermark, resolution gated)

### Geo service
- Reverse geocoding (Mapbox, Nominatim fallback)
- Landmark matching (within 500m of known POI → attach landmark_id)
- Clustering endpoint: `/pins?bbox=&zoom=` returns pin clusters
- Elevation lookup (optional — from DEM)

### Order service
- Cart, checkout, idempotent order creation
- Stripe integration (payment intents, webhooks)
- License generation (PDF via signed certificate template)
- Refund / dispute handling

### Creator service
- Payouts (Stripe Connect Express)
- Analytics aggregation (views, downloads, revenue)
- Verification workflow (ID, drone reg)

### Search service
- Typesense (recommended) or Elasticsearch
- Indexed fields: title, tags, location.name, creator.handle, category, resolution
- Geo-filter support (lat/lon + radius or polygon)

---

## Data flow: upload

```
User picks file
    │
    ▼
POST /uploads/start      → returns { uploadId, presignedURLs[] }
    │
    ▼
Client uploads parts directly to S3  ────────────────┐
    │                                                  │
    ▼                                                  │
POST /uploads/complete   → triggers transcode queue   │
    │                                                  │
    ▼                                                  │
Worker picks up job, extracts:                         │
  - GPS from EXIF/metadata                             │
  - duration, fps, codec, resolution                   │
  - 5 thumbnail frames                                 │
  - HLS renditions (360p, 720p, 1080p, 4K, original) ──┘
    │
    ▼
Video marked `ready` → creator notified → indexed in search
```

## Data flow: purchase

```
Buyer clicks "License"
    │
    ▼
POST /orders → returns Stripe clientSecret
    │
    ▼
Stripe Elements collects payment → confirms
    │
    ▼
Stripe webhook → /webhooks/stripe → marks order paid
    │
    ▼
System generates:
  - License record (buyer, video, tier, price, timestamp)
  - Signed download URL (valid 7 days, limited downloads)
  - PDF certificate
    │
    ▼
Email + in-app notification → buyer gets download link
70% revenue credited to creator balance
```

---

## Infrastructure recommendations

| Concern | Recommendation |
|---|---|
| Hosting | AWS or GCP (primary), Cloudflare (edge) |
| Database | Postgres 15+ (RDS / Cloud SQL). Read replicas for search-heavy traffic. |
| Video storage | S3 + Cloudflare R2 (egress savings) |
| Transcode | AWS MediaConvert for predictable cost, or ffmpeg on spot instances |
| CDN | Cloudflare Stream (handles HLS+DRM) OR Mux (higher fidelity) |
| Search | Typesense Cloud (simple) or Elasticsearch (complex) |
| Queue | SQS / Cloud Tasks |
| Email | Resend / Postmark |
| Analytics | PostHog (product) + Plausible (web) |
| Error tracking | Sentry |
| Logs / metrics | Datadog OR CloudWatch + Grafana |

---

## Why this shape?

- **API gateway + microservices**: clean isolation, but we're small — start as a modular monolith (single Postgres, logical services) and split out `video` + `transcode` workers first when traffic forces it.
- **Object storage separate from DB**: videos are huge. Never put blobs in Postgres.
- **Edge CDN for HLS**: cost + perf. Buyers watch previews globally — origin bandwidth kills margins.
- **Typesense over ES**: faster to ship, simpler schema migrations, enough power for current scope.

---

## Performance budgets

| Surface | Target | Rationale |
|---|---|---|
| Map initial render (LCP) | < 2.0s | hero experience |
| Video preview start (TTFB) | < 400ms | paywall UX depends on this |
| Search response | < 150ms p95 | feels instant |
| Checkout → success | < 4s | reduces drop-off |
| Upload: 1 GB file start to queued | < 90s over 25 Mbps | creator retention |
