# 12 · Roadmap

Phasing for engineering + product. Dates assume a 5-person team (2 frontend, 2 backend, 1 infra/platform). Designer + PM scoped separately.

---

## Phase 0 · Foundation (weeks 1–3)

Goal: deploy skeleton, wire auth, database, CI/CD.

- [ ] Next.js app bootstrapped, Tailwind + token config from `06-design-system.md`
- [ ] Postgres schema from `03-data-model.md` (core tables only)
- [ ] Auth service (OIDC provider chosen + wired)
- [ ] CI/CD pipeline (GitHub Actions → staging + prod)
- [ ] Sentry + PostHog installed
- [ ] Basic shell pages: `/`, `/signin`, `/signup`, `/settings/account`
- [ ] Cloudflare DNS + SSL + edge config

**Exit:** a signed-in user lands on an empty home page and can log out.

---

## Phase 1 · MVP playback (weeks 4–9)

Goal: viewers can discover and watch drone footage on the map. No commerce yet.

- [ ] Map hero with Mapbox GL + vector tiles
- [ ] `/pins` endpoint + server-side clustering
- [ ] Seed 200 landmark locations
- [ ] Video ingest: admin-only initially, uploads via direct S3
- [ ] Transcode pipeline (MediaConvert + worker) → HLS
- [ ] Video player with HLS.js, 3s preview paywall
- [ ] `/location/:slug` page
- [ ] `/watch/:id` page
- [ ] Comments + likes + follows
- [ ] Collections
- [ ] Search (Typesense integration, basic query)

**Exit:** 50 seeded videos live, viewable, commentable. Zero monetization.

---

## Phase 2 · Commerce (weeks 10–14)

Goal: buyers can license videos.

- [ ] Stripe integration (PaymentIntent + webhooks)
- [ ] Checkout page + Stripe Elements
- [ ] License tiers + price logic
- [ ] PDF certificate generation
- [ ] `/orders` + `/license/:id`
- [ ] Signed download URLs with tier gating
- [ ] Email receipts (Resend)
- [ ] Basic refund flow
- [ ] Pricing page

**Exit:** first paid purchase → successful download → certificate in inbox.

---

## Phase 3 · Creator economy (weeks 15–20)

Goal: pilots can upload and earn.

- [ ] Pilot verification (Stripe Identity + manual review queue)
- [ ] Multi-step upload wizard
- [ ] GPS extraction pipeline + manual pin fallback
- [ ] Creator dashboard (uploads, analytics, earnings)
- [ ] Stripe Connect Express onboarding
- [ ] Payout scheduling (weekly auto + manual request)
- [ ] Moderation queue for admin
- [ ] Public creator profile page

**Exit:** 10 external pilots onboarded, each with at least one published video sold at least once.

---

## Phase 4 · Quality & scale (weeks 21–26)

Goal: feels like a real product.

- [ ] Advanced search (faceted: resolution, fps, weather, drone model, …)
- [ ] Shot library (curated bundles)
- [ ] Rankings (trending, country charts, all-time)
- [ ] Collections as shareable links with OG previews
- [ ] Email digests (weekly "new drops near you")
- [ ] Mobile-responsive polish across all pages
- [ ] i18n groundwork (EN + KO first)
- [ ] Performance budgets enforced in CI
- [ ] Accessibility audit + fixes

**Exit:** 500 creators, 1000+ published videos, GMV ≥ $20k/mo.

---

## Phase 5 · Growth features (post-launch)

Not committed yet — prioritize based on data.

- [ ] Commissions ("pay a pilot to fly here")
- [ ] Live streaming from DJI drones
- [ ] iOS/Android apps
- [ ] AI auto-tagging (subject matter, composition, color grade)
- [ ] Studio enterprise tier (API, bulk upload, SSO)
- [ ] Licensing API for programmatic buyers (ad platforms, ML companies)
- [ ] Royalty-share re-licensing (creator gets % of downstream use)
- [ ] Regional content restrictions / geoblocking

---

## What we're NOT building

- Social feed / news feed — we are a marketplace, not TikTok
- Real-time DMs as priority — basic messages in phase 4, rich in phase 5 only if data supports
- Native NFT/crypto integrations — no strong demand signal
- Video editing tools — out of scope; we are upstream of editors, not one of them
- Creator courses / tutorials — content partnership opportunity, not core product

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| CDN egress costs spike as previews scale | High | Aggressive cache, 3s preview length, lazy-load only on explicit click after first |
| Content moderation overwhelmed | High | Auto-flagging on upload (nudity, copyright AI), report-driven review, community trust scores |
| Creator quality skew (long tail is junk) | Medium | Curation team, earned "editorial" badge, search boost for verified |
| Regulatory (drone flight legality varies) | Medium | Require creator to confirm legal flight per clip; ToS disclaims responsibility |
| Payout fraud | Medium | Stripe Connect does heavy lifting; add Plaid verification for high earners |
| Map cost (Mapbox) exceeds plan | Low | Pre-built, switch to MapLibre if budget bites |
