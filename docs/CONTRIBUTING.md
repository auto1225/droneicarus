# Contributing — Prototype

Short guide for anyone editing the prototype itself (not production).

---

## Running locally

```bash
# option A
npx serve .
# option B
python3 -m http.server 8000
```

Open `http://localhost:<port>/Drone Icarus.html`. Refresh after edits.

> ⚠️ Do NOT open `Drone Icarus.html` via `file://` — Babel in-browser can't fetch sibling JSX files cross-origin.

---

## File layout

```
Drone Icarus.html     ← entry; loads all scripts in order
styles.css            ← tokens + global styles
app.jsx               ← shell, routing
data.jsx              ← all mock data
components.jsx        ← shared UI
toast.jsx             ← global toast system
comments.jsx          ← video comments
pages/*.jsx           ← one file per route
docs/                 ← developer handoff (you are here)
```

### Script load order matters

Babel-in-browser has no module system. Later scripts reference earlier ones from `window`. Order in `Drone Icarus.html`:

```
1. data.jsx          → LOCATIONS, VIDEOS, CREATORS, …
2. components.jsx    → Header, VideoCard, Ic.*
3. toast.jsx         → window.toast
4. comments.jsx      → CommentThread
5. pages/*.jsx       → each page
6. app.jsx           → App + ReactDOM render
```

New shared components go in `components.jsx`, new data goes in `data.jsx`.

---

## Adding a page

1. Create `pages/yourpage.jsx`:
   ```jsx
   function YourPage({ onNav, onOpenVideo }) {
     return <div style={{ padding: 28 }}>Hello</div>;
   }
   Object.assign(window, { YourPage });
   ```
2. Add `<script>` in `Drone Icarus.html`:
   ```html
   <script type="text/babel" src="pages/yourpage.jsx?v=1"></script>
   ```
3. Register in `app.jsx`:
   ```jsx
   {route === 'yourpage' && <YourPage onNav={onNav} />}
   ```
4. Link it from anywhere:
   ```jsx
   <button onClick={() => onNav('yourpage')}>…</button>
   ```
5. Deep link works automatically at `#yourpage`.

---

## Cache busting

After editing a file, **bump its `?v=` query param** in `Drone Icarus.html`. Otherwise browsers serve the old version.

Convention: bump all `?v=` numbers together when doing a big refactor.

---

## Style conventions

- Prefer CSS tokens (`var(--sunset)`) over hex literals.
- Inline `style={{}}` is fine for one-offs; extract to `styles.css` if reused in 3+ places.
- No new global classes without updating `06-design-system.md`.
- No inline JS event attributes (`onClick="…"`); always use React props.

---

## Naming collisions

Babel compiles every `<script type="text/babel">` into the **global scope**. If two files both declare `const styles = {…}`, the second wins silently.

**Rule:** prefix globals with the component or page name.
```jsx
const playerStyles = { … };       // good
const videoCardStyles = { … };    // good
const styles = { … };             // BAD, will collide
```

---

## Data

`data.jsx` is the single source of mock truth. To add:

- New landmark → push to `LOCATIONS` with lat/lon + category + video count
- New video → `VIDEOS.push(makeVideo(id, locationId, category, opts))`
- New creator → `CREATORS`
- New category → `CATEGORIES` + add entry to `CAT_ICONS`

Don't hardcode data inside pages — everyone loses when we need to add a seed video.

---

## Tweaks panel

The floating bottom-right panel lets a reviewer change:
- Theme (light / dark)
- Accent color
- Card density
- Typography pair
- Language
- Hero autoplay

Persisted via `postMessage` to the host; stable across reload.

To add a new tweak:
1. Add key + default to `TWEAK_DEFAULTS` in `app.jsx`
2. Consume `tweaks.yourKey` where it matters
3. Add a `<TweakGroup>` in the `<TweaksPanel>` render

---

## Shipping a change

For the prototype, there's no deploy. Edits are live on refresh. For stakeholder review:

1. Make change
2. Bump `?v=` param
3. Refresh + sanity check
4. Share the URL (or screenshot)

---

## If something breaks

- **Blank page:** open DevTools console. Most likely a Babel syntax error in a JSX file; line number points to it.
- **Stale code:** hard refresh (Cmd+Shift+R). If that fails, bump `?v=`.
- **Tweaks don't save:** host expects `postMessage` with `type: '__edit_mode_set_keys'`; check `app.jsx` `updateTweak`.
- **Map blank:** Leaflet CSS/JS URLs in `<head>` — make sure both load. Check network tab.
