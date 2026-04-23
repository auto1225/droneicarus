# Drone Icarus — Setup & Continue on Desktop

This repo now has **two** runnable surfaces:

| | Prototype (original) | Vite build (new) |
|---|---|---|
| Entry | `Drone Icarus.html` | `index.html` |
| Build | none (Babel-in-browser) | Vite (`npm run build`) |
| Start | `npm run prototype` | `npm run dev` |
| Purpose | Visual preview / design reference | Production app with Supabase |

Both share the same design tokens in `styles.css` (copied to `src/styles.css`).

---

## 1. First-time setup

### Install dependencies
```bash
npm install
```

### Configure Supabase credentials

1. **Rotate your Supabase keys first** — the prior keys may have been exposed during development. In Supabase Dashboard → Settings → API → **Rotate** both the publishable and secret keys.

2. Copy `.env.example` → `.env.local` and fill in the rotated values:

```bash
cp .env.example .env.local
# Edit .env.local with your own values
```

The keys used at build time are:
- `VITE_SUPABASE_URL` — project URL (public, safe to expose)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_…` (public)
- `SUPABASE_SECRET_KEY` — `sb_secret_…` (**server-only**, used by seed scripts; never shipped to the browser)

`.env.local` is in `.gitignore`. Never commit it.

---

## 2. Apply Supabase migrations

In Supabase Dashboard → SQL Editor, paste and run each file in order:

1. `supabase/migrations/0001_init.sql` — schema (profiles, videos, locations, comments, orders, payouts, reviews, messages, notifications)
2. `supabase/migrations/0002_rls.sql` — row-level security policies
3. `supabase/migrations/0003_storage.sql` — storage buckets + policies
4. `supabase/migrations/0004_seed_locations.sql` — 28 landmark locations

(Or: `supabase db push` if you've linked the CLI.)

---

## 3. Seed demo data (optional)

```bash
node scripts/seed-supabase.mjs
```

This creates 8 demo pilot accounts + ~280 videos. Requires `SUPABASE_SECRET_KEY` in `.env.local` (service role).

After seeding, set `VITE_USE_SUPABASE_DATA=true` in `.env.local` so the UI reads from Supabase instead of falling back to mock data.

---

## 4. Run locally

```bash
npm run dev
# → http://localhost:5173
```

### Or see the original Babel-in-browser prototype
```bash
npm run prototype
# → http://localhost:8000/Drone%20Icarus.html
```

---

## 5. GitHub Pages deployment

The `.github/workflows/pages.yml` workflow runs on every push to `main`:

1. `npm ci`
2. `npm run build` (needs GitHub **Secrets** set on the repo)
3. Uploads `dist/` to Pages

Set these in **Settings → Secrets and variables → Actions**:
- `VITE_SUPABASE_URL` (secret)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (secret)
- `VITE_USE_SUPABASE_DATA` (variable, set to `true` after seeding)

---

## 6. Structure

```
.
├── Drone Icarus.html      ← original prototype (Babel-in-browser)
├── index.html             ← Vite entry point
├── src/
│   ├── main.jsx           ← React root + AuthProvider
│   ├── App.jsx            ← shell + routing + Tweaks panel
│   ├── data.jsx           ← mock data (fallback)
│   ├── components.jsx     ← Header, Footer, VideoCard, Ic…
│   ├── toast.jsx, comments.jsx
│   ├── styles.css         ← global CSS tokens
│   ├── supabase.js        ← Supabase client (publishable key)
│   ├── auth/AuthContext.jsx
│   ├── db/videos.js       ← video/location fetch helpers
│   ├── db/storage.js      ← upload / signed-URL helpers
│   └── pages/             ← 25 page components
├── supabase/migrations/   ← .sql files — run in order
├── scripts/
│   ├── migrate-to-esm.mjs ← (already ran) bulk JSX conversion
│   └── seed-supabase.mjs  ← demo data seeder
└── .github/workflows/pages.yml
```

---

## 7. What's wired vs. still mock

| Area | Status |
|---|---|
| Auth (sign-in, sign-up, forgot password, sign-out) | ✅ real Supabase Auth |
| Header profile menu | ✅ shows real profile + Sign out |
| Upload → Storage + DB insert | ✅ real (needs signed-in pilot) |
| Video & location lists | [PARTIAL] falls back to mock unless `VITE_USE_SUPABASE_DATA=true` |
| Comments, likes, collections | ❌ still mock (schema ready, UI not yet wired) |
| Orders, payouts | ❌ still mock (schema ready) |
| Live flights, notifications | ❌ still mock (schema ready) |

The remaining mock→Supabase wiring is a mechanical refactor using the existing `src/db/*.js` helpers — add `fetchComments(videoId)`, `fetchOrders(buyerId)`, etc. along the same pattern.

---

## 8. Security reminders

- **Never** commit `.env.local`.
- The secret key (`sb_secret_…`) must stay server-side only. It's used by `scripts/seed-supabase.mjs` but NEVER imported by anything in `src/`.
- Rotate keys immediately if they're ever exposed in logs, chat, or commit history.
- GitHub Pages deployment only sees the publishable key (via Actions Secrets).
