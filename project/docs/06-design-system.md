# 06 · Design System

The prototype is the source of truth. Extract tokens from `styles.css` + `app.jsx` when building the production system.

---

## Color tokens

### Light (default) — "Parchment"

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#faf6ec` | Page background |
| `--forest-950` | `#f2ebd8` | Elevated surface (cards) |
| `--forest-900` | `#ebe0c5` | Card base |
| `--forest-800` | `#ddd0b0` | Hovered card |
| `--forest-700` | `#ccbd99` | Active chip |
| `--forest-600` | `#b8a888` | Muted fill |
| `--bone` | `#0f1a14` | Primary text |
| `--parchment` | `#1f2b22` | Secondary text |
| `--parchment-dim` | `#4a5548` | Tertiary text |
| `--sunset` | `#c85a2e` | Primary accent (CTAs, active) |
| `--sunset-deep` | `#9b4020` | Hovered CTA |
| `--amber` | `#c68820` | Secondary accent (badges, highlight) |
| `--moss` | `#6b8a55` | Success, verified, studio |
| `--rust` | `#8b3a1f` | Warning, destructive-subtle |
| `--line` | `rgba(26,40,32,0.12)` | Hairline |
| `--line-strong` | `rgba(26,40,32,0.28)` | Divider |

### Dark — "Forest"

| Token | Hex |
|---|---|
| `--ink` | `#0d1410` |
| `--forest-950` | `#0f1a14` |
| `--forest-900` | `#1a2820` |
| `--forest-800` | `#24352b` |
| `--bone` | `#f5ede0` |
| `--parchment-dim` | `#a8a090` |

### Accent variants (via Tweaks)

| Name | `--sunset` | `--sunset-deep` | `--amber` |
|---|---|---|---|
| Sunset (default) | `#d97045` | `#b5532f` | `#e8b04a` |
| Cobalt | `#3b82f6` | `#2563eb` | `#60a5fa` |
| Moss | `#6b8e4e` | `#4a6741` | `#a8c074` |
| Crimson | `#c73e3e` | `#8b2020` | `#e8a04a` |

**Rule:** never introduce new hex values in page code. Extend the token list first.

---

## Typography

### Families

| Var | Value | Use |
|---|---|---|
| `--font-display` | Bricolage Grotesque (default), Fraunces, Space Grotesk | Hero headlines, section titles |
| `--font-ui` | Inter Tight (default), IBM Plex Sans | Body, UI labels |
| `--font-mono` | JetBrains Mono | Eyebrows, timestamps, coordinates |

Loaded via Google Fonts; self-host in production via `next/font`.

### Scale (px / line-height)

| Class | Size | LH | Weight | Use |
|---|---|---|---|---|
| `h1` hero | 72 | 1.05 | 600 | Home hero |
| `h1` page | 44–56 | 1.1 | 600 | Page titles |
| `h2` | 32 | 1.15 | 600 | Section headers |
| `h3` | 22–24 | 1.3 | 600 | Card titles, comment header |
| body-lg | 17 | 1.55 | 400 | Descriptions |
| body | 15 | 1.5 | 400 | Default |
| body-sm | 13 | 1.5 | 500 | Secondary UI |
| caption | 11 | 1.4 | 500 | Metadata |
| eyebrow | 10–11 | 1.2 | 700 | `letter-spacing: 0.14–0.24em`, uppercase |

---

## Spacing

Prototype uses ad-hoc values. **In production, enforce an 8pt grid:**

```
2  4  6  8  12  16  20  24  32  40  48  64  80  96  128
```

Any other spacing value in a PR requires justification.

---

## Radii

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 3px | Chips, keyboard kbd |
| `radius-sm` | 6px | Buttons, inputs |
| `radius` | 8–10px | Card, dropdown |
| `radius-lg` | 14–16px | Panels, large cards |
| `radius-xl` | 24px | Modal |
| `radius-pill` | 9999px | Pill buttons, avatars |

---

## Shadows

```css
--shadow-lg: 0 24px 60px rgba(60, 50, 35, 0.18);
--shadow-md: 0 8px 20px rgba(60, 50, 35, 0.12);
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-focus: 0 0 0 3px rgba(200, 90, 46, 0.25);
```

Prefer warm brown-toned shadows (not gray) to match the parchment aesthetic.

---

## Motion

| Purpose | Duration | Easing |
|---|---|---|
| Micro (hover, focus) | 120ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Small (dropdown open, toast) | 180ms | same |
| Card hover lift | 200ms | `ease-out`, `translateY(-2px)` |
| Modal | 240ms | fade + scale 0.98→1.0 |
| Page transition | 300ms | fade only; no slide (map is our signature) |

Respect `prefers-reduced-motion: reduce` — drop translations/scales, keep fades.

---

## Iconography

- **Style:** 24×24 viewBox, stroke-based, 1.6 stroke-width, `currentColor`.
- **Library:** Lucide React in production. Prototype uses hand-drawn SVG in `components.jsx` → `Ic.*`.
- **Never mix** stroke and fill icons on the same surface.

---

## Component patterns

### Buttons

```
Primary   : bg=sunset, color=white, hover=sunset-deep, radius=6
Secondary : bg=forest-900, color=bone, border=line, hover=forest-800
Ghost     : bg=transparent, color=parchment-dim, hover=bg forest-900
Danger    : bg=rust, color=white
Pill      : radius=9999px, used for chips and filter tags
```

Heights: 32 (sm) / 40 (md, default) / 48 (lg).
Padding: 12px–18px horizontal.

### Video card

```
thumbnail     aspect-ratio 16/9, object-cover
duration      bottom-right corner, mono, bg thumb-overlay
price badge   top-right, sunset fill for paid, white text
resolution    top-left pill, amber
title         2-line clamp, font-display, 16px
creator row   avatar 24px + handle + verified check
meta          views · days ago, mono caption
```

### Comment

```
avatar        40px circle
name          bold, 14px, nowrap
badge         uppercase 10px, role-colored
body          15px, line-height 1.55
timestamp jump   inline pill, bg=bone, mono
```

### Map pin

```
cluster   circle bg=sunset, white text count, drop shadow
pin       teardrop SVG, sunset fill, amber highlight for featured
hover     scale 1.1, shadow-lg
active    stroke=bone 2px
```

---

## Empty, loading, error states

Every list/grid page ships all three. Prototype shows happy paths only.

- **Empty:** illustration (placeholder glyph) + one-line explanation + primary CTA
- **Loading:** skeletons at card shape, shimmer via `linear-gradient` keyframe
- **Error:** inline banner, retry button, "contact support" link

---

## Brand voice (copy)

Reference: `01-overview.md` tagline "Aerial footage, mapped."

- Editorial, outdoorsy, confident. Not startup-sassy. Not corporate.
- Use second-person ("you") for CTAs, third-person for creator/location descriptions.
- Coordinates, altitudes, and gear specs are proud — show them in mono font.
- Avoid exclamation marks. One per page, max.
