# 03 · Data Model

Proposed Postgres schema. All tables use `uuid` primary keys (via `gen_random_uuid()`), `created_at`/`updated_at` timestamps, and soft-deletes via `deleted_at` where appropriate. Indexes marked in brackets.

---

## Core entities

### `users`
```sql
id              uuid PK
email           text unique NOT NULL         [unique idx]
handle          text unique NOT NULL         [unique idx]  -- @hyunwoo
display_name    text NOT NULL
avatar_url      text
bio             text
role            text NOT NULL DEFAULT 'viewer'  -- viewer | pilot | studio | admin
country         text (ISO-3166)
locale          text DEFAULT 'en'
email_verified  bool DEFAULT false
pilot_verified  bool DEFAULT false           -- gated by drone-reg + ID check
stripe_customer_id  text
stripe_connect_id   text                     -- for creator payouts
created_at, updated_at, deleted_at
```

### `locations`
Immutable reference data — the "landmarks" pinned on the map.
```sql
id              uuid PK
slug            text unique NOT NULL         -- "giza-pyramids"
name            text NOT NULL
country_code    text (ISO-3166) NOT NULL     [idx]
admin1          text                         -- state/province
lat             numeric(9,6) NOT NULL        [GIST idx on (lat, lon)]
lon             numeric(9,6) NOT NULL
elevation_m     int
timezone        text
category        text                         -- landscape|cityscape|mountain|ocean|desert|forest|…
tags            text[]
cover_image_url text
is_featured     bool DEFAULT false
```

### `videos`
```sql
id              uuid PK
creator_id      uuid REF users(id)           [idx]
location_id     uuid REF locations(id)       [idx]  -- nullable if lat/lon unmatched
lat             numeric(9,6)                        -- true GPS, not loc.lat
lon             numeric(9,6)
title           text NOT NULL
description     text
category        text NOT NULL                [idx]
tags            text[]                       [GIN idx]
duration_sec    int NOT NULL
resolution      text NOT NULL                -- 4K | 5.7K | 6K | 8K
fps             int NOT NULL                 -- 24 | 30 | 60 | 120
codec           text                         -- H264 | H265 | ProRes | …
color_space     text                         -- Rec.709 | D-Log | D-LogM | HLG | RAW
captured_at     timestamptz                  -- from EXIF
weather         text                         -- clear | overcast | storm | fog | snow
altitude_m      int
flight_type     text                         -- cinematic | fpv | survey | timelapse
drone_model     text                         -- DJI Mavic 3 Pro | FPV | Skydio 2
has_people      bool DEFAULT false
has_logos       bool DEFAULT false
model_release   bool DEFAULT false           -- release form on file
price_personal_cents   int DEFAULT 0         -- 0 = free/pay-as-you-go
price_commercial_cents int
price_extended_cents   int
exclusive_price_cents  int
status          text NOT NULL DEFAULT 'draft' -- draft|processing|ready|rejected|taken_down
moderation_status text DEFAULT 'pending'     -- pending|approved|flagged|removed
moderation_notes text
views           bigint DEFAULT 0
downloads       bigint DEFAULT 0
likes           bigint DEFAULT 0
created_at, updated_at, deleted_at
```

### `video_renditions`
One row per transcoded variant.
```sql
id              uuid PK
video_id        uuid REF videos(id) ON DELETE CASCADE
resolution      text  -- 360p | 720p | 1080p | 2160p | original
bitrate_kbps    int
file_size_bytes bigint
s3_key          text NOT NULL
hls_manifest_s3_key text
duration_sec    int
is_preview      bool DEFAULT false  -- 3s preview clip
created_at
```

### `video_thumbnails`
```sql
id              uuid PK
video_id        uuid REF videos(id) ON DELETE CASCADE
s3_key          text NOT NULL
frame_at_sec    numeric
is_primary      bool DEFAULT false
width, height   int
```

### `collections`
User-curated video lists. Public by default.
```sql
id              uuid PK
user_id         uuid REF users(id)
title           text NOT NULL
description     text
cover_video_id  uuid REF videos(id)
is_public       bool DEFAULT true
video_count     int DEFAULT 0              -- denormalized
created_at, updated_at
```

### `collection_items`
```sql
collection_id   uuid REF collections(id) ON DELETE CASCADE
video_id        uuid REF videos(id) ON DELETE CASCADE
added_at        timestamptz DEFAULT now()
PRIMARY KEY (collection_id, video_id)
```

### `follows`
```sql
follower_id     uuid REF users(id)
followee_id     uuid REF users(id)
created_at
PRIMARY KEY (follower_id, followee_id)
```

### `likes`
Works for videos and comments (polymorphic via `target_type`).
```sql
id              uuid PK
user_id         uuid REF users(id)
target_type     text NOT NULL  -- 'video' | 'comment'
target_id       uuid NOT NULL
created_at
UNIQUE (user_id, target_type, target_id)
```

### `comments`
```sql
id              uuid PK
video_id        uuid REF videos(id) ON DELETE CASCADE
user_id         uuid REF users(id)
parent_id       uuid REF comments(id)        -- null = top-level
body            text NOT NULL
ts_annotation_sec  numeric                   -- "@ 0:12" jump
like_count      int DEFAULT 0                -- denormalized
is_hidden       bool DEFAULT false
created_at, updated_at, deleted_at
```

---

## Commerce

### `orders`
```sql
id              uuid PK
order_number    text unique NOT NULL          -- DI-2026-04821
buyer_id        uuid REF users(id)
subtotal_cents  int NOT NULL
tax_cents       int NOT NULL
total_cents     int NOT NULL
currency        text NOT NULL DEFAULT 'USD'
stripe_payment_intent_id text
status          text NOT NULL                 -- pending|paid|failed|refunded
billing_address jsonb
created_at, paid_at, refunded_at
```

### `order_items`
```sql
id              uuid PK
order_id        uuid REF orders(id) ON DELETE CASCADE
video_id        uuid REF videos(id)
license_tier    text NOT NULL                -- personal|commercial|extended|exclusive
price_cents     int NOT NULL
```

### `licenses`
A row per purchased usage right. The legal artifact.
```sql
id              uuid PK
license_number  text unique NOT NULL          -- LIC-2026-00321
order_item_id   uuid REF order_items(id)
buyer_id        uuid REF users(id)
video_id        uuid REF videos(id)
tier            text NOT NULL
certificate_s3_key text                       -- signed PDF
download_count  int DEFAULT 0
download_limit  int DEFAULT 5                 -- tier-dependent
issued_at       timestamptz
expires_at      timestamptz                   -- NULL = perpetual
revoked_at      timestamptz
```

### `payouts`
```sql
id              uuid PK
creator_id      uuid REF users(id)
amount_cents    int NOT NULL
currency        text DEFAULT 'USD'
stripe_transfer_id text
status          text                          -- pending|paid|failed
period_start, period_end  date
created_at, paid_at
```

### `creator_balance`
Materialized view of pending vs. available earnings per creator.
```sql
creator_id      uuid PK
pending_cents   bigint                        -- sales in 30-day hold
available_cents bigint
lifetime_cents  bigint
last_updated_at timestamptz
```

---

## Verification

### `pilot_verifications`
```sql
id              uuid PK
user_id         uuid REF users(id) unique
status          text                          -- pending|approved|rejected
id_doc_s3_key   text                          -- gov ID, encrypted
drone_reg_number text                         -- FAA / KARA / CAA / …
drone_reg_country text
drone_reg_s3_key text
reviewer_id     uuid REF users(id)            -- admin
reviewed_at     timestamptz
notes           text
```

---

## Messaging, notifications

### `notifications`
```sql
id              uuid PK
user_id         uuid REF users(id)             [idx]
kind            text NOT NULL                 -- order_paid | new_follower | comment_reply | payout_sent | …
payload         jsonb
read_at         timestamptz
created_at                                    [idx desc]
```

### `conversations` / `messages` — standard DM table pair. Defer to post-MVP if not needed day 1.

---

## Indexing strategy

- **Spatial:** `CREATE INDEX ON videos USING GIST (ll_to_earth(lat, lon))` — earth-distance queries.
- **Search:** full-text on `videos.title, description, tags` via `tsvector`, or ship to Typesense.
- **Hot queries:**
  - videos by location + category (composite idx on `location_id, category`)
  - videos by creator (idx on `creator_id, created_at DESC`)
  - comments by video (idx on `video_id, created_at DESC`)
  - orders by buyer (idx on `buyer_id, created_at DESC`)

---

## Retention & GDPR

- User deletion: soft-delete + anonymize display_name/handle/email; keep `videos` attached to a "former creator" stub so orders remain valid.
- Payment records: retain 7 years per accounting rules even after user delete.
- Uploaded media: hard-delete from S3 within 30 days of creator account deletion, unless a license exists — then retain for license fulfillment.
