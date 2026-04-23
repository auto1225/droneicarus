// src/pages/gear.jsx — Drone product catalog
// Layout: left 220px category sidebar · main grid · right 280px ad sidebar
import React, { useState, useEffect, useMemo } from 'react';
import { fetchDroneProducts, fetchDroneProduct, fetchGearAds } from '../db/gear';
import { Ic } from '../components';

const CATEGORIES = [
  { id: 'all',            label: 'All Drones',    icon: 'drone' },
  { id: 'consumer',       label: 'Consumer',      icon: 'drone' },
  { id: 'photography',    label: 'Photography',   icon: 'eye' },
  { id: 'fpv-racing',     label: 'FPV Racing',    icon: 'action' },
  { id: 'fpv-freestyle',  label: 'FPV Freestyle', icon: 'fire' },
  { id: 'cinewhoop',      label: 'Cinewhoop',     icon: 'play' },
  { id: 'long-range',     label: 'Long Range',    icon: 'sky' },
  { id: 'enterprise',     label: 'Enterprise',    icon: 'industry' },
  { id: 'agricultural',   label: 'Agricultural',  icon: 'agriculture' },
  { id: 'delivery',       label: 'Delivery',      icon: 'upload' },
  { id: 'military',       label: 'Military',      icon: 'warfare' },
  { id: 'public-safety',  label: 'Public Safety', icon: 'shield' },
  { id: 'vtol',           label: 'VTOL / Wing',   icon: 'print3d' },
];

export function GearPage({ onNav }) {
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDroneProducts({ category: category === 'all' ? undefined : category })
      .then(r => { setProducts(r || []); setLoading(false); });
    fetchGearAds().then(r => setAds(r || []));
  }, [category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = products;
    if (q) rows = rows.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.manufacturer.toLowerCase().includes(q) ||
      (p.tags || []).some(t => String(t).toLowerCase().includes(q))
    );
    if (sort === 'price-low') rows = [...rows].sort((a, b) => (a.price_usd_min || 0) - (b.price_usd_min || 0));
    else if (sort === 'price-high') rows = [...rows].sort((a, b) => (b.price_usd_max || 0) - (a.price_usd_max || 0));
    else if (sort === 'newest') rows = [...rows].sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    return rows;
  }, [products, query, sort]);

  // Per-category counts (from unfiltered)
  const allRowsByCat = useMemo(() => {
    const m = {};
    products.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [products]);

  return (
    <div className="gear-layout">
      {/* LEFT SIDEBAR — categories */}
      <aside className="gear-sidebar">
        <div className="mono gear-label">CATEGORIES</div>
        <nav>
          {CATEGORIES.map(c => {
            const active = category === c.id;
            const count = c.id === 'all' ? products.length : (allRowsByCat[c.id] || 0);
            return (
              <button key={c.id} className={`gear-cat ${active ? 'active' : ''}`} onClick={() => setCategory(c.id)}>
                <span className="icon">{Ic[c.icon] ? Ic[c.icon]() : null}</span>
                <span className="label">{c.label}</span>
                <span className="count">{count}</span>
              </button>
            );
          })}
        </nav>
        <div className="mono gear-label" style={{ marginTop: 28 }}>MANUFACTURERS</div>
        <div className="gear-manu">
          {Array.from(new Set(products.map(p => p.manufacturer))).slice(0, 20).map(m => (
            <button key={m} className="gear-manu-btn" onClick={() => setQuery(m)}>{m}</button>
          ))}
        </div>
      </aside>

      {/* CENTER — product grid */}
      <main className="gear-main">
        <div className="gear-header">
          <div>
            <div className="eyebrow">DRONES CATALOG</div>
            <h1>Drones for every mission</h1>
            <p className="gear-sub">
              Browse drones from 30+ manufacturers — consumer camera drones, FPV racers,
              enterprise platforms, military-grade UAVs, and everything in between.
            </p>
          </div>
        </div>

        <div className="gear-toolbar">
          <input
            className="gear-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search drones, brands, specs…"
          />
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
            <div>No drones match these filters yet.</div>
            <div style={{ fontSize: 14, color: 'var(--parchment-dim)', marginTop: 4 }}>
              Try a different category or clear the search.
            </div>
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
            <a href="mailto:sales@droneicarus.com?subject=Gear%20sidebar%20ad%20inquiry"
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
            From $199/month per placement. Monthly and annual packages available.
            <a href="mailto:sales@droneicarus.com" style={{ color: 'var(--amber)', display: 'block', marginTop: 8 }}>
              sales@droneicarus.com
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DroneCard({ product, onOpen }) {
  const priceLabel = product.price_usd_min
    ? (product.price_usd_max && product.price_usd_max !== product.price_usd_min
        ? `$${product.price_usd_min.toLocaleString()} – $${product.price_usd_max.toLocaleString()}`
        : `$${product.price_usd_min.toLocaleString()}`)
    : '—';
  return (
    <article className="drone-card" onClick={onOpen} role="button" tabIndex={0}
             onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}>
      <div className="drone-card-img"
           style={{ backgroundImage: product.image_url ? `url('${product.image_url}')` : 'linear-gradient(135deg, var(--forest-800), var(--forest-900))' }}>
        {product.featured && <span className="drone-card-featured">FEATURED</span>}
      </div>
      <div className="drone-card-body">
        <div className="drone-card-manu">{product.manufacturer}</div>
        <div className="drone-card-name">{product.name}</div>
        <div className="drone-card-meta">
          <span>{(product.specs?.weight_g || '—')}{product.specs?.weight_g ? 'g' : ''}</span>
          <span>·</span>
          <span>{product.specs?.flight_time_min ? `${product.specs.flight_time_min}min` : '—'}</span>
          <span>·</span>
          <span>{product.specs?.max_range_km ? `${product.specs.max_range_km}km` : '—'}</span>
        </div>
        <div className="drone-card-price">{priceLabel}</div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail page
// ─────────────────────────────────────────────────────────────
export function GearItemPage({ slug, onNav }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchDroneProduct(slug).then(p => {
      setProduct(p); setLoading(false);
      if (p) fetchDroneProducts({ category: p.category }).then(rs => {
        setRelated((rs || []).filter(r => r.id !== p.id).slice(0, 6));
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

  return (
    <div className="gear-detail">
      <div className="gear-detail-back">
        <button onClick={() => onNav('gear')} className="btn secondary">← All drones</button>
      </div>

      <div className="gear-detail-hero"
           style={{ backgroundImage: product.image_url ? `url('${product.image_url}')` : undefined }}>
      </div>

      <div className="gear-detail-grid">
        <div className="gear-detail-main">
          <div className="eyebrow">{product.manufacturer} · {product.category.toUpperCase()}</div>
          <h1>{product.name}</h1>
          {product.release_year && (
            <div className="gear-detail-release">
              Released {product.release_year}{product.country_of_origin ? ` · Made in ${product.country_of_origin}` : ''}
            </div>
          )}

          {product.description && <p className="gear-detail-desc">{product.description}</p>}

          {product.highlights && product.highlights.length > 0 && (
            <>
              <h3>Highlights</h3>
              <ul className="gear-highlights">
                {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </>
          )}

          <h3>Full specifications</h3>
          <table className="gear-spec-table">
            <tbody>
              {specRow('Weight', specs.weight_g, 'g')}
              {specRow('Max flight time', specs.flight_time_min, ' min')}
              {specRow('Max speed', specs.max_speed_kmh, ' km/h')}
              {specRow('Max range', specs.max_range_km, ' km')}
              {specRow('Max altitude', specs.max_altitude_m, ' m')}
              {specRow('Transmission', specs.transmission)}
              {specRow('Wheelbase', specs.wheelbase_mm, ' mm')}
              {specRow('Wingspan', specs.wingspan_mm, ' mm')}
              {specRow('Video resolution', specs.video_resolution)}
              {specRow('Camera sensor', specs.camera_sensor)}
              {specRow('Gimbal', specs.gimbal)}
              {specRow('Obstacle sensing', specs.obstacle_sensing)}
              {specRow('Payload', specs.payload_kg, ' kg')}
            </tbody>
          </table>

          {product.features && product.features.length > 0 && (
            <>
              <h3>Features</h3>
              <ul className="gear-highlights">
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
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
          {product.purchase_links && product.purchase_links.length > 0 && (
            <>
              <div className="mono gear-label" style={{ marginTop: 22 }}>BUY FROM</div>
              {product.purchase_links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="gear-buy-link">
                  <span>{link.store}</span>
                  <span className="gear-buy-price">{link.price_usd ? `$${link.price_usd.toLocaleString()}` : 'Visit →'}</span>
                </a>
              ))}
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
