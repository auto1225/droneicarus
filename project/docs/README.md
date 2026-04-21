# Drone Icarus — Developer Handoff

A visual, map-first marketplace for aerial drone footage. This bundle is a clickable React prototype that documents **product shape, UX flows, and visual system**. Engineering should treat it as a reference — not a production codebase.

> **TL;DR for engineers**
> - Prototype is React 18 + Babel-in-browser, single HTML entrypoint, hash routing.
> - Data is mocked in `data.jsx`. Everything in the player, checkout, upload, and earnings pages is UI-only.
> - Map uses Leaflet + OpenStreetMap tiles. Pins are hand-placed on real lat/lon for 28 landmarks.
> - Production implementation should be a SPA (Next.js recommended) with a REST/GraphQL backend, object storage for video, and a CDN for HLS playback.

---

## 📚 Documents in this handoff

| File | Audience | What's inside |
|---|---|---|
| [`01-overview.md`](./01-overview.md) | PM, Eng leads | Product summary, personas, pillars, scope |
| [`02-architecture.md`](./02-architecture.md) | Backend, Platform | Proposed system architecture, services, data flow |
| [`03-data-model.md`](./03-data-model.md) | Backend | Entities, relationships, table sketches |
| [`04-api-contract.md`](./04-api-contract.md) | Backend, Frontend | REST endpoints, request/response shapes |
| [`05-frontend.md`](./05-frontend.md) | Frontend | Routes, components, state, styling tokens |
| [`06-design-system.md`](./06-design-system.md) | Frontend, Design | Colors, type, spacing, motion, components |
| [`07-video-pipeline.md`](./07-video-pipeline.md) | Platform, Infra | Upload → transcode → HLS → CDN flow |
| [`08-map-layer.md`](./08-map-layer.md) | Frontend, Data | Pin clustering, tiles, geocoding |
| [`09-licensing-payments.md`](./09-licensing-payments.md) | Backend, Legal | License tiers, Stripe flow, payouts |
| [`10-auth-roles.md`](./10-auth-roles.md) | Backend, Security | Viewer / Pilot / Studio, verification |
| [`11-testing-qa.md`](./11-testing-qa.md) | QA, Eng | Test plan, E2E flows, edge cases |
| [`12-roadmap.md`](./12-roadmap.md) | PM, Eng | MVP → v2 phasing |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Anyone | How to run, edit, and extend the prototype |

---

## 🗂 Prototype file map

```
Drone Icarus.html      ← single HTML entry. Loads fonts, Leaflet, React, Babel, and all JSX in order.
styles.css             ← design tokens + global CSS (light/dark, density, accent)
app.jsx                ← App shell, hash routing, Tweaks panel
data.jsx               ← all mock data (LOCATIONS, VIDEOS, CREATORS, ORDERS, …)
components.jsx         ← shared: Header, Footer, VideoCard, icons (Ic.*), pills, etc.
toast.jsx              ← global toast system (window.toast.success/error/info)
comments.jsx           ← video comments thread + replies
pages/
  home.jsx             ← hero map + featured grid + trending
  player.jsx           ← video page, 3s paywall preview, related, comments
  location.jsx         ← single landmark detail
  explore.jsx          ← category browser
  rankings.jsx         ← leaderboards
  creator.jsx          ← creator public profile + studio dashboard
  profile.jsx          ← user public profile
  mypage.jsx           ← collections, favorites
  upload.jsx           ← multi-step upload wizard (UI-only)
  checkout.jsx         ← Stripe-style 2-col checkout
  earnings.jsx         ← creator payouts dashboard
  auth.jsx             ← sign in / sign up / forgot password
  settings.jsx         ← account, notifications, payout settings
  pilot-onboarding.jsx ← drone reg + creator verification
  pricing.jsx          ← 3-tier pricing + license tier table
  shotlibrary.jsx      ← curated use-case bundles
  advanced.jsx         ← faceted search
  atlas.jsx, live.jsx, flightlog.jsx, commission.jsx, …
```

---

## 🚀 Running the prototype

```bash
# any static file server
npx serve .
# or
python3 -m http.server 8000
```

Open `Drone Icarus.html`. No build step.

> ⚠️ Opening via `file://` may break `fetch` for Babel-transformed JSX. Always serve over HTTP.

---

## 🧭 Navigation (hash routes)

| Hash | Page |
|---|---|
| `#home` | Map hero + grid |
| `#watch/:videoId` | Player |
| `#location/:locationId` | Landmark |
| `#explore` | Category browser |
| `#search` | Search results |
| `#rankings` | Leaderboards |
| `#creator` | Creator dashboard |
| `#profile/:handle` | Public profile |
| `#mypage` | User collections |
| `#upload` | Upload wizard |
| `#checkout/:videoId` | Cart / payment |
| `#success` | Post-purchase |
| `#orders` / `#license/:orderId` | Order history |
| `#earnings` | Payouts |
| `#signin` | Auth |
| `#settings` | Account settings |
| `#pilot-onboarding` | Become a creator |
| `#pricing` | Plans |
| `#shotlibrary` | Curated bundles |
| `#advanced` | Faceted search |

---

## ⚠️ What this prototype does NOT do

- **No real video hosting** — player uses placeholder YouTube IDs for visual fidelity.
- **No real payments** — checkout is UI only; integrate Stripe.
- **No auth** — sign-in form is cosmetic; `CURRENT_USER` is hardcoded in `data.jsx`.
- **No geocoding** — map pins are hand-coded lat/lon.
- **No moderation, DMCA, takedown flows** — out of prototype scope; see `01-overview.md`.
- **No search backend** — client-side filter over mock arrays.
- **No i18n system** — Korean/English toggle is a tiny `LANG` object in `app.jsx`.

These are the gaps engineering owns.

---

## 📬 Questions? Contact

- **Product:** PM channel
- **Design:** [design system doc](./06-design-system.md)
- **Architecture:** [arch doc](./02-architecture.md)
