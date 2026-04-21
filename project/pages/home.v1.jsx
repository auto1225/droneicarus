// pages/home.jsx — Map hero + location detail bottom sheet + video grids

const { useState: hUseState, useEffect: hUseEffect, useRef: hUseRef, useMemo: hUseMemo } = React;

function MapHero({ selectedLoc, onSelectLoc, categoryFilter }) {
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
    // High-resolution satellite imagery with retina detection
    const dpr = window.devicePixelRatio || 1;
    const detectRetina = dpr > 1;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri · Maxar · Earthstar Geographics',
      maxZoom: 19,
      maxNativeZoom: 19,
      detectRetina,
      crossOrigin: true,
    }).addTo(map);
    // Crisp label overlay on top of satellite
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina,
      opacity: 0.9,
      pane: 'shadowPane',
    }).addTo(map);
    mapInstance.current = map;
  }, []);

  hUseEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const L = window.L;
    const locs = categoryFilter === 'all'
      ? window.LOCATIONS
      : window.LOCATIONS.filter(l => l.category === categoryFilter);

    locs.forEach(loc => {
      const isFeatured = loc.featured;
      const html = `<div class="pin-outer">
        <div class="pin-ring"></div>
        <div class="pin-core"></div>
        <div class="pin-count">${loc.videos}</div>
      </div>`;
      const icon = L.divIcon({
        className: 'drone-pin' + (isFeatured ? ' featured' : ''),
        html,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });
      const marker = L.marker([loc.lat, loc.lon], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="padding:14px 16px;">
          <div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--parchment-dim); text-transform: uppercase; margin-bottom:4px;">${loc.country}</div>
          <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-bottom: 6px;">${loc.name}</div>
          <div style="font-size: 12px; color: var(--parchment-dim); margin-bottom: 12px;">${loc.videos} aerial clips · ${loc.category}</div>
          <button id="view-${loc.id}" style="width:100%;padding:8px 12px;background:var(--sunset);color:var(--bone);border:none;border-radius:2px;font-weight:600;font-size:12px;cursor:pointer;font-family:var(--font-ui);">View footage →</button>
        </div>
      `);
      marker.on('click', () => {
        onSelectLoc(loc);
        map.flyTo([loc.lat, loc.lon], 16, { duration: 1.2 });
      });
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`view-${loc.id}`);
          if (btn) btn.onclick = () => onSelectLoc(loc);
        }, 10);
      });
      markersRef.current.push(marker);
    });
  }, [categoryFilter, onSelectLoc]);

  // When selectedLoc changes via other UI, pan map
  hUseEffect(() => {
    if (!selectedLoc) return;
    if (mapInstance.current) {
      mapInstance.current.flyTo([selectedLoc.lat, selectedLoc.lon], 16, { duration: 1.2 });
    }
  }, [selectedLoc]);

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
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--sunset)' }}>● Live · {window.LOCATIONS.length} landmarks indexed</div>
        <h1 style={{ fontSize: 56, lineHeight: 1.02, marginBottom: 14 }}>
          The world,<br/>from <em style={{ color: 'var(--sunset)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>1,200 feet</em> up.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--parchment)', maxWidth: 440 }}>
          Pan the map. Click any pin to find aerial footage shot by pilots on the ground — from the Giza Plateau to Namsan Tower.
        </p>
      </div>
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
          ['Clips', '12,847'],
          ['Pilots', '1,294'],
          ['Countries', '184'],
          ['Licensed', '6,120'],
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

function LocationSheet({ loc, onOpenVideo, onClose }) {
  if (!loc) return null;
  const vids = window.VIDEOS.filter(v => v.locationId === loc.id);
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
                <span className="chip-icon" style={{ display: 'inline-flex' }}>{window.CAT_ICONS[loc.category] && window.CAT_ICONS[loc.category](12)}</span>
                {window.CATEGORIES.find(c => c.id === loc.category)?.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary" style={{ fontSize: 13 }}>Follow this landmark</button>
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
                  <button key={opt} className={'chip' + (i === 0 ? ' active' : '')} style={{ padding: '6px 12px', fontSize: 12 }}>{opt}</button>
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
        <button className="btn secondary" style={{ fontSize: 13 }}>View all <Ic.chevron/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {videos.slice(0, 8).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} showRank={!!v.rank} />)}
      </div>
    </section>
  );
}

function HomePage({ onOpenVideo, onNav }) {
  const [selectedLoc, setSelectedLoc] = hUseState(null);
  const [categoryFilter, setCategoryFilter] = hUseState('all');
  const sheetRef = hUseRef(null);

  const handleSelect = (loc) => {
    setSelectedLoc(loc);
    setTimeout(() => {
      sheetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <>
      <MapHero selectedLoc={selectedLoc} onSelectLoc={handleSelect} categoryFilter={categoryFilter} />

      {/* Sticky category bar */}
      <div style={{
        position: 'sticky', top: 62, zIndex: 50,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <CategoryChips active={categoryFilter} onChange={setCategoryFilter} compact />
      </div>

      <div ref={sheetRef}>
        {selectedLoc && <LocationSheet loc={selectedLoc} onOpenVideo={onOpenVideo} onClose={() => setSelectedLoc(null)} />}
      </div>

      {!selectedLoc && (
        <>
          <FeaturedRow
            eyebrow="● TRENDING THIS WEEK"
            title="What the world is watching"
            videos={window.TRENDING}
            onOpenVideo={onOpenVideo}
            accent="var(--sunset)"
          />

          {/* Featured landmarks strip */}
          <section style={{ padding: '40px 28px', maxWidth: 1760, margin: '0 auto' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>EDITOR'S ATLAS</div>
            <h2 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 18 }}>Landmarks worth the flight</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {window.LOCATIONS.filter(l => l.featured).concat(window.LOCATIONS.filter(l => !l.featured).slice(0, 9)).map(loc => (
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
                    background: window.thumbGradient(loc.id.length * 7),
                    borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--amber)',
                    border: '1px solid var(--line)',
                  }}>{window.CAT_ICONS[loc.category] && window.CAT_ICONS[loc.category](22)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 2 }}>
                      {loc.country}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>
                      {loc.videos} clips · {window.CATEGORIES.find(c => c.id === loc.category)?.label}
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
            videos={window.VIDEOS.slice(4, 16)}
            onOpenVideo={onOpenVideo}
          />
        </>
      )}
    </>
  );
}

Object.assign(window, { HomePage, LocationSheet });
