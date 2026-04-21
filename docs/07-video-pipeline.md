# 07 · Video Pipeline

Uploads → Transcode → Storage → Playback. The hardest operational piece; plan for 90% of ops cost to land here.

---

## Upload flow

```
 Browser                Backend               S3                  Queue
    │                      │                    │                    │
    │ POST /videos         │                    │                    │
    ├─────────────────────►│                    │                    │
    │                      │ createMultipart    │                    │
    │                      ├───────────────────►│                    │
    │                      │◄───── uploadId ────│                    │
    │                      │ presign part URLs  │                    │
    │◄──── upload plan ────│                    │                    │
    │ PUT part 1..N  ─────────────────────────►│                    │
    │◄───── etags ─────────────────────────────│                    │
    │ POST /videos/:id/complete                 │                    │
    ├─────────────────────►│                    │                    │
    │                      │ completeMultipart ►│                    │
    │                      │ enqueue transcode ─────────────────────►│
    │◄──── 202 processing  │                    │                    │
```

### Client rules

- Multipart size: 16 MB parts
- Max concurrent uploads: 4 parts
- Resumable: persist `uploadId` + part etags to localStorage; user can close tab and resume
- Client-side checks before upload: file size ≤ 10 GB, extension in `.mov .mp4 .mxf .mkv`, duration ≤ 30 min

---

## Transcode job

Worker (MediaConvert job template or custom ffmpeg on a GPU node):

```
INPUTS: original video
OUTPUTS:
  - preview_3s.m3u8       1080p, 3s clip from best-frame moment (first hook)
  - adaptive/360p.m3u8    + 720p, 1080p, 2160p ladder
  - original.mp4          stored, served only on licensed download
  - thumbnails/           5 frames at 10/25/50/75/90% of duration
  - waveform.json         (optional, for editor scrub bar)
METADATA EXTRACTED:
  - duration, fps, codec, bitrate, resolution, color_space
  - GPS lat/lon from EXIF (DJI, Skydio, Autel all embed)
  - captured_at from EXIF/QuickTime atoms
  - flagged: faces detected, logos detected (for model-release warnings)
```

### "Best frame" for preview

Pick a 3-second window starting at the highest-variance frame (most motion/interest) between the 15% and 70% mark. Falls back to 15% mark if extraction fails.

### Hash + dedup

Compute perceptual hash (pHash) of 10 evenly-spaced frames. On upload, check against existing hashes — reject if > 95% match (re-upload detection / theft prevention).

---

## Storage layout (S3)

```
s3://di-media/
  originals/{video_id}/{filename}                # creator download source
  hls/{video_id}/preview/
    preview.m3u8
    preview_*.ts
  hls/{video_id}/full/
    master.m3u8
    360p/..., 720p/..., 1080p/..., 2160p/...
  thumbs/{video_id}/
    primary.jpg (1920w)
    t1.jpg … t5.jpg
    primary@400w.webp
```

Buckets:
- `di-media-originals` — private, KMS-encrypted, no public access ever
- `di-media-hls` — private, served via signed Cloudflare URLs
- `di-thumbnails` — public via CDN

---

## Playback flow

```
Anon viewer:
  GET /videos/:id/preview → signed preview.m3u8 (3s clip) → plays in HLS.js
  ↓ (after 3s)
  Paywall overlay shown
  ↓ (buyer signs in, pays)
  GET /videos/:id/stream → signed full master.m3u8, resolution-gated by license tier
  ↓
  Full playback with quality selector limited to purchased max
```

### Signed URL specifics

- Preview: 10-minute expiry, no user ID binding (anyone can hit it)
- Full stream: 2-hour expiry, signed against `user_id + license_id`; invalidate if license revoked
- Download (original): 1-hour expiry, single-use token, deducted from `download_limit`

### DRM?

MVP: **No DRM.** Ship HLS + signed URLs. DRM (Widevine/FairPlay) adds weeks of integration for marginal gain at this stage.

Revisit if top sellers ($10k+/mo) demand Extended or Exclusive licenses with stronger protection.

---

## Watermarking (optional)

For Personal tier downloads: burn-in faint bottom-right watermark `icarus.fly / @creator` at 18% opacity. Done via ffmpeg overlay pass during transcode, stored as a separate rendition.

Commercial / Extended / Exclusive: no watermark.

---

## GPS metadata extraction

Supported extractors (by drone brand):

| Brand | Where GPS lives |
|---|---|
| DJI | QuickTime `udta` atom, JSON sidecar (`.SRT` sometimes) |
| Skydio | EXIF GPS tags in MP4 |
| Autel | EXIF + proprietary metadata stream |
| GoPro (with GPS) | GPMF metadata stream |
| Anafi / Parrot | EXIF |

Use `exiftool` in the worker container for a unified extraction pass. If GPS is absent or creator overrode it, show a "manual pin drop" step in the upload wizard.

---

## Failure modes & retries

| Failure | Handling |
|---|---|
| Transcode fails | Retry 3× with backoff. If final: mark `status=rejected`, email creator with reason |
| Upload aborted mid-way | Abort multipart after 24h inactivity (S3 lifecycle rule) |
| Corrupt file | Detect via ffprobe; reject at `/complete` step |
| GPS missing | Leave `location_id` null, prompt manual entry |
| Dedup hit | Reject at `/complete` step with clear error |

---

## Cost model (rough)

At 1000 uploads/month, avg 8 GB file, avg 3 min duration:

| Line item | Monthly |
|---|---|
| Ingress (free on most clouds) | $0 |
| Object storage (originals, 8 TB/mo growth) | ~$180 |
| Object storage (HLS, ~2 TB) | ~$45 |
| Transcode (MediaConvert, ~50k min) | ~$300 |
| CDN egress (~50 TB, preview-heavy) | ~$2,500 |
| **Total** | **~$3,025** |

CDN egress is the lever that matters. Aggressive preview caching + long-tail tiered storage (S3 IA after 90 days) are worth it.
