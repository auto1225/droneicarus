// pages/home.jsx — Map hero + location detail bottom sheet + video grids
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useContent } from '../content/ContentContext';
import { CATEGORIES, CAT_ICONS, LOCATIONS, VIDEOS, TRENDING, thumbGradient, STATS} from '../data';
import { Ic, CategoryChips, VideoCard } from '../components';
import { useSiteSetting } from '../db/useSettings';
const hUseState = useState;
const hUseEffect = useEffect;
const hUseRef = useRef;
const hUseMemo = useMemo;

// Escape HTML for safe injection into Leaflet popup/tooltip HTML strings
function hEsc(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function MapHero({ selectedLoc, onSelectLoc, categoryFilter, mapFilters }) {
  const mapRef = hUseRef(null);
  const mapInstance = hUseRef(null);
  const markersRef = hUseRef([]);

  hUseEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [25, 15],
      zoom: 3,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      worldCopyJump: true,
      attributionControl: true,
    });
    const dpr = devicePixelRatio || 1;
    const detectRetina = dpr > 1;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri · Maxar · Earthstar Geographics',
      maxZoom: 19, maxNativeZoom: 19, detectRetina, crossOrigin: true,
    }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19, detectRetina, opacity: 0.9, pane: 'shadowPane',
    }).addTo(map);
    mapInstance.current = map;
  }, []);

  // Compute filtered locations based on category + mapFilters
  const filteredLocs = hUseMemo(() => {
    let locs = categoryFilter === 'all'
      ? LOCATIONS
      : LOCATIONS.filter(l => l.category === categoryFilter);

    if (!mapFilters) return locs;

    return locs.filter(loc => {
      const vids = VIDEOS.filter(v => v.locationId === loc.id);
      if (mapFilters.free && !vids.some(v => v.price === 0)) return false;
      if (mapFilters.uhd && !vids.some(v => v.resolution && (v.resolution.includes('5K') || v.resolution.includes('8K') || v.resolution === '4K'))) return false;
      if (mapFilters.recent && !vids.some(v => (v.uploadedDaysAgo || 999) <= 30)) return false;
      if (mapFilters.featured && !loc.featured) return false;
      return true;
    });
  }, [categoryFilter, mapFilters]);

  hUseEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const L = window.L;

    // Cluster by lat/lon rounded to 15° at low zoom — grouping by geographic region
    // but show individual pins above zoom 4. For simplicity we render clusters + pins as two layers
    // and swap based on current zoom.

    const renderMarkers = () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
      const zoom = map.getZoom();
      const isSelected = (loc) => selectedLoc?.id === loc.id;

      if (zoom <= 3) {
        // CLUSTER MODE — group by rough lat/lon cell
        const clusters = new Map();
        filteredLocs.forEach(loc => {
          const cx = Math.floor(loc.lon / 20) * 20 + 10;
          const cy = Math.floor(loc.lat / 20) * 20 + 10;
          const key = `${cx}:${cy}`;
          if (!clusters.has(key)) clusters.set(key, { lat: cy, lon: cx, locs: [], videos: 0 });
          const c = clusters.get(key);
          c.locs.push(loc);
          c.videos += loc.videos;
          // average
          c.lat = c.locs.reduce((s,l)=>s+l.lat,0)/c.locs.length;
          c.lon = c.locs.reduce((s,l)=>s+l.lon,0)/c.locs.length;
        });

        clusters.forEach(c => {
          if (c.locs.length === 1) {
            addPin(c.locs[0], isSelected(c.locs[0]));
          } else {
            const size = Math.min(72, 36 + Math.log2(c.videos) * 5);
            const html = `<div class="cluster-pin" style="width:${size}px;height:${size}px;">
              <span class="cluster-ring"></span>
              <span class="cluster-num">${c.locs.length}</span>
              <span class="cluster-vids">${c.videos} clips</span>
            </div>`;
            const icon = L.divIcon({ className: 'cluster-pin-wrap', html, iconSize: [size, size], iconAnchor: [size/2, size/2] });
            const marker = L.marker([c.lat, c.lon], { icon, zIndexOffset: 500 }).addTo(map);
            marker.on('click', () => {
              const bounds = L.latLngBounds(c.locs.map(l => [l.lat, l.lon]));
              map.flyToBounds(bounds.pad(0.4), { duration: 1.1, maxZoom: 6 });
            });
            markersRef.current.push(marker);
          }
        });
      } else {
        filteredLocs.forEach(loc => addPin(loc, isSelected(loc)));
      }
    };

    const addPin = (loc, selected) => {
      const isFeatured = loc.featured;
      const vids = VIDEOS.filter(v => v.locationId === loc.id).slice(0, 3);
      const firstVid = vids[0];

      const html = `<div class="pin-outer ${selected ? 'selected' : ''}">
        <div class="pin-ring"></div>
        <div class="pin-core"></div>
        <div class="pin-count">${loc.videos}</div>
      </div>`;
      const icon = L.divIcon({
        className: 'drone-pin' + (isFeatured ? ' featured' : '') + (selected ? ' is-selected' : ''),
        html, iconSize: [44, 44], iconAnchor: [22, 44],
      });
      const marker = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: selected ? 2000 : (isFeatured ? 600 : 100) }).addTo(map);

      // Hover tooltip — lightweight, with thumbnail strip
      const tipHtml = `
        <div class="pin-tip">
          <div class="pin-tip-thumbs">
            ${vids.map((v,i) => `<div class="pin-tip-thumb" style="background:${hEsc(thumbGradient(parseInt(v.id.slice(1))))};">
              ${i === 0 ? `<span class="pin-tip-play"></span>` : ''}
              ${v.price > 0 ? `<span class="pin-tip-paid">$${v.price}</span>` : ''}
            </div>`).join('') || '<div class="pin-tip-thumb empty"></div>'}
          </div>
          <div class="pin-tip-body">
            <div class="pin-tip-country">${hEsc(loc.country)}</div>
            <div class="pin-tip-name">${hEsc(loc.name)}</div>
            <div class="pin-tip-meta">${loc.videos} clips · ${vids.filter(v=>v.price===0).length}+ free</div>
          </div>
        </div>
      `;
      marker.bindTooltip(tipHtml, {
        direction: 'top', offset: [0, -40], opacity: 1,
        className: 'pin-tooltip', sticky: false,
      });

      marker.on('click', () => {
        onSelectLoc(loc);
        map.flyTo([loc.lat, loc.lon], Math.max(map.getZoom(), 9), { duration: 1.2 });
      });
      markersRef.current.push(marker);
    };

    renderMarkers();
    map.off('zoomend', renderMarkers);
    map.on('zoomend', renderMarkers);
    return () => { map.off('zoomend', renderMarkers); };
  }, [categoryFilter, mapFilters, filteredLocs, onSelectLoc, selectedLoc]);

  // When selectedLoc changes via other UI, pan map
  hUseEffect(() => {
    if (!selectedLoc) return;
    if (mapInstance.current) {
      mapInstance.current.flyTo([selectedLoc.lat, selectedLoc.lon], 16, { duration: 1.2 });
    }
  }, [selectedLoc]);

  const randomLand = () => {
    const map = mapInstance.current;
    if (!map) return;
    const pool = filteredLocs.length ? filteredLocs : LOCATIONS;
    const target = pool[Math.floor(Math.random() * pool.length)];
    map.flyTo([target.lat, target.lon], 10, { duration: 1.8 });
    setTimeout(() => onSelectLoc(target), 1600);
  };

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 62px)', minHeight: 560 }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
      {/* Top-left: title overlay */}
      <div style={{
        position: 'absolute', top: 28, left: 28, zIndex: 400,
        maxWidth: 540, pointerEvents: 'none',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(14px)',
        border: '1px solid var(--line-strong)',
        borderRadius: 6,
        padding: '22px 26px 24px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--sunset)' }}>● Live · {filteredLocs.length} of {LOCATIONS.length} landmarks shown</div>
        <h1 style={{ fontSize: 56, lineHeight: 1.02, marginBottom: 14 }}>
          {useContent('home.hero.title', 'The world, from 1,200 feet up.')}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--parchment)', maxWidth: 440 }}>
          {useContent('home.hero.sub', 'Pan the map. Click any pin to find aerial footage shot by pilots on the ground — from the Giza Plateau to Namsan Tower.')}
        </p>
      </div>

      {/* Random landing button — bottom left */}
      <button onClick={randomLand} className="map-random" style={{
        position: 'absolute', bottom: 28, left: 28, zIndex: 400,
        padding: '12px 18px',
        background: 'var(--sunset)', color: '#faf6ec',
        border: 'none', borderRadius: 4,
        fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--shadow-lg)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        Random landing
      </button>
      {/* Bottom-right: stats */}
      <div style={{
        position: 'absolute', bottom: 28, right: 28, zIndex: 400,
        display: 'flex', gap: 0,
        background: 'var(--surface-glass)',
        border: '1px solid var(--line-strong)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
      }}>
        {[
          ['Clips', STATS.projected.clips.toLocaleString()],
          ['Pilots', STATS.projected.pilots.toLocaleString()],
          ['Countries', STATS.projected.countries.toLocaleString()],
          ['Licensed', STATS.projected.licensed.toLocaleString()],
        ].map(([k, v], i) => (
          <div key={k} style={{
            padding: '12px 20px',
            borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
          }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Compass rose */}
      <div style={{
        position: 'absolute', top: 28, right: 28, zIndex: 400,
        width: 68, height: 68, pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 68 68" width="68" height="68">
          <circle cx="34" cy="34" r="32" fill="var(--surface-glass)" stroke="var(--line-strong)"/>
          <path d="M34 8 L40 34 L34 30 L28 34 Z" fill="var(--amber)"/>
          <path d="M34 60 L40 34 L34 38 L28 34 Z" fill="var(--parchment-dim)" opacity="0.5"/>
          <text x="34" y="22" textAnchor="middle" fill="var(--bone)" fontSize="8" fontFamily="JetBrains Mono">N</text>
          <text x="34" y="54" textAnchor="middle" fill="var(--parchment-dim)" fontSize="8" fontFamily="JetBrains Mono">S</text>
          <text x="10" y="37" textAnchor="middle" fill="var(--parchment-dim)" fontSize="8" fontFamily="JetBrains Mono">W</text>
          <text x="58" y="37" textAnchor="middle" fill="var(--parchment-dim)" fontSize="8" fontFamily="JetBrains Mono">E</text>
        </svg>
      </div>
    </div>
  );
}

export function LocationSheet({ loc, onOpenVideo, onClose }) {
  if (!loc) return null;
  const vids = VIDEOS.filter(v => v.locationId === loc.id);
  const topThree = vids.slice(0, 3);
  const rest = vids.slice(3);
  return (
    <section className="slide-up" style={{
      padding: '40px 28px 60px',
      background: 'var(--forest-950)',
      borderTop: '1px solid var(--line-strong)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, marginBottom: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>
              <span className="mono" style={{ marginRight: 10 }}>{loc.lat.toFixed(4)}° / {loc.lon.toFixed(4)}°</span>
              · {loc.country}
            </div>
            <h2 style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>{loc.name}</h2>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14, color: 'var(--parchment)' }}>
              <span><strong style={{ color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 16 }}>{vids.length}</strong> clips</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span className="chip" style={{ padding: '4px 10px', fontSize: 12 }}>
                <span className="chip-icon" style={{ display: 'inline-flex' }}>{CAT_ICONS[loc.category] && CAT_ICONS[loc.category](12)}</span>
                {CATEGORIES.find(c => c.id === loc.category)?.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary" style={{ fontSize: 13 }} data-placeholder="true">Follow this landmark</button>
            <button onClick={onClose} className="btn secondary" style={{ padding: '10px', width: 40, height: 40, justifyContent: 'center' }}>
              <Ic.close/>
            </button>
          </div>
        </div>

        {/* Top 3 with rank badge */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
              <span style={{ color: 'var(--amber)', marginRight: 8 }}><Ic.crown/></span>
              Top 3 at {loc.name}
            </h3>
            <span className="mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.12em' }}>RANKED BY LAST 30 DAYS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {topThree.map((v, i) => (
              <VideoCard key={v.id} video={{ ...v, rank: i + 1 }} onClick={onOpenVideo} showRank />
            ))}
          </div>
        </div>

        {/* All other clips */}
        {rest.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, letterSpacing: '-0.01em' }}>All footage ({rest.length})</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Recent', 'Most viewed', 'Free only', '4K+'].map((opt, i) => (
                  <button key={opt} className={'chip' + (i === 0 ? ' active' : '')} style={{ padding: '6px 12px', fontSize: 12 }} data-placeholder="true">{opt}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {rest.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedRow({ title, eyebrow, videos, onOpenVideo, accent }) {
  return (
    <section style={{ padding: '40px 28px 10px', maxWidth: 1760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: accent || 'var(--amber)', marginBottom: 6 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 30, letterSpacing: '-0.02em' }}>{title}</h2>
        </div>
        <button className="btn secondary" style={{ fontSize: 13 }} data-placeholder="true">View all <Ic.chevron/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {videos.slice(0, 8).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} showRank={!!v.rank} />)}
      </div>
    </section>
  );
}

export function HomePage({ onOpenVideo, onNav }) {
  const [selectedLoc, setSelectedLoc] = hUseState(null);
  const [categoryFilter, setCategoryFilter] = hUseState('all');
  const [mapFilters, setMapFilters] = hUseState({ free: false, uhd: false, recent: false, featured: false });
  const sheetRef = hUseRef(null);

  const toggleFilter = (k) => setMapFilters(f => ({ ...f, [k]: !f[k] }));
  const activeFilterCount = Object.values(mapFilters).filter(Boolean).length;

  const handleSelect = (loc) => {
    setSelectedLoc(loc);
    setTimeout(() => {
      sheetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <>
      <MapHero selectedLoc={selectedLoc} onSelectLoc={handleSelect} categoryFilter={categoryFilter} mapFilters={mapFilters} />

      {/* Sticky category bar + map filters */}
      <div style={{
        position: 'sticky', top: 62, zIndex: 50,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CategoryChips active={categoryFilter} onChange={setCategoryFilter} compact />
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 10px 4px', borderLeft: '1px solid var(--line)', marginLeft: 8 }}>
          {[
            ['free', 'Free only'],
            ['uhd', '4K+'],
            ['recent', 'Last 30 days'],
            ['featured', 'Editors\u2019 picks'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => toggleFilter(k)}
              className={'chip' + (mapFilters[k] ? ' active' : '')}
              style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button onClick={() => setMapFilters({ free: false, uhd: false, recent: false, featured: false })}
              style={{ padding: '6px 10px', fontSize: 11, color: 'var(--sunset)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              CLEAR
            </button>
          )}
        </div>
      </div>

      <div ref={sheetRef}>
        {selectedLoc && <LocationSheet loc={selectedLoc} onOpenVideo={onOpenVideo} onClose={() => setSelectedLoc(null)} />}
      </div>

      {!selectedLoc && (
        <>
          <FeaturedRow
            eyebrow="● TRENDING THIS WEEK"
            title="What the world is watching"
            videos={TRENDING}
            onOpenVideo={onOpenVideo}
            accent="var(--sunset)"
          />

          {/* Featured landmarks strip */}
          <section style={{ padding: '40px 28px', maxWidth: 1760, margin: '0 auto' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>EDITOR'S ATLAS</div>
            <h2 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 18 }}>Landmarks worth the flight</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {LOCATIONS.filter(l => l.featured).concat(LOCATIONS.filter(l => !l.featured).slice(0, 9)).map(loc => (
                <button key={loc.id} onClick={() => handleSelect(loc)} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: 18,
                  background: 'var(--forest-900)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{
                    width: 56, height: 56, flexShrink: 0,
                    background: thumbGradient(loc.id.length * 7),
                    borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--amber)',
                    border: '1px solid var(--line)',
                  }}>{CAT_ICONS[loc.category] && CAT_ICONS[loc.category](22)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 2 }}>
                      {loc.country}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>
                      {loc.videos} clips · {CATEGORIES.find(c => c.id === loc.category)?.label}
                    </div>
                  </div>
                  <span style={{ color: 'var(--parchment-dim)' }}><Ic.chevron/></span>
                </button>
              ))}
            </div>
          </section>

          <FeaturedRow
            eyebrow="CINEMATIC · 4K+"
            title="Fresh from the flight deck"
            videos={VIDEOS.slice(4, 16)}
            onOpenVideo={onOpenVideo}
          />
        </>
      )}
    </>
  );
}

