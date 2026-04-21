# Drone Icarus

> Aerial footage, mapped. A map-first marketplace for drone videos — find clips by location, not keywords.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-prototype-orange)

---

## 🌍 What is this?

**Drone Icarus** is a clickable React prototype of a map-based marketplace for aerial drone footage. Instead of searching by keyword, buyers drop onto a world map, click a landmark, and browse every drone clip ever shot there. Sellers (pilots + studios) upload with GPS metadata; buyers license for personal, commercial, or exclusive use.

> **"I need a 4K shot of the Pyramids at golden hour."**
> On other stock sites: 40 keywords, wrong location, generic tourist photos mixed in.
> On Icarus: open the map → click Giza → 47 clips, filtered by time-of-day, altitude, season.

---

## 🚀 Run the prototype

No build step. Serve the folder over HTTP and open `Drone Icarus.html`.

```bash
# pick one
npx serve .
python3 -m http.server 8000
php -S localhost:8000
```

Then open → http://localhost:8000/Drone%20Icarus.html

> ⚠️ Do **not** open via `file://` — Babel-in-browser can't fetch sibling JSX files cross-origin.

---

## 📁 Project structure

```
Drone Icarus.html   ← single HTML entry (loads fonts, Leaflet, React, Babel, all JSX in order)
styles.css          ← design tokens + global CSS (light/dark, density, accent)
app.jsx             ← App shell, hash routing, Tweaks panel
data.jsx            ← all mock data (LOCATIONS, VIDEOS, CREATORS, ORDERS, …)
components.jsx      ← shared: Header, Footer, VideoCard, icons (Ic.*), pills
toast.jsx           ← global toast system (window.toast.success/error/info)
comments.jsx        ← video comments thread + replies
pages/
  home.jsx          ← hero map + featured grid + trending
  player.jsx        ← video page, 3s paywall preview, related, comments
  location.jsx, explore.jsx, rankings.jsx, …
  creator.jsx, profile.jsx, mypage.jsx
  upload.jsx, checkout.jsx, earnings.jsx, auth.jsx
  settings.jsx, pilot-onboarding.jsx
  pricing.jsx, shotlibrary.jsx, advanced.jsx
  atlas.jsx, live.jsx, flightlog.jsx, commission.jsx
  messages.jsx, notifications.jsx, static.jsx
docs/               ← full engineering handoff (see below)
```

---

## 📚 Documentation

Full developer handoff lives in [`docs/`](./docs). Open [`docs/index.html`](./docs/index.html) in a browser for a visual hub, or read the markdown directly:

| # | Doc | What's inside |
|---|---|---|
| — | [`README`](./docs/README.md) | Prototype file map, running, navigation |
| 01 | [`Overview`](./docs/01-overview.md) | Product, personas, pillars, scope |
| 02 | [`Architecture`](./docs/02-architecture.md) | System diagram, services, perf budget |
| 03 | [`Data Model`](./docs/03-data-model.md) | Postgres schema, indexing, GDPR |
| 04 | [`API Contract`](./docs/04-api-contract.md) | REST endpoints, request/response shapes |
| 05 | [`Frontend`](./docs/05-frontend.md) | Next.js routes, state, a11y |
| 06 | [`Design System`](./docs/06-design-system.md) | Colors, type, spacing, motion |
| 07 | [`Video Pipeline`](./docs/07-video-pipeline.md) | Upload → transcode → HLS → CDN |
| 08 | [`Map Layer`](./docs/08-map-layer.md) | Mapbox strategy, clustering, 3D terrain |
| 09 | [`Licensing & Payments`](./docs/09-licensing-payments.md) | License tiers, Stripe Connect |
| 10 | [`Auth & Roles`](./docs/10-auth-roles.md) | Verification, MFA, ABAC |
| 11 | [`Testing & QA`](./docs/11-testing-qa.md) | E2E coverage, release gates |
| 12 | [`Roadmap`](./docs/12-roadmap.md) | 26-week MVP plan |
| — | [`CONTRIBUTING`](./docs/CONTRIBUTING.md) | How to edit and extend |

---

## 🧭 Navigation (hash routes)

| Hash | Page |
|---|---|
| `#home` | Map hero + grid |
| `#watch/:videoId` | Player with 3s preview paywall |
| `#location/:locationId` | Landmark detail |
| `#explore` | Category browser |
| `#search` | Search results |
| `#rankings` | Leaderboards |
| `#creator` | Creator dashboard |
| `#profile/:handle` | Public profile |
| `#mypage` | User collections |
| `#upload` | Upload wizard |
| `#checkout/:videoId` | Cart / payment |
| `#success` | Post-purchase |
| `#orders` / `#license/:orderId` | Order history / certificate |
| `#earnings` | Creator payouts |
| `#signin` | Auth |
| `#settings` | Account settings |
| `#pilot-onboarding` | Become a creator |
| `#pricing` | Plans |
| `#shotlibrary` | Curated bundles |
| `#advanced` | Faceted search |
| `#atlas` / `#live` / `#flightlog/:id` | Exploration features |
| `#commission` / `#messages` / `#notifications` | Community |

---

## 🎨 Design system — quick reference

**Aesthetic:** adventure/outdoor — warm parchment tones, forest greens, sunset accents.

**Colors** (light theme):
- `--ink` `#faf6ec` — page bg
- `--bone` `#0f1a14` — primary text
- `--sunset` `#c85a2e` — primary CTA
- `--amber` `#c68820` — secondary accent
- `--moss` `#6b8a55` — success

**Type:** Bricolage Grotesque (display), Inter Tight (UI), JetBrains Mono (meta). Themeable via Tweaks panel.

**Map:** Leaflet + Esri World Imagery (satellite) + Carto Voyager labels overlay.

See [`docs/06-design-system.md`](./docs/06-design-system.md) for full tokens.

---

## ⚠️ What this prototype does NOT do

- **No real video hosting** — player uses placeholder YouTube IDs for visual fidelity
- **No real payments** — checkout UI only; integrate Stripe in production
- **No auth** — sign-in form is cosmetic; `CURRENT_USER` hardcoded in `data.jsx`
- **No geocoding** — map pins are hand-coded lat/lon
- **No moderation flows** — out of prototype scope
- **No search backend** — client-side filter over mock arrays

These gaps are what engineering builds next. See [`docs/12-roadmap.md`](./docs/12-roadmap.md).

---

## 🛠️ Tech stack

### Prototype
- React 18 + Babel-in-browser (no build)
- Leaflet 1.9.4 for maps
- Hash routing, in-memory mock data

### Production (recommended)
- Next.js 14 App Router
- Tailwind CSS with token config
- TanStack Query + Zustand
- Mapbox GL JS (or MapLibre)
- Stripe + Stripe Connect Express
- Postgres + Typesense + S3 + CloudFront/Cloudflare
- Playwright for E2E

See [`docs/02-architecture.md`](./docs/02-architecture.md).

---

## 📦 License

MIT — see [LICENSE](LICENSE).

---

## 🧭 Contact

- Repo: https://github.com/auto1225/droneicarus
- Prototype built with Claude

