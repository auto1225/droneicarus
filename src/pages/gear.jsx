// src/pages/gear.jsx — Drone product catalog with multi-axis faceted filters
import React, { useState, useEffect, useMemo } from 'react';
import { fetchDroneProducts, fetchDroneProduct, fetchGearAds, fetchDroneComments, postDroneComment } from '../db/gear';
import { Ic } from '../components';

// ─────────────────────────────────────────────────────────────
// Classification axes
// ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',            label: 'All Drones' },
  { id: 'consumer',       label: 'Consumer' },
  { id: 'photography',    label: 'Photography' },
  { id: 'fpv-racing',     label: 'FPV Racing' },
  { id: 'fpv-freestyle',  label: 'FPV Freestyle' },
  { id: 'cinewhoop',      label: 'Cinewhoop' },
  { id: 'long-range',     label: 'Long Range' },
  { id: 'enterprise',     label: 'Enterprise' },
  { id: 'agricultural',   label: 'Agricultural' },
  { id: 'delivery',       label: 'Delivery' },
  { id: 'military',       label: 'Military' },
  { id: 'public-safety',  label: 'Public Safety' },
  { id: 'vtol',           label: 'VTOL / Wing' },
];

const PRICE_BUCKETS = [
  { id: 'under-500',    label: 'Under $500',       min: 0,       max: 500 },
  { id: '500-1500',     label: '$500 – $1,500',    min: 500,     max: 1500 },
  { id: '1500-5000',    label: '$1,500 – $5,000',  min: 1500,    max: 5000 },
  { id: '5000-20000',   label: '$5,000 – $20,000', min: 5000,    max: 20000 },
  { id: 'enterprise',   label: '$20,000 – $100,000', min: 20000, max: 100000 },
  { id: 'defense',      label: '$100,000+',        min: 100000,  max: Infinity },
];

const YEAR_BUCKETS = [
  { id: '2024plus',  label: '2024 and newer', min: 2024 },
  { id: '2022-2023', label: '2022–2023',      min: 2022, max: 2023 },
  { id: '2020-2021', label: '2020–2021',      min: 2020, max: 2021 },
  { id: 'pre-2020',  label: 'Before 2020',    max: 2019 },
];

// Feature detectors — derive from specs/tags/description
const FEATURES = [
  { id: '4k',             label: '4K video', match: p => /4k/i.test(p.specs?.video_resolution || '') },
  { id: '8k',             label: '8K video', match: p => /8k/i.test(p.specs?.video_resolution || '') },
  { id: 'thermal',        label: 'Thermal imaging',  match: p => /thermal|flir|boson/i.test((p.specs?.camera_sensor || '') + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' ')) },
  { id: 'obstacle',       label: 'Obstacle sensing', match: p => !!p.specs?.obstacle_sensing && p.specs.obstacle_sensing !== 'None' },
  { id: 'sub250g',        label: 'Sub-250g',         match: p => (p.specs?.weight_g || 99999) <= 250 },
  { id: 'rtk',            label: 'RTK positioning',  match: p => /rtk/i.test((p.name + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' '))) },
  { id: 'hd-digital',     label: 'HD digital FPV',   match: p => /dji.*o3|walksnail|hdzero|digital/i.test((p.description || '') + ' ' + (p.tags || []).join(' ')) },
  { id: 'ndaa',           label: 'NDAA / Blue sUAS', match: p => /ndaa|blue sUAS|blue-suas|blue_suas/i.test((p.description || '') + ' ' + (p.tags || []).join(' ')) },
  { id: 'vtol',           label: 'VTOL',             match: p => p.category === 'vtol' || /vtol/i.test((p.description || '') + ' ' + (p.subcategory || '')) },
  { id: 'loitering',      label: 'Loitering munition', match: p => /loitering/i.test((p.subcategory || '') + ' ' + (p.description || '')) },
  { id: 'long-range20k+', label: 'Long range (20km+)', match: p => (p.specs?.max_range_km || 0) >= 20 },
  { id: 'autonomous',     label: 'Autonomous AI',    match: p => /autonomous|lattice|hivemind|skydio/i.test((p.description || '') + ' ' + (p.tags || []).join(' ')) },
];

function priceBucketOf(p) {
  const min = p.price_usd_min || 0;
  return PRICE_BUCKETS.find(b => min >= b.min && min < b.max)?.id || null;
}
function yearBucketOf(p) {
  const y = p.release_year || 0;
  return YEAR_BUCKETS.find(b => (b.min === undefined || y >= b.min) && (b.max === undefined || y <= b.max))?.id || null;
}

// Derive an airframe type from subcategory + tags
function airframeTypeOf(p) {
  const sub = (p.subcategory || '').toLowerCase();
  const tags = (p.tags || []).join(' ').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const haystack = sub + ' ' + tags + ' ' + desc;
  if (/hexa|matrice 350|yuneec h/i.test(haystack)) return 'hexacopter';
  if (/fixed.?wing|wingtra|trinity|puma|global.?hawk|reaper|shahed|harop/i.test(haystack)) return 'fixed-wing';
  if (/vtol|wingtraone|trinity|wingcopter/i.test(haystack)) return 'vtol';
  if (/loitering|kamikaze|switchblade|phoenix.ghost|ghost-x|lancet|harop|shahed/i.test(haystack)) return 'loitering-munition';
  if (/hand.launch|puma|raven/i.test(haystack)) return 'hand-launched';
  return 'quadcopter';
}

const AIRFRAME_TYPES = [
  { id: 'quadcopter', label: 'Quadcopter' },
  { id: 'hexacopter', label: 'Hexacopter' },
  { id: 'fixed-wing', label: 'Fixed-wing' },
  { id: 'vtol', label: 'VTOL / Hybrid' },
  { id: 'loitering-munition', label: 'Loitering munition' },
  { id: 'hand-launched', label: 'Hand-launched' },
];

// ─────────────────────────────────────────────────────────────
// Generate branded SVG fallback for missing/broken images
// ─────────────────────────────────────────────────────────────
function svgPlaceholder(p) {
  const name = (p.name || '').slice(0, 40);
  const manu = (p.manufacturer || '').slice(0, 30);
  const colorSeed = (p.slug || name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = colorSeed % 360;
  const bg1 = `hsl(${hue},35%,15%)`;
  const bg2 = `hsl(${(hue + 40) % 360},35%,22%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
    <defs><linearGradient id="g" x1="0" y1="0" x2="640" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/>
    </linearGradient></defs>
    <rect width="640" height="480" fill="url(#g)"/>
    <text x="40" y="80" font-family="monospace" font-size="14" letter-spacing="3" fill="#d97045">${manu.toUpperCase()}</text>
    <text x="40" y="220" font-family="Georgia,serif" font-size="40" font-weight="700" fill="#faf6ec">${name}</text>
    <g transform="translate(40,300)" stroke="#d97045" stroke-width="2" fill="none">
      <circle cx="20" cy="20" r="14"/><circle cx="80" cy="20" r="14"/>
      <circle cx="20" cy="80" r="14"/><circle cx="80" cy="80" r="14"/>
      <path d="M34 34L66 66M66 34L34 66" stroke-width="1.5"/>
      <rect x="40" y="40" width="20" height="20" rx="2"/>
    </g>
    <text x="40" y="430" font-family="monospace" font-size="11" letter-spacing="2" fill="#9ba39c">DRONEICARUS · GEAR</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ─────────────────────────────────────────────────────────────
// Drone card (with fallback image on error)
// ─────────────────────────────────────────────────────────────
function DroneCard({ product, onOpen }) {
  const [imgError, setImgError] = useState(false);
  const priceLabel = product.price_usd_min
    ? (product.price_usd_max && product.price_usd_max !== product.price_usd_min
        ? `$${product.price_usd_min.toLocaleString()} – $${product.price_usd_max.toLocaleString()}`
        : `$${product.price_usd_min.toLocaleString()}`)
    : 'Contact';
  const imgSrc = (imgError || !product.image_url) ? svgPlaceholder(product) : product.image_url;
  return (
    <article className="drone-card" onClick={onOpen} role="button" tabIndex={0}
             onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}>
      <div className="drone-card-img-wrap">
        <img src={imgSrc} alt={product.name} onError={() => setImgError(true)} referrerPolicy="no-referrer"/>
        {product.featured && <span className="drone-card-featured">FEATURED</span>}
      </div>
      <div className="drone-card-body">
        <div className="drone-card-manu">{product.manufacturer}</div>
        <div className="drone-card-name">{product.name}</div>
        <div className="drone-card-meta">
          {product.specs?.weight_g && <span>{product.specs.weight_g.toLocaleString()}g</span>}
          {product.specs?.flight_time_min && <span>· {product.specs.flight_time_min}min</span>}
          {product.specs?.max_range_km && <span>· {product.specs.max_range_km}km</span>}
        </div>
        <div className="drone-card-price">{priceLabel}</div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Gear page — main catalog with multi-axis filters
// ─────────────────────────────────────────────────────────────
export function GearPage({ onNav }) {
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  // Filter state
  const [category, setCategory] = useState('all');
  const [manufacturers, setManufacturers] = useState(new Set());
  const [airframeTypes, setAirframeTypes] = useState(new Set());
  const [priceBuckets, setPriceBuckets] = useState(new Set());
  const [yearBuckets, setYearBuckets] = useState(new Set());
  const [features, setFeatures] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    fetchDroneProducts()
      .then(r => { setProducts(r || []); setLoading(false); });
    fetchGearAds().then(r => setAds(r || []));
  }, []);

  // Toggle helper for Sets
  const toggle = (set, setter) => (id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  // Per-axis counts (shown next to each option). Computed on current products,
  // so each count tells you "how many match if I add this filter to what I have."
  // Simpler: show total count per option (unfiltered) for predictability.
  const counts = useMemo(() => {
    const cat = {}, manu = {}, type = {}, price = {}, year = {}, feat = {};
    products.forEach(p => {
      cat[p.category] = (cat[p.category] || 0) + 1;
      manu[p.manufacturer] = (manu[p.manufacturer] || 0) + 1;
      const t = airframeTypeOf(p); type[t] = (type[t] || 0) + 1;
      const pb = priceBucketOf(p); if (pb) price[pb] = (price[pb] || 0) + 1;
      const yb = yearBucketOf(p); if (yb) year[yb] = (year[yb] || 0) + 1;
      FEATURES.forEach(f => { if (f.match(p)) feat[f.id] = (feat[f.id] || 0) + 1; });
    });
    return { cat, manu, type, price, year, feat };
  }, [products]);

  // Apply filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = products.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (manufacturers.size && !manufacturers.has(p.manufacturer)) return false;
      if (airframeTypes.size && !airframeTypes.has(airframeTypeOf(p))) return false;
      if (priceBuckets.size && !priceBuckets.has(priceBucketOf(p))) return false;
      if (yearBuckets.size && !yearBuckets.has(yearBucketOf(p))) return false;
      if (features.size) {
        for (const fid of features) {
          const f = FEATURES.find(x => x.id === fid);
          if (f && !f.match(p)) return false;
        }
      }
      if (q) {
        const hay = (p.name + ' ' + p.manufacturer + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === 'price-low')  rows = [...rows].sort((a, b) => (a.price_usd_min || 0) - (b.price_usd_min || 0));
    else if (sort === 'price-high') rows = [...rows].sort((a, b) => (b.price_usd_max || 0) - (a.price_usd_max || 0));
    else if (sort === 'newest') rows = [...rows].sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    else rows = [...rows].sort((a, b) => (b.featured === a.featured ? a.name.localeCompare(b.name) : (b.featured ? 1 : -1)));
    return rows;
  }, [products, category, manufacturers, airframeTypes, priceBuckets, yearBuckets, features, query, sort]);

  const hasActiveFilters = category !== 'all' || manufacturers.size || airframeTypes.size || priceBuckets.size || yearBuckets.size || features.size || query;
  const clearAll = () => {
    setCategory('all'); setManufacturers(new Set()); setAirframeTypes(new Set());
    setPriceBuckets(new Set()); setYearBuckets(new Set()); setFeatures(new Set()); setQuery('');
  };

  const manuList = useMemo(() => Object.entries(counts.manu).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ id: k, label: k, count: v })), [counts.manu]);

  return (
    <div className="gear-layout">
      {/* LEFT SIDEBAR — multi-axis filters */}
      <aside className="gear-sidebar">

        <FilterGroup label="CATEGORIES">
          {CATEGORIES.map(c => {
            const n = c.id === 'all' ? products.length : (counts.cat[c.id] || 0);
            return (
              <button key={c.id} className={`gear-cat ${category === c.id ? 'active' : ''}`}
                      onClick={() => setCategory(c.id)}>
                <span className="label">{c.label}</span>
                <span className="count">{n}</span>
              </button>
            );
          })}
        </FilterGroup>

        <FilterGroup label={`MANUFACTURERS (${manuList.length})`}>
          {manuList.map(m => (
            <CheckboxRow key={m.id} label={m.label} count={m.count}
                         checked={manufacturers.has(m.id)} onChange={() => toggle(manufacturers, setManufacturers)(m.id)} />
          ))}
        </FilterGroup>

        <FilterGroup label="AIRFRAME TYPE">
          {AIRFRAME_TYPES.map(t => (
            <CheckboxRow key={t.id} label={t.label} count={counts.type[t.id] || 0}
                         checked={airframeTypes.has(t.id)} onChange={() => toggle(airframeTypes, setAirframeTypes)(t.id)} />
          ))}
        </FilterGroup>

        <FilterGroup label="FEATURES">
          {FEATURES.map(f => (
            <CheckboxRow key={f.id} label={f.label} count={counts.feat[f.id] || 0}
                         checked={features.has(f.id)} onChange={() => toggle(features, setFeatures)(f.id)} />
          ))}
        </FilterGroup>

        <FilterGroup label="PRICE">
          {PRICE_BUCKETS.map(b => (
            <CheckboxRow key={b.id} label={b.label} count={counts.price[b.id] || 0}
                         checked={priceBuckets.has(b.id)} onChange={() => toggle(priceBuckets, setPriceBuckets)(b.id)} />
          ))}
        </FilterGroup>

        <FilterGroup label="RELEASE YEAR">
          {YEAR_BUCKETS.map(b => (
            <CheckboxRow key={b.id} label={b.label} count={counts.year[b.id] || 0}
                         checked={yearBuckets.has(b.id)} onChange={() => toggle(yearBuckets, setYearBuckets)(b.id)} />
          ))}
        </FilterGroup>

        {hasActiveFilters && (
          <button className="gear-clear-all" onClick={clearAll}>Clear all filters</button>
        )}
      </aside>

      {/* MAIN GRID */}
      <main className="gear-main">
        <div className="gear-header">
          <div className="eyebrow">DRONES CATALOG</div>
          <h1>Drones for every mission</h1>
          <p className="gear-sub">
            {products.length} drones from {manuList.length} manufacturers — consumer,
            cinema, FPV, enterprise, agricultural, and defense systems.
            Filter by category, manufacturer, type, feature, price, or year.
          </p>
        </div>

        <div className="gear-toolbar">
          <input className="gear-search" value={query}
                 onChange={e => setQuery(e.target.value)}
                 placeholder="Search drones, manufacturers, specs…"/>
          <select className="gear-sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest first</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
          <span className="gear-count">{filtered.length} drones</span>
        </div>

        {loading ? (
          <div className="gear-loading">Loading catalog…</div>
        ) : filtered.length === 0 ? (
          <div className="gear-empty">
            <div>No drones match these filters.</div>
            {hasActiveFilters && (
              <button onClick={clearAll} className="btn secondary" style={{ marginTop: 16 }}>Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="gear-grid">
            {filtered.map(p => <DroneCard key={p.id} product={p} onOpen={() => onNav('gear-item', p.slug)} />)}
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR — ads */}
      <aside className="gear-ads">
        <div className="mono gear-label">SPONSORED</div>
        {ads.length === 0 && (
          <div className="gear-ads-empty">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber)', marginBottom: 6 }}>
              Advertise your drone here
            </div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.5, marginBottom: 12 }}>
              Reach pilots, cinematographers, and buyers actively researching drones.
              4 premium placements, CMS-managed rotation, direct click-out to your store.
            </div>
            <a href="mailto:sales@droneicarus.com?subject=Gear%20sidebar%20ad"
               className="gear-ad-cta">Contact sales →</a>
          </div>
        )}
        {ads.map(ad => (
          <a key={ad.id} href={ad.click_url} target="_blank" rel="noopener noreferrer" className="gear-ad-card">
            {ad.image_url && <div className="gear-ad-image" style={{ backgroundImage: `url('${ad.image_url}')` }}/>}
            <div className="gear-ad-body">
              {ad.brand && <div className="gear-ad-brand">{ad.brand}</div>}
              <div className="gear-ad-title">{ad.title}</div>
              {ad.cta_label && <div className="gear-ad-cta">{ad.cta_label} →</div>}
            </div>
          </a>
        ))}
        <div className="mono gear-label" style={{ marginTop: 24 }}>ADVERTISE WITH US</div>
        <div className="gear-ads-empty" style={{ marginTop: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.55 }}>
            From $199/month per placement.
            <a href="mailto:sales@droneicarus.com" style={{ color: 'var(--amber)', display: 'block', marginTop: 8 }}>
              sales@droneicarus.com
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Sidebar primitives
function FilterGroup({ label, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="gear-filter-group">
      <button className="gear-filter-h" onClick={() => setOpen(!open)}>
        <span>{label}</span><span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="gear-filter-body">{children}</div>}
    </section>
  );
}
function CheckboxRow({ label, count, checked, onChange }) {
  if (!count) return null;
  return (
    <label className={`gear-check ${checked ? 'on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange}/>
      <span className="gear-check-label">{label}</span>
      <span className="gear-check-count">{count}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// YouTube-style comments — full-width section below the product
// ───────────────────────────────────────────────────────
function YtAvatar({ name, size = 40 }) {
  const n = (name || '?').trim();
  const hash = [...n].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  const initial = (n.charAt(0) || '?').toUpperCase();
  return (
    <div className="yt-avatar" style={{
      width: size, height: size, fontSize: Math.round(size * 0.42),
      background: `linear-gradient(135deg, hsl(${hue},58%,48%), hsl(${(hue + 48) % 360},58%,36%))`,
    }}>{initial}</div>
  );
}

function fmtDateYT(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} ${h === 1 ? 'hour' : 'hours'} ago`; }
  if (diff < 86400 * 7) { const dd = Math.floor(diff / 86400); return `${dd} ${dd === 1 ? 'day' : 'days'} ago`; }
  if (diff < 86400 * 30) { const w = Math.floor(diff / (86400 * 7)); return `${w} ${w === 1 ? 'week' : 'weeks'} ago`; }
  if (diff < 86400 * 365) { const mo = Math.floor(diff / (86400 * 30)); return `${mo} ${mo === 1 ? 'month' : 'months'} ago`; }
  const yr = Math.floor(diff / (86400 * 365));
  return `${yr} ${yr === 1 ? 'year' : 'years'} ago`;
}

function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem('di_comment_name') || '');
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);
  const [sort, setSort] = useState('top');
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likes, setLikes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('di_comment_likes') || '{}'); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    fetchDroneComments(slug).then(rs => { setComments(rs || []); setLoading(false); });
    setBody(''); setFocused(false); setReplyTo(null); setReplyBody(''); setExpanded({});
  }, [slug]);

  const submit = async (parent_id, text, cb) => {
    if (!name.trim()) { alert('Please enter your name.'); return; }
    if (!text.trim()) return;
    setSubmitting(true);
    localStorage.setItem('di_comment_name', name.trim());
    const nc = await postDroneComment({ slug, parent_id, author_name: name, body: text });
    setSubmitting(false);
    if (nc) {
      setComments(prev => [...prev, nc]);
      if (parent_id) setExpanded(e => ({ ...e, [parent_id]: true }));
      cb?.();
    } else {
      alert('Could not post comment. Please try again.');
    }
  };

  const tree = useMemo(() => {
    const byId = new Map(comments.map(c => [c.id, { ...c, replies: [] }]));
    const roots = [];
    for (const c of byId.values()) {
      if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id).replies.push(c);
      else roots.push(c);
    }
    if (sort === 'newest') {
      roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      roots.sort((a, b) => (b.likes || 0) - (a.likes || 0) || new Date(b.created_at) - new Date(a.created_at));
    }
    for (const r of roots) r.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return roots;
  }, [comments, sort]);

  const vote = (id, dir) => {
    const cur = likes[id] || 0;
    const next = cur === dir ? 0 : dir;
    const nl = { ...likes, [id]: next };
    setLikes(nl);
    try { localStorage.setItem('di_comment_likes', JSON.stringify(nl)); } catch {}
  };

  const renderActions = (c, small = false) => {
    const v = likes[c.id] || 0;
    const disp = (c.likes || 0) + (v === 1 ? 1 : 0);
    const ic = small ? 15 : 17;
    return (
      <div className="yt-comment-actions">
        <button className={`yt-action yt-like ${v === 1 ? 'active' : ''}`}
                onClick={() => vote(c.id, 1)} title="Like">
          <svg viewBox="0 0 24 24" width={ic} height={ic} fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 11v9H3v-9h4zm3 9h8.5a2 2 0 0 0 2-1.7l1.2-7A2 2 0 0 0 19.7 9H14l.9-4.3a2 2 0 0 0-3.3-2L7 9v11h3z" strokeLinejoin="round"/>
          </svg>
          {disp > 0 ? <span>{disp}</span> : null}
        </button>
        <button className={`yt-action yt-dislike ${v === -1 ? 'active' : ''}`}
                onClick={() => vote(c.id, -1)} title="Dislike">
          <svg viewBox="0 0 24 24" width={ic} height={ic} fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 13V4h4v9h-4zm-3-9H5.5a2 2 0 0 0-2 1.7l-1.2 7a2 2 0 0 0 2 2.3H10l-.9 4.3a2 2 0 0 0 3.3 2L17 15V4h-3z" strokeLinejoin="round"/>
          </svg>
        </button>
        {!small && (
          <button className="yt-action yt-reply-btn"
                  onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(''); }}>
            Reply
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="yt-comments">
      <div className="yt-comments-head">
        <h3 className="yt-comments-count">{comments.length.toLocaleString()} Comments</h3>
        <div className="yt-sort">
          <button className={sort === 'top' ? 'yt-sort-btn active' : 'yt-sort-btn'}
                  onClick={() => setSort('top')}>Top comments</button>
          <button className={sort === 'newest' ? 'yt-sort-btn active' : 'yt-sort-btn'}
                  onClick={() => setSort('newest')}>Newest first</button>
        </div>
      </div>

      <div className="yt-input-row">
        <YtAvatar name={name || 'You'} size={40} />
        <div className="yt-input-body">
          {!focused ? (
            <div className="yt-input-placeholder" onClick={() => setFocused(true)}
                 tabIndex={0} onFocus={() => setFocused(true)}>
              Add a comment…
            </div>
          ) : (
            <>
              <input className="yt-name-input" type="text" value={name} placeholder="Your name"
                     maxLength={60} onChange={e => setName(e.target.value)} />
              <textarea className="yt-body-input" value={body} placeholder="Share your thoughts about this drone…"
                        maxLength={2000} rows={2} autoFocus
                        onChange={e => setBody(e.target.value)} />
              <div className="yt-input-actions">
                <span className="yt-char-count">{body.length}/2000</span>
                <div className="yt-input-btns">
                  <button className="yt-btn yt-btn-ghost"
                          onClick={() => { setBody(''); setFocused(false); }}>Cancel</button>
                  <button className="yt-btn yt-btn-primary"
                          disabled={submitting || !name.trim() || !body.trim()}
                          onClick={() => submit(null, body, () => { setBody(''); setFocused(false); })}>
                    {submitting ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="yt-loading">Loading comments…</div>
      ) : tree.length === 0 ? (
        <div className="yt-empty">
          <div className="yt-empty-title">No comments yet</div>
          <div className="yt-empty-sub">Be the first to share what you think about this drone.</div>
        </div>
      ) : (
        <div className="yt-list">
          {tree.map(c => {
            const exp = !!expanded[c.id];
            return (
              <div key={c.id} className="yt-comment">
                <YtAvatar name={c.author_name} size={40} />
                <div className="yt-comment-body">
                  <div className="yt-comment-head">
                    <span className="yt-comment-author">{c.author_name}</span>
                    <span className="yt-comment-date">{fmtDateYT(c.created_at)}</span>
                  </div>
                  <div className="yt-comment-text">{c.body}</div>
                  {renderActions(c)}

                  {replyTo === c.id && (
                    <div className="yt-reply-row">
                      <YtAvatar name={name || 'You'} size={32} />
                      <div className="yt-input-body">
                        <input className="yt-name-input" type="text" value={name} placeholder="Your name"
                               maxLength={60} onChange={e => setName(e.target.value)} />
                        <textarea className="yt-body-input" value={replyBody}
                                  placeholder={`Reply to ${c.author_name}…`}
                                  maxLength={2000} rows={2} autoFocus
                                  onChange={e => setReplyBody(e.target.value)} />
                        <div className="yt-input-actions">
                          <span className="yt-char-count">{replyBody.length}/2000</span>
                          <div className="yt-input-btns">
                            <button className="yt-btn yt-btn-ghost"
                                    onClick={() => { setReplyTo(null); setReplyBody(''); }}>Cancel</button>
                            <button className="yt-btn yt-btn-primary"
                                    disabled={submitting || !name.trim() || !replyBody.trim()}
                                    onClick={() => submit(c.id, replyBody, () => { setReplyBody(''); setReplyTo(null); })}>
                              {submitting ? 'Posting…' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {c.replies?.length > 0 && (
                    <>
                      <button className="yt-view-replies"
                              onClick={() => setExpanded(e => ({ ...e, [c.id]: !exp }))}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                             stroke="currentColor" strokeWidth="2"
                             style={{ transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {exp ? 'Hide' : 'View'} {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
                      </button>

                      {exp && (
                        <div className="yt-replies">
                          {c.replies.map(r => (
                            <div key={r.id} className="yt-comment yt-reply">
                              <YtAvatar name={r.author_name} size={32} />
                              <div className="yt-comment-body">
                                <div className="yt-comment-head">
                                  <span className="yt-comment-author">{r.author_name}</span>
                                  <span className="yt-comment-date">{fmtDateYT(r.created_at)}</span>
                                </div>
                                <div className="yt-comment-text">{r.body}</div>
                                {renderActions(r, true)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail page
// ─────────────────────────────────────────────────────────────
export function GearItemPage({ slug, onNav }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true); setImgError(false);
    fetchDroneProduct(slug).then(p => {
      setProduct(p); setLoading(false);
      if (p) fetchDroneProducts().then(rs => {
        setRelated((rs || []).filter(r => r.id !== p.id && r.category === p.category).slice(0, 6));
      });
    });
  }, [slug]);

  if (loading) return <div className="gear-loading">Loading drone…</div>;
  if (!product) return (
    <div className="gear-empty">
      <div>Drone not found.</div>
      <button onClick={() => onNav('gear')} className="btn secondary" style={{ marginTop: 16 }}>← Back to catalog</button>
    </div>
  );

  const specs = product.specs || {};
  const specRow = (k, v, unit = '') => v !== undefined && v !== null && v !== '' && (
    <tr><td className="spec-k">{k}</td><td className="spec-v">{v}{unit}</td></tr>
  );
  const priceLabel = product.price_usd_min
    ? (product.price_usd_max && product.price_usd_max !== product.price_usd_min
        ? `$${product.price_usd_min.toLocaleString()} – $${product.price_usd_max.toLocaleString()}`
        : `$${product.price_usd_min.toLocaleString()}`)
    : 'Contact for pricing';
  const heroImg = (imgError || !product.image_url) ? svgPlaceholder(product) : product.image_url;

  return (
    <div className="gear-detail">
      <div className="gear-detail-back">
        <button onClick={() => onNav('gear')} className="btn secondary">← All drones</button>
      </div>

      <div className="gear-detail-hero">
        <img src={heroImg} alt={product.name} onError={() => setImgError(true)} referrerPolicy="no-referrer"/>
      </div>

      <div className="gear-detail-grid">
        <div className="gear-detail-main">
          <div className="eyebrow">{product.manufacturer} · {product.category.toUpperCase()}{product.subcategory ? ` · ${product.subcategory.toUpperCase()}` : ''}</div>
          <h1>{product.name}</h1>
          {product.release_year && (
            <div className="gear-detail-release">
              Released {product.release_year}{product.country_of_origin ? ` · Made in ${product.country_of_origin}` : ''}
            </div>
          )}

          {product.description && <p className="gear-detail-desc">{product.description}</p>}

          {product.marketing_copy && (
            <div className="gear-marketing">
              {product.marketing_copy.split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          )}

          {product.gallery && product.gallery.length > 1 && (
            <>
              <h3>Gallery</h3>
              <div className="gear-gallery">
                {product.gallery.map((url, i) => (
                  <div key={i} className="gear-gallery-item">
                    <img src={url} alt={`${product.name} view ${i+1}`} referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </>
          )}

          {product.highlights && product.highlights.length > 0 && (
            <>
              <h3>Highlights</h3>
              <ul className="gear-highlights">
                {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </>
          )}

          <Comments slug={slug} />


          {product.feature_sections && product.feature_sections.length > 0 && (
            <>
              <h3>Key capabilities</h3>
              <div className="gear-feature-sections">
                {product.feature_sections.map((fs, i) => (
                  <div key={i} className="gear-feature-section">
                    <h4>{fs.title}</h4>
                    <p>{fs.body}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {product.use_cases && product.use_cases.length > 0 && (
            <>
              <h3>Best for</h3>
              <div className="gear-use-cases">
                {product.use_cases.map((uc, i) => (
                  <div key={i} className="gear-use-case">
                    <h4>{uc.scenario}</h4>
                    <p>{uc.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {product.reviews_summary && product.reviews_summary.rating && (
            <>
              <h3>Customer reviews</h3>
              <div className="gear-reviews">
                <div className="gear-reviews-header">
                  <div className="gear-reviews-rating">
                    <span className="gear-reviews-score">{product.reviews_summary.rating}</span>
                    <span className="gear-reviews-outof">/ 5</span>
                  </div>
                  <div className="gear-reviews-meta">
                    <div>{product.reviews_summary.count?.toLocaleString()} reviews on {product.reviews_summary.source}</div>
                    {product.reviews_summary.bought_past_month && <div>{product.reviews_summary.bought_past_month} bought in past month</div>}
                  </div>
                </div>
                <div className="gear-reviews-grid">
                  {product.reviews_summary.pros && (
                    <div className="gear-reviews-col">
                      <div className="gear-reviews-col-title">What buyers praise</div>
                      <ul>{product.reviews_summary.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    </div>
                  )}
                  {product.reviews_summary.cons && (
                    <div className="gear-reviews-col">
                      <div className="gear-reviews-col-title">Common complaints</div>
                      <ul>{product.reviews_summary.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {product.spec_groups && product.spec_groups.length > 0 ? (
            <>
              <h3>Full specifications</h3>
              <div className="gear-spec-groups">
                {product.spec_groups.map((grp, gi) => (
                  <div key={gi} className="gear-spec-group">
                    <div className="gear-spec-group-title">{grp.title}</div>
                    <table className="gear-spec-table">
                      <tbody>
                        {(grp.rows || []).map((row, ri) => (
                          <tr key={ri}>
                            <td className="spec-k">{row[0]}</td>
                            <td className="spec-v">{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>Full specifications</h3>
              <table className="gear-spec-table">
                <tbody>
                  {Object.entries(specs).map(([k, v]) => {
                    if (v === null || v === undefined || v === '') return null;
                    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <tr key={k}>
                        <td className="spec-k">{label}</td>
                        <td className="spec-v">{typeof v === 'number' ? v.toLocaleString() : v}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {product.included_in_box && product.included_in_box.length > 0 && (
            <>
              <h3>What's in the box</h3>
              <ul className="gear-box-list">
                {product.included_in_box.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </>
          )}

          {product.compatible_accessories && product.compatible_accessories.length > 0 && (
            <>
              <h3>Compatible accessories</h3>
              <div className="gear-accessories">
                {product.compatible_accessories.map((a, i) => (
                  <div key={i} className="gear-accessory">
                    <div className="gear-accessory-top">
                      <span className="gear-accessory-name">{a.name}</span>
                      {a.price_usd && <span className="gear-accessory-price">${a.price_usd.toLocaleString()}</span>}
                    </div>
                    {a.description && <div className="gear-accessory-desc">{a.description}</div>}
                    {a.category && <span className="gear-accessory-cat">{a.category}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {product.comparisons && product.comparisons.length > 0 && (
            <>
              <h3>How it compares</h3>
              <div className="gear-comparisons">
                {product.comparisons.map((c, i) => (
                  <div key={i} className="gear-comparison">
                    <div className="gear-comparison-title">
                      {product.name} <span className="gear-comparison-vs">vs</span> {c.vs_name}
                      {c.vs_slug && <button className="gear-comparison-link" onClick={() => onNav('gear-item', c.vs_slug)}>View →</button>}
                    </div>
                    <ul>
                      {(c.differences || []).map((d, di) => <li key={di}>{d}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}

          {product.faqs && product.faqs.length > 0 && (
            <>
              <h3>Frequently asked questions</h3>
              <div className="gear-faqs">
                {product.faqs.map((f, i) => (
                  <details key={i} className="gear-faq">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}

          {product.regulatory && Object.keys(product.regulatory).length > 0 && (
            <>
              <h3>Regulations by region</h3>
              <div className="gear-regulatory">
                {Object.entries(product.regulatory).map(([region, rules]) => (
                  <div key={region} className="gear-regulatory-region">
                    <div className="gear-regulatory-name">{region.replace(/_/g, ' ').toUpperCase()}</div>
                    <table className="gear-spec-table">
                      <tbody>
                        {Object.entries(rules).map(([k, v]) => (
                          <tr key={k}>
                            <td className="spec-k">{k.replace(/_/g, ' ')}</td>
                            <td className="spec-v">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
          )}

          {product.warranty_plans && product.warranty_plans.length > 0 && (
            <>
              <h3>Warranty & protection</h3>
              <div className="gear-warranty">
                {product.warranty_plans.map((w, i) => (
                  <div key={i} className="gear-warranty-plan">
                    <div className="gear-warranty-top">
                      <span className="gear-warranty-name">{w.name}</span>
                      <span className="gear-warranty-price">{w.price_usd === 0 ? 'Free' : w.price_usd ? `$${w.price_usd}` : ''}</span>
                    </div>
                    {w.duration && <div className="gear-warranty-duration">{w.duration}</div>}
                    {w.covers && <ul>{w.covers.map((c, ci) => <li key={ci}>{c}</li>)}</ul>}
                  </div>
                ))}
              </div>
            </>
          )}

          {product.videos && product.videos.length > 0 && (
            <>
              <h3>Videos</h3>
              <div className="gear-videos">
                {product.videos.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="gear-video-card">
                    {v.thumbnail && <img src={v.thumbnail} alt={v.title} />}
                    <div className="gear-video-title">{v.title}</div>
                  </a>
                ))}
              </div>
            </>
          )}

          {product.features && product.features.length > 0 && (
            <>
              <h3>All features</h3>
              <ul className="gear-features-list">
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </>
          )}

          {product.support_docs && product.support_docs.length > 0 && (
            <>
              <h3>Documentation &amp; support</h3>
              <ul className="gear-docs">
                {product.support_docs.map((d, i) => (
                  <li key={i}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer">{d.title}</a>
                    {d.type && <span className="gear-doc-type">{d.type.toUpperCase()}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {related.length > 0 && (
            <>
              <h3 style={{ marginTop: 32 }}>Related drones in {product.category}</h3>
              <div className="gear-grid">
                {related.map(p => <DroneCard key={p.id} product={p} onOpen={() => onNav('gear-item', p.slug)} />)}
              </div>
            </>
          )}
        </div>

        <aside className="gear-detail-buy">
          <div className="gear-detail-price">{priceLabel}</div>
          {product.official_url && (
            <a href={product.official_url} target="_blank" rel="noopener noreferrer" className="btn">
              Official product page →
            </a>
          )}

          {product.variants && product.variants.length > 0 && (
            <>
              <div className="mono gear-label" style={{ marginTop: 22 }}>PURCHASE OPTIONS</div>
              <div className="gear-variants">
                {product.variants.map((v, i) => (
                  <div key={i} className="gear-variant">
                    <div className="gear-variant-top">
                      <span className="gear-variant-name">{v.name}</span>
                      {v.price_usd && <span className="gear-variant-price">${v.price_usd.toLocaleString()}</span>}
                    </div>
                    {v.description && <div className="gear-variant-desc">{v.description}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {product.purchase_links && product.purchase_links.length > 0 && (
            <>
              <div className="mono gear-label" style={{ marginTop: 22 }}>BUY FROM</div>
              {product.purchase_links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="gear-buy-link">
                  <span>{link.name || link.store}</span>
                  <span className="gear-buy-price">{link.price_usd ? `$${link.price_usd.toLocaleString()}` : 'Visit →'}</span>
                </a>
              ))}
            </>
          )}

          {product.reviews_summary && product.reviews_summary.rating && (
            <>
              <div className="mono gear-label" style={{ marginTop: 22 }}>RATED</div>
              <div className="gear-sidebar-rating">
                <span className="gear-sidebar-score">{product.reviews_summary.rating}/5</span>
                <span className="gear-sidebar-reviews">· {product.reviews_summary.count?.toLocaleString()} reviews</span>
              </div>
            </>
          )}

          {product.tags && product.tags.length > 0 && (
            <>
              <div className="mono gear-label" style={{ marginTop: 22 }}>TAGS</div>
              <div className="gear-detail-tags">
                {product.tags.map(t => <span key={t} className="gear-tag">#{t}</span>)}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
