# 04 · API Contract

Recommended: **REST** for MVP (lower overhead, easier to cache at the edge). Move hot paths to GraphQL later if client query shapes explode.

- Base URL: `https://api.droneicarus.com/v1`
- Auth: `Authorization: Bearer <jwt>` (access token, 15 min)
- Errors: RFC-7807 `application/problem+json`
- Pagination: cursor-based (`?cursor=…&limit=…`, response includes `next_cursor`)
- Timestamps: ISO-8601 UTC (`2026-04-20T14:22:01Z`)
- Money: integer cents + currency code

---

## Auth

### `POST /auth/signup`
```json
{ "email": "…", "password": "…", "handle": "…", "role": "viewer" }
→ 201 { "user": {...}, "access_token": "…", "refresh_token": "…" }
```

### `POST /auth/signin`
```json
{ "email": "…", "password": "…" }
→ 200 { "user": {...}, "access_token": "…", "refresh_token": "…" }
```

### `POST /auth/refresh`
```json
{ "refresh_token": "…" }
→ 200 { "access_token": "…", "refresh_token": "…" }
```

### `POST /auth/forgot`
```json
{ "email": "…" } → 202 {}
```

### `GET /me`
→ current user + role flags

---

## Locations

### `GET /locations`
```
?country=EG&category=ruins&featured=true&limit=20
→ { "data": [Location], "next_cursor": "..." }
```

### `GET /locations/:slug`
→ single location + top videos

### `GET /locations/search?q=…`
Geocoding + landmark matching. Returns up to 10 candidates.

### `GET /pins?bbox=sw_lat,sw_lon,ne_lat,ne_lon&zoom=…`
Clustered pins for map viewport.
```json
{
  "clusters": [{ "lat": 30.1, "lon": 31.2, "count": 47, "bbox": [...] }],
  "pins": [{ "id": "giza-pyramids", "lat": 29.9792, "lon": 31.1342, "video_count": 47 }]
}
```

---

## Videos

### `GET /videos`
```
Query params:
  ?location_id=…              -- all videos at a landmark
  ?creator_id=… | ?handle=…
  ?category=…
  ?min_resolution=4K
  ?fps=24,30
  ?weather=clear
  ?time_of_day=golden_hour|night|day|blue_hour
  ?drone_model=…
  ?price_max_cents=1999
  ?sort=trending|newest|price_asc|price_desc
  ?cursor=… &limit=24
→ { "data": [Video], "next_cursor": "..." }
```

### `GET /videos/:id`
Full video detail. Increments `views` (rate-limited per session).

### `GET /videos/:id/preview`
Signed HLS manifest URL, **3-second preview window**. No auth needed.
```json
{
  "hls_url": "https://cdn.../preview.m3u8?sig=…",
  "expires_at": "2026-04-20T14:30:00Z",
  "duration_sec": 3
}
```

### `GET /videos/:id/stream` *(requires license)*
Full-length signed HLS manifest. Tier gates resolution.
```json
{
  "hls_url": "…",
  "max_resolution": "2160p",
  "expires_at": "…"
}
→ 402 if no license
```

### `GET /videos/:id/download` *(requires license)*
Returns a single-use signed URL to the original file.
```
→ 200 { "url": "…", "expires_in_sec": 3600, "downloads_remaining": 4 }
→ 403 if download_limit hit
```

### `POST /videos` *(upload init)*
```json
{
  "filename": "sunrise-pyramids.mov",
  "file_size_bytes": 4823000000,
  "content_type": "video/quicktime"
}
→ 201 {
  "video_id": "…",
  "upload_id": "…",
  "parts": [{ "part_number": 1, "url": "…" }, …],
  "complete_url": "/videos/:id/complete"
}
```

### `POST /videos/:id/complete`
```json
{ "parts": [{ "part_number": 1, "etag": "…" }, …] }
→ 202 { "status": "processing" }
```

### `PATCH /videos/:id`
Update metadata (title, description, pricing, tags). Creator-only.

### `DELETE /videos/:id`
Soft-delete. Existing licenses keep access.

---

## Comments

### `GET /videos/:id/comments`
```
?sort=top|new&cursor=… → { data, next_cursor }
```

### `POST /videos/:id/comments`
```json
{ "body": "…", "parent_id": null, "ts_annotation_sec": 12.4 }
→ 201 Comment
```

### `POST /comments/:id/like` / `DELETE /comments/:id/like`

---

## Collections

### `GET /users/:handle/collections`
### `POST /collections` `{ title, description }`
### `POST /collections/:id/items` `{ video_id }`
### `DELETE /collections/:id/items/:video_id`

---

## Follow / likes

### `POST /users/:handle/follow` / `DELETE …`
### `POST /videos/:id/like` / `DELETE …`

---

## Orders & licenses

### `POST /orders`
```json
{
  "items": [{ "video_id": "…", "license_tier": "commercial" }],
  "payment_method_id": "pm_…"
}
→ 201 {
  "order_id": "…",
  "stripe_client_secret": "…",
  "total_cents": 1999,
  "currency": "USD"
}
```

### `GET /orders`
List current user's orders (buyer perspective).

### `GET /orders/:id`
Full receipt + licenses issued.

### `GET /licenses/:license_number/certificate`
→ signed PDF URL (valid 10 minutes)

### `POST /orders/:id/refund` *(admin or eligible self-refund)*

---

## Webhooks (inbound from Stripe)

### `POST /webhooks/stripe`
Events handled:
- `payment_intent.succeeded` → mark order paid, issue license, credit creator
- `payment_intent.payment_failed` → notify buyer
- `charge.refunded` → revoke license, debit creator
- `account.updated` (Connect) → update creator onboarding status

---

## Creator tools

### `GET /creator/dashboard`
```json
{
  "period": "last_30_days",
  "revenue_cents": 124500,
  "views": 84200,
  "downloads": 312,
  "top_videos": [...]
}
```

### `GET /creator/payouts`
### `POST /creator/payouts/request`

---

## Admin (locked behind admin role + MFA)

- `GET /admin/moderation/queue`
- `POST /admin/videos/:id/approve` / `reject`
- `POST /admin/users/:id/ban`
- `GET /admin/pilot-verifications`
- `POST /admin/pilot-verifications/:id/decision`

---

## Rate limits

| Endpoint group | Anon | Authed | Pilot/Studio |
|---|---|---|---|
| Read | 60 / min | 300 / min | 600 / min |
| Preview stream | 20 / min / IP | 100 / min | 200 / min |
| Upload init | — | 5 / hour | 50 / hour |
| Write (comments, likes, follows) | — | 60 / hour | 200 / hour |
| Auth (signup, signin, forgot) | 5 / 15 min / IP | — | — |

---

## Example: "Videos at a location" end-to-end

```http
GET /locations/giza-pyramids
Accept: application/json
Authorization: Bearer eyJ…

200 OK
{
  "id": "loc_3f2a…",
  "slug": "giza-pyramids",
  "name": "Giza Pyramids",
  "country_code": "EG",
  "lat": 29.9792, "lon": 31.1342,
  "category": "ruins",
  "is_featured": true,
  "video_count": 47,
  "top_videos": [
    {
      "id": "vid_8a2…",
      "title": "Golden Hour Ascent",
      "thumbnail_url": "https://cdn.../…jpg",
      "duration_sec": 134,
      "resolution": "4K",
      "creator": { "handle": "@skywaltz", "name": "Sky Waltz", "verified": true },
      "price_cents": { "personal": 499, "commercial": 999, "extended": 2999 }
    }
  ]
}
```
