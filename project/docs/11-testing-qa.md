# 11 · Testing & QA

---

## Test pyramid

```
         /\
        /  \   E2E (Playwright)              ~30 flows
       /────\
      /      \   Integration (Vitest + MSW)   ~200 tests
     /────────\
    /          \   Unit (Vitest)              ~600 tests
   /────────────\
```

---

## E2E coverage (Playwright)

Critical flows that must always work:

### Discovery
- [ ] Map loads with pins within 2s
- [ ] Click a pin → drawer opens with videos
- [ ] Use search box → fly-to + open drawer
- [ ] Pan/zoom → URL updates → reload restores view
- [ ] Category filter updates pin set

### Playback
- [ ] Anon user can preview any video for exactly 3s
- [ ] After 3s, paywall overlay blocks playback
- [ ] Signed-in user with license can watch full video
- [ ] Resolution selector matches license tier cap
- [ ] Comments render, user can post + reply + like

### Purchase
- [ ] Guest checkout (create account during) — full happy path
- [ ] Apple Pay / Google Pay / card — each works
- [ ] Failed card → error shown → retry works
- [ ] Success page → download link → file downloads
- [ ] Order shows up in `/orders`
- [ ] Certificate PDF downloads and is valid

### Upload
- [ ] Pilot uploads 2 GB file → progress shown → resumable
- [ ] GPS extracted automatically → pin preview matches
- [ ] Pricing tiers set → saved → visible on public page
- [ ] Published video appears in search within 60s

### Earnings
- [ ] Creator sees pending + available balance
- [ ] 30-day hold applies correctly
- [ ] Payout request succeeds → Stripe receives transfer

---

## Key edge cases

| Scenario | Expected |
|---|---|
| Pilot uploads duplicate (perceptual match) | Reject with clear error |
| Buyer downloads 6 times on a 5-limit tier | 6th request returns 403 |
| Creator deletes video with active licenses | Existing licensees still stream; new sales blocked |
| Refunded order | License revoked within 60s; stream 401s |
| Session expires mid-checkout | Graceful re-auth, cart preserved |
| GPS missing from upload | Manual pin step mandatory before publish |
| Stripe webhook arrives twice | Idempotent; second is a no-op |
| User bans creator → comments hidden for them only | Own comments still visible |
| 4K download on 1080p-capped license | HLS manifest hides 2160p rendition |
| Map opens on IE / no-JS | Falls back to list of landmarks |

---

## Accessibility tests

Automated:
- axe-core in Playwright on every E2E flow — zero serious violations
- Contrast ratios programmatically checked for all tokens on both themes

Manual (per release):
- Full VoiceOver walkthrough of home, watch, checkout
- Keyboard-only navigation of map list-view + checkout
- Screen magnifier (400% zoom) — no horizontal scroll, no clipped text

---

## Performance tests

- Lighthouse CI budget, fail build if:
  - LCP > 2.5s on `/`
  - TBT > 200ms on `/`
  - CLS > 0.1
- k6 load tests weekly:
  - 500 RPS on `/pins` for 5 min — p95 < 200ms
  - 50 concurrent uploads (1 GB each) — all succeed
  - 1000 concurrent HLS stream starts — all < 500ms TTFB

---

## Data / content tests

- Weekly job: sample 100 random videos, verify:
  - All renditions playable
  - Thumbnails reachable
  - GPS within 5km of stated location
  - Duration in DB matches HLS manifest
- Link-check all static pages (terms, privacy, help) — no 404s

---

## Release gates

No deploy to prod unless:
1. All E2E green
2. No new a11y serious violations
3. Lighthouse budgets green
4. No open P0/P1 bugs
5. Two approvals + one designer signoff on UI changes
