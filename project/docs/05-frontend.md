# 05 · Frontend Engineering

## Prototype vs. production stack

| Concern | Prototype | Production (recommended) |
|---|---|---|
| Framework | React 18 via CDN + Babel-in-browser | Next.js 14 (App Router) |
| Routing | Hash-based (`#home`, `#watch/:id`) | File-based + dynamic segments |
| Styling | Plain CSS + inline style objects | Tailwind CSS or Vanilla Extract |
| State | `useState` / `useEffect` | TanStack Query + Zustand (client state) |
| Data | In-memory mock (`data.jsx`) | REST/GraphQL client, SWR |
| Build | None | Turbopack / Vite |
| Tests | Manual | Playwright (E2E), Vitest (unit), Storybook |

Port the pages 1:1 into Next.js route files. Each `pages/*.jsx` in the prototype maps to an `app/*/page.tsx`.

---

## Route map (Next.js App Router)

```
app/
  layout.tsx                  ← Header, Footer, Toast, AuthProvider
  page.tsx                    ← / (home)
  watch/[id]/page.tsx
  location/[slug]/page.tsx
  explore/page.tsx
  search/page.tsx             ← ?q=
  rankings/page.tsx
  creators/page.tsx           ← list
  profile/[handle]/page.tsx
  creator/                    ← dashboard
    dashboard/page.tsx
    uploads/page.tsx
    earnings/page.tsx
    analytics/page.tsx
  upload/page.tsx             ← multi-step form (use parallel routes or step query)
  mypage/                     ← user home
    collections/page.tsx
    favorites/page.tsx
    orders/page.tsx
    licenses/[id]/page.tsx
  checkout/[videoId]/page.tsx
  checkout/success/page.tsx
  auth/
    signin/page.tsx
    signup/page.tsx
    forgot/page.tsx
    onboarding/page.tsx       ← pilot verification
  settings/
    account/page.tsx
    notifications/page.tsx
    payouts/page.tsx
  pricing/page.tsx
  shot-library/page.tsx
  advanced-search/page.tsx
  atlas/page.tsx
  live/page.tsx
  commission/page.tsx
  messages/page.tsx
  notifications/page.tsx
  legal/[slug]/page.tsx       ← terms, privacy, licenses
```

---

## Shared components

Map prototype → production component names:

| Prototype | Production |
|---|---|
| `<Header>` | `components/layout/Header.tsx` |
| `<Footer>` | `components/layout/Footer.tsx` |
| `<VideoCard>` | `components/video/VideoCard.tsx` |
| `<LocationMap>` | `components/map/LocationMap.tsx` |
| `<CommentThread>` | `components/comments/CommentThread.tsx` |
| `<ToastStack>` | `components/toast/Toaster.tsx` |
| `<TweaksPanel>` | remove — this is prototype-only |
| `Ic.*` (icons) | Lucide React |

### Component guidelines

- All interactive components → Client Components (`'use client'`).
- Data-heavy routes (home, location, explore) → server-render the first page, hydrate for interactions.
- Video player: use **Mux Player** (`@mux/mux-player-react`) or **HLS.js** directly. Do NOT embed YouTube in production — the prototype uses YT for visual fidelity only.

---

## Data fetching pattern

```tsx
// app/location/[slug]/page.tsx
import { getLocation, getVideosAtLocation } from '@/lib/api/locations';

export default async function LocationPage({ params }: { params: { slug: string } }) {
  const [location, videos] = await Promise.all([
    getLocation(params.slug),
    getVideosAtLocation(params.slug, { limit: 24 }),
  ]);
  return <LocationView location={location} initialVideos={videos} />;
}
```

Client-side pagination and filters → TanStack Query with prefetched initial data.

---

## State boundaries

| State | Where it lives |
|---|---|
| Auth session | Server session cookie + React context for client |
| Current playing video | Local route param + client state |
| Cart | Zustand store, persisted to localStorage |
| Toasts | Zustand store |
| Tweaks (prototype only) | Strip before prod |
| Map viewport (bbox, zoom) | URL search params (`?bbox=…&z=…`) so shares work |
| Filters (category, resolution, etc.) | URL search params |

**Rule:** anything reloadable or shareable goes in the URL, not local state.

---

## Accessibility baseline

- Every interactive element is keyboard-focusable. Prototype has gaps — fix in production.
- Color contrast: verify all text ≥ WCAG AA against its background, including dark/light themes.
- Player controls: labelled buttons, ARIA live region for caption updates, focus trap in modal paywalls.
- Map: provide a non-map alternative view (list of locations sorted by country).
- Autoplay: respect `prefers-reduced-motion` for the hero autoplay video.

---

## Styling tokens → Tailwind config

Copy values from `styles.css` `:root` block into `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      ink: 'var(--ink)',
      bone: 'var(--bone)',
      parchment: { DEFAULT: 'var(--parchment)', dim: 'var(--parchment-dim)' },
      sunset: { DEFAULT: 'var(--sunset)', deep: 'var(--sunset-deep)' },
      amber: 'var(--amber)',
      moss: 'var(--moss)',
      forest: { 600: 'var(--forest-600)', 700: '…', 800: '…', 900: '…', 950: '…' },
    },
    fontFamily: {
      display: 'var(--font-display)',
      ui: 'var(--font-ui)',
      mono: 'var(--font-mono)',
    },
  },
}
```

See `06-design-system.md` for the full token set.

---

## Performance checklist

- [ ] Ship images as AVIF + WebP + JPEG fallback. Use `next/image`.
- [ ] Defer Leaflet JS until the map is in viewport (dynamic import).
- [ ] Inline critical CSS for first render of `/` (hero).
- [ ] Route-based code splitting — dashboard, upload, checkout each their own chunk.
- [ ] Preload HLS manifest for first video tile on hover.
- [ ] Service worker for offline shell + recently-viewed videos.
- [ ] Don't SSR the map itself (Leaflet wants `window`). SSR the surrounding page.
