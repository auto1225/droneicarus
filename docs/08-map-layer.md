# 08 · Map Layer

The map is the product's hero. Ship it well or the whole thesis falls.

---

## Prototype vs. production

| Layer | Prototype | Production |
|---|---|---|
| Map lib | Leaflet 1.9.4 | Mapbox GL JS **or** MapLibre GL |
| Tiles | OpenStreetMap default | Mapbox Outdoors + custom style layers |
| Pins | Hand-placed `<Marker>` per landmark | Dynamic via `/pins?bbox=` endpoint |
| Clustering | None | Supercluster (client) or server-side |
| Geocoding | None | Mapbox Geocoding API + Nominatim fallback |

### Why Mapbox GL over Leaflet in prod?

- Vector tiles → crisp at any zoom, smaller payloads
- Custom style control (we want parchment/dark variants matching our theme)
- 3D terrain + sky layer — elevates the "aerial" feel dramatically
- Built-in clustering via `GeoJSON` source
- WebGL rendering handles 10k+ pins smoothly; Leaflet tops out around 1k

Trade-off: Mapbox costs money at scale (after 50k map loads/month). MapLibre is the free OSS fork if commercial limits bite.

---

## Data flow

```
1. Page load
      │
      ▼
   Fetch /pins?bbox=world&zoom=2   ← bootstrap globe view
      │
      ▼
   Render ~200 top-landmark pins, clustered
      │
      ▼
   User pans / zooms
      │
      ▼
   Debounced 300ms → /pins?bbox=newbbox&zoom=newzoom
      │
      ▼
   Server returns pins + clusters pre-computed from videos table
```

### Clustering strategy

- **z ≤ 4:** country-level pins, count = sum of videos in country
- **z 5–8:** admin1 region clusters
- **z 9–12:** city clusters
- **z 13+:** individual landmark pins
- **z 15+:** individual video GPS pins (show actual capture points)

Server aggregates via Postgres `ST_SnapToGrid` + `COUNT(*)`, cached in Redis per (bbox_quantized, zoom) key.

---

## Pin visual language

```
┌─ ruins    ⎯ amber fill
├─ mountain ⎯ moss fill
├─ ocean    ⎯ cobalt tint
├─ cityscape ⎯ sunset fill
└─ … (8 categories → 8 pin colors)

Featured landmarks: amber glow ring + larger size
Has videos uploaded this week: small orange dot indicator
Clusters: circle with count, size scaled 32–64px by count log
```

See `06-design-system.md` → "Map pin".

---

## Interactions

| Action | Behavior |
|---|---|
| Hover pin | Tooltip: landmark name, country, video count. No navigation. |
| Click pin | Open side drawer with 6 top videos + "View all 47 clips" CTA. Persist `?loc=<slug>` in URL. |
| Click cluster | Zoom in + re-cluster. |
| Pan / zoom | Update URL bbox (`?bbox=…&z=…`). Shareable. |
| Search box | Autocomplete. Select result → fly-to animation (1.2s) + open drawer. |
| Mobile | Tap pin = full-page takeover (drawer too cramped). |

---

## URL state

All map state lives in the URL:

```
/?z=5&lat=35.5&lon=140.2&loc=namsan
```

- `z, lat, lon` → viewport
- `loc` → active landmark slug (opens drawer)
- `category` → filter pins by category
- `layer=week|month|all` → time-range filter (only show landmarks with recent uploads)

Deep links → exact same view on reload. This is non-negotiable; it's how share works.

---

## Fly-to animation

On search result selection or deep-link load:

```ts
map.flyTo({
  center: [lon, lat],
  zoom: 13,
  duration: 1200,
  essential: true,  // respects prefers-reduced-motion when combined with a guard
});
```

Don't over-ease — users get nauseous. Keep duration ≤ 1.5s.

---

## 3D terrain (production upgrade)

Mapbox style with `mapbox-dem` source enables terrain. For landmarks like Everest, Grand Canyon, Kilimanjaro, the 3D relief is the experience. Toggle in map controls:

```
[ 2D ] [ 3D ] ← bottom-right corner of map
```

Default 3D on for mountain/landscape categories; 2D elsewhere.

---

## Accessibility alternative

Map is inaccessible to screen readers fundamentally. Provide a **list view toggle** top-right of the map:

```
🗺 Map  |  ☰ List
```

List view = same data, sorted by country → category, links to `/location/:slug` pages. Index page also links directly into this for crawlability.

---

## Geocoding (search)

```
User types: "eiffel"
   │
   ▼
GET /locations/search?q=eiffel
   │
   ▼
Backend:
  1. Postgres fuzzy search on locations.name, locations.alt_names (trigrams)
  2. If < 3 results → fan out to Mapbox Geocoding API
  3. Merge, dedupe, return top 10
   │
   ▼
Response:
  [
    { id: "loc_…", name: "Eiffel Tower", country: "FR", lat:…, lon:…, video_count: 38 },
    { ... Mapbox POI with video_count: 0 but nearby: 12 clips within 2km }
  ]
```

Show "near results" even if no exact match — most of the long tail of drone subject matter isn't a named landmark, and "clips within 2km" is often what the buyer really wants.

---

## Offline / no-JS fallback

Server-render a static list of top 50 landmarks with links to `/location/:slug`. Map itself won't work without JS; that's fine, but the site must.
