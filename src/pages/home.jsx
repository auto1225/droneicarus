// pages/home.jsx — Map hero + location detail bottom sheet + video grids
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useContent } from '../content/ContentContext';
import { fetchSidebarSlots } from '../db/picks';
import { CATEGORIES, CAT_ICONS, LOCATIONS as _MOCK_LOCATIONS, VIDEOS as _MOCK_VIDEOS, TRENDING, thumbGradient, STATS } from '../data';
import { fetchVideos } from '../db/videos';
import { Ic, CategoryChips, VideoCard } from '../components';
import { useSiteSetting } from '../db/useSettings';
const hUseState = useState;
const hUseEffect = useEffect;
const hUseRef = useRef;
const hUseMemo = useMemo;
const hUseCallback = useCallback;

// Escape HTML for safe injection into Leaflet popup/tooltip HTML strings
function hEsc(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function MapHero({ selectedLoc, onSelectLoc, selectedFineSet, mapFilters, searchQuery, locations, videos, onOpenVideo, onNav }) {
  const LOCATIONS = locations && locations.length > 0 ? locations : _MOCK_LOCATIONS;
  const VIDEOS = videos && videos.length > 0 ? videos : _MOCK_VIDEOS;
  const mapRef = hUseRef(null);
  const mapInstance = hUseRef(null);
  const markersRef = hUseRef([]);
  const liveMarkersRef = hUseRef([]);
  const [liveStreams, setLiveStreams] = hUseState([]);

  // Fetch active live streams + refresh every 30s
  hUseEffect(() => {
    let cancel = false;
    const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
    const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const fetchLive = async () => {
      try {
        const r = await fetch(`${SUPA_URL}/rest/v1/live_streams?select=id,title,thumb_url,lat,lon,viewers_peak,yt_video_id&status=eq.live&limit=50`, {
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
        if (r.ok && !cancel) setLiveStreams(await r.json());
      } catch {}
    };
    fetchLive();
    const t = setInterval(fetchLive, 30000);
    return () => { cancel = true; clearInterval(t); };
  }, []);

  hUseEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    const L = window.L;
    // Restore last viewed map state (center+zoom) from sessionStorage so users
    // returning from a video player land on the exact view they left.
    let initCenter = [25, 15];
    let initZoom = 3;
    try {
      const saved = JSON.parse(sessionStorage.getItem('mapViewState') || 'null');
      if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon) && Number.isFinite(saved.zoom)) {
        initCenter = [saved.lat, saved.lon];
        initZoom = Math.min(19, Math.max(2, saved.zoom));
      }
    } catch {}
    const map = L.map(mapRef.current, {
      center: initCenter,
      zoom: initZoom,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      worldCopyJump: false,
      attributionControl: true,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
    });
    // Persist the map view on every move/zoom so restoration always reflects the latest state.
    map.on('moveend zoomend', () => {
      try {
        const c = map.getCenter();
        sessionStorage.setItem('mapViewState', JSON.stringify({ lat: c.lat, lon: c.lng, zoom: map.getZoom() }));
      } catch {}
    });
    const dpr = devicePixelRatio || 1;
    const detectRetina = dpr > 1;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri · Maxar · Earthstar Geographics',
      maxZoom: 19, maxNativeZoom: 19, detectRetina, crossOrigin: true, noWrap: true, bounds: [[-85, -180], [85, 180]],
    }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19, detectRetina, opacity: 0.9, pane: 'shadowPane', noWrap: true, bounds: [[-85, -180], [85, 180]],
    }).addTo(map);
    mapInstance.current = map;
  }, []);

  // Compute filtered locations based on hierarchy selection + mapFilters
  const filteredLocs = hUseMemo(() => {
    let locs = LOCATIONS;
    // selectedFineSet: a Set of fine-category strings (videos.tags[0]) when sidebar
    // group/child is active. null/empty → show all.
    if (selectedFineSet && selectedFineSet.size > 0) {
      locs = locs.filter(l => {
        const fine = l.video?.tags?.[0];
        return fine && selectedFineSet.has(fine);
      });
    }

    // text search (on title and country/name)
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      locs = locs.filter(loc => {
        const v = loc.video || {};
        return (
          (v.title || '').toLowerCase().includes(q) ||
          (loc.name || '').toLowerCase().includes(q) ||
          (loc.country || '').toLowerCase().includes(q) ||
          (v.description || '').toLowerCase().includes(q)
        );
      });
    }

    if (!mapFilters) return locs;

    return locs.filter(loc => {
      const vids = loc.video ? [loc.video] : VIDEOS.filter(v => v.locationId === loc.id);
      if (mapFilters.free && !vids.some(v => v.price === 0)) return false;
      if (mapFilters.paid && !vids.some(v => v.price > 0)) return false;
      if (mapFilters.pilot && !vids.some(v => v.source && v.source !== 'youtube')) return false;
      if (mapFilters.commercial && !vids.some(v => Array.isArray(v.licenseTiers) && v.licenseTiers.includes('commercial'))) return false;
      if (mapFilters.extended && !vids.some(v => Array.isArray(v.licenseTiers) && v.licenseTiers.includes('extended'))) return false;
      if (mapFilters.exclusive && !vids.some(v => Array.isArray(v.licenseTiers) && v.licenseTiers.includes('exclusive'))) return false;
      if (mapFilters.uhd && !vids.some(v => v.resolution && (v.resolution.includes('5K') || v.resolution.includes('8K') || v.resolution === '4K'))) return false;
      if (mapFilters.recent && !vids.some(v => (v.uploadedDaysAgo || 999) <= 30)) return false;
      if (mapFilters.featured && !loc.featured) return false;
      return true;
    });
  }, [selectedFineSet, mapFilters, searchQuery, locations, videos]);

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

      // Adaptive cluster cell size — shrinks as zoom increases so pins at the
      // same coord never visually overlap. At the finest level (zoom 17+) we
      // still collapse exact-coord stacks so the count displayed is always
      // exactly what's visible on screen.
      let cellDeg;
      if      (zoom <= 3)  cellDeg = 20;     // continental
      else if (zoom <= 5)  cellDeg = 8;
      else if (zoom <= 7)  cellDeg = 2;
      else if (zoom <= 9)  cellDeg = 0.5;
      else if (zoom <= 11) cellDeg = 0.1;
      else if (zoom <= 13) cellDeg = 0.02;
      else if (zoom <= 15) cellDeg = 0.005;
      else                 cellDeg = 0.0005;  // ~50m — still stacks exact duplicates

      const clusters = new Map();
      filteredLocs.forEach(loc => {
        const cx = Math.floor(loc.lon / cellDeg) * cellDeg + cellDeg/2;
        const cy = Math.floor(loc.lat / cellDeg) * cellDeg + cellDeg/2;
        const key = `${cx.toFixed(6)}:${cy.toFixed(6)}`;
        if (!clusters.has(key)) clusters.set(key, { lat: cy, lon: cx, locs: [], videos: 0 });
        const c = clusters.get(key);
        c.locs.push(loc);
        c.videos += (loc.videos || 1);
        c.lat = c.locs.reduce((s,l)=>s+l.lat,0)/c.locs.length;
        c.lon = c.locs.reduce((s,l)=>s+l.lon,0)/c.locs.length;
      });

      clusters.forEach(c => {
        if (c.locs.length === 1) {
          // Single item — ensure the badge shows 1
          addPin(c.locs[0], isSelected(c.locs[0]));
        } else {
          // Stacked or multi-location cluster — the count is ALWAYS c.locs.length
          // (sum of per-location counts — since dbLocations has videos:1 each,
          // this is exactly the number of clips in the stack).
          const size = Math.min(72, 30 + Math.log2(Math.max(c.locs.length, 2)) * 7);
          const html = `<div class="cluster-pin" style="width:${size}px;height:${size}px;">
            <span class="cluster-ring"></span>
            <span class="cluster-num">${c.locs.length}</span>
            <span class="cluster-vids">${c.locs.length === 1 ? '1 clip' : c.locs.length + ' clips'}</span>
          </div>`;
          const icon = L.divIcon({ className: 'cluster-pin-wrap', html, iconSize: [size, size], iconAnchor: [size/2, size/2] });
          const marker = L.marker([c.lat, c.lon], { icon, zIndexOffset: 500 }).addTo(map);
          marker.on('click', () => {
            const uniq = new Set(c.locs.map(l => `${l.lat.toFixed(5)}:${l.lon.toFixed(5)}`));
            if (uniq.size === 1 || zoom >= 14) {
              // Same-spot stack (or already very zoomed in) — open a popup listing
              // every clip at this coord so the user can pick which to play.
              const popupHtml = `
                <div class="stack-popup">
                  <div class="stack-popup-title">${c.locs.length} clips here</div>
                  <div class="stack-popup-list">
                    ${c.locs.map((loc, i) => {
                      const v = loc.video || {};
                      const thumb = v.thumbUrl
                        || (v.youtubeId || v.ytId ? `https://i.ytimg.com/vi/${v.youtubeId || v.ytId}/hqdefault.jpg` : '');
                      const title = hEsc(v.title || loc.name || 'Untitled');
                      const channel = hEsc(v.channel || v.creator?.name || '');
                      return `
                        <div class="stack-row" data-idx="${i}">
                          <div class="stack-thumb" style="${thumb ? `background-image:url('${hEsc(thumb)}');background-size:cover;background-position:center` : 'background:var(--forest-800)'}"></div>
                          <div class="stack-meta">
                            <div class="stack-ttl">${title}</div>
                            <div class="stack-sub">${channel}</div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>`;
              const popup = L.popup({
                className: 'stack-leaflet-popup',
                maxWidth: 340, minWidth: 280, autoPan: true,
                closeButton: true,
              })
                .setLatLng([c.lat, c.lon])
                .setContent(popupHtml)
                .openOn(map);
              // Hook clicks on each row
              setTimeout(() => {
                const el = popup.getElement();
                if (!el) return;
                el.querySelectorAll('.stack-row').forEach(row => {
                  row.addEventListener('click', () => {
                    const i = Number(row.getAttribute('data-idx'));
                    const loc = c.locs[i];
                    if (loc?.video && onOpenVideo) onOpenVideo(loc.video);
                    else if (loc) onSelectLoc(loc);
                    map.closePopup();
                  });
                });
              }, 50);
            } else {
              const bounds = L.latLngBounds(c.locs.map(l => [l.lat, l.lon]));
              map.flyToBounds(bounds.pad(0.4), { duration: 1.1, maxZoom: 14 });
            }
          });
          markersRef.current.push(marker);
        }
      });
    };

    const addPin = (loc, selected) => {
      const isFeatured = loc.featured;
      const vids = loc.video ? [loc.video] : VIDEOS.filter(v => v.locationId === loc.id).slice(0, 3);
      const firstVid = vids[0];
      const isPaid = vids.some(v => Number(v.price) > 0);
      const isPilot = vids.some(v => v.source && v.source !== 'youtube');
      const minPrice = vids.filter(v => Number(v.price) > 0).reduce((m, v) => m === null || v.price < m ? v.price : m, null);

      const html = `<div class="pin-outer ${selected ? 'selected' : ''}${isPaid ? ' paid' : ''}${isPilot ? ' pilot' : ''}">
        <div class="pin-ring"></div>
        <div class="pin-core"></div>
        <div class="pin-count">${loc.videos}</div>
        ${isPaid ? `<div class="pin-price">$${Math.round(minPrice)}</div>` : ''}
      </div>`;
      const icon = L.divIcon({
        className: 'drone-pin' + (isFeatured ? ' featured' : '') + (selected ? ' is-selected' : '') + (isPaid ? ' is-paid' : '') + (isPilot ? ' is-pilot' : ''),
        html, iconSize: [44, 44], iconAnchor: [22, 44],
      });
      const marker = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: selected ? 2000 : (isFeatured ? 600 : 100) }).addTo(map);

      // Hover tooltip — show real YouTube/storage thumbnails when available.
      const _safeIdH = (id) => { const s = String(id||''); let h=0; for (let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); };
      const tipHtml = `
        <div class="pin-tip">
          <div class="pin-tip-thumbs">
            ${vids.map((v, i) => {
              const thumbUrl = v.thumbUrl || (v.youtubeId || v.ytId ? `https://i.ytimg.com/vi/${v.youtubeId || v.ytId}/hqdefault.jpg` : '');
              const styleStr = thumbUrl
                ? `background-image:url('${hEsc(thumbUrl)}');background-size:cover;background-position:center;`
                : `background:${hEsc(thumbGradient(_safeIdH(v.id)))};`;
              return `<div class="pin-tip-thumb" style="${styleStr}">
                ${v.source === 'youtube' ? `<span class="pin-tip-yt">▶ YT</span>` : ''}
                ${i === 0 ? `<span class="pin-tip-play"></span>` : ''}
                ${v.price > 0 ? `<span class="pin-tip-paid">$${v.price} · DEMO</span>` : ''}
              </div>`;
            }).join('') || '<div class="pin-tip-thumb empty"></div>'}
          </div>
          <div class="pin-tip-body">
            <div class="pin-tip-country">${hEsc(loc.country || '')}</div>
            <div class="pin-tip-name">${hEsc(loc.name)}</div>
            <div class="pin-tip-meta">${loc.videos} clip${loc.videos === 1 ? '' : 's'}${vids.filter(v=>v.price===0).length > 0 ? ' · '+vids.filter(v=>v.price===0).length+' free' : ''}</div>
          </div>
        </div>
      `;
      marker.bindTooltip(tipHtml, {
        direction: 'top', offset: [0, -40], opacity: 1,
        className: 'pin-tooltip', sticky: false,
      });

      marker.on('click', () => {
        if (loc.video && onOpenVideo) {
          onOpenVideo(loc.video);
          return;
        }
        onSelectLoc(loc);
        map.flyTo([loc.lat, loc.lon], Math.max(map.getZoom(), 9), { duration: 1.2 });
      });
      markersRef.current.push(marker);
    };

    renderMarkers();
    map.off('zoomend', renderMarkers);
    map.on('zoomend', renderMarkers);
    return () => { map.off('zoomend', renderMarkers); };
  }, [selectedFineSet, mapFilters, searchQuery, filteredLocs, onSelectLoc, selectedLoc]);

  // Render LIVE broadcast pins as a separate animated overlay
  hUseEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const L = window.L;
    liveMarkersRef.current.forEach(m => map.removeLayer(m));
    liveMarkersRef.current = [];
    for (const s of (liveStreams || [])) {
      if (!s.lat || !s.lon) continue;
      const escTitle = (s.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const viewers = s.viewers_peak ? (s.viewers_peak >= 1000 ? (s.viewers_peak/1000).toFixed(1).replace(/\.0$/,'')+'k' : s.viewers_peak) : '';
      const html = `<div class="live-pin-wrap">
        <div class="live-pin-pulse"></div>
        <div class="live-pin-pulse-2"></div>
        <div class="live-pin-dot">● LIVE${viewers ? ` · ${viewers}` : ''}</div>
        <div class="live-pin-callout">${escTitle.slice(0,60)}</div>
      </div>`;
      const icon = L.divIcon({ className: 'live-pin-icon', html, iconSize: [240, 90], iconAnchor: [120, 30] });
      const marker = L.marker([s.lat, s.lon], { icon, zIndexOffset: 1000 }).addTo(map);
      marker.on('click', () => onNav && onNav('live', s.id));
      liveMarkersRef.current.push(marker);
    }
  }, [liveStreams]);

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 64px)', minHeight: 580 }} className="home-grid">
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14,
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
          ['Clips', (videos||[]).length.toLocaleString()],
          ['Pilots', (new Set((videos||[]).map(v=>v.channel).filter(Boolean))).size.toLocaleString()],
          ['Countries', (new Set((videos||[]).map(v=>v.country).filter(Boolean))).size.toLocaleString()],
          ['Licensed', (videos||[]).filter(v=>Array.isArray(v.licenseTiers)&&v.licenseTiers.length>0).length.toLocaleString()],
        ].map(([k, v], i) => (
          <div key={k} style={{
            padding: '12px 20px',
            borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
          }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Live broadcasts persistent badge */}
      {liveStreams && liveStreams.length > 0 && (
        <button onClick={() => onNav && onNav('live', liveStreams[0].id)}
          style={{
            position: 'absolute', top: 28, right: 110, zIndex: 401,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', background: 'var(--sunset)', color: '#fff',
            border: '2px solid #faf6ec', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.08em', boxShadow: '0 6px 20px rgba(217,112,69,0.45)',
            animation: 'live-badge-glow 2s ease-in-out infinite',
          }}
          title={`${liveStreams.length} live broadcast(s) · click to tune in`}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px rgba(255,255,255,0.4)', animation: 'live-dot-blink 1s infinite' }}/>
          {liveStreams.length} LIVE NOW
          <span style={{ opacity: 0.85, fontSize: 12 }}>· Tune in →</span>
        </button>
      )}

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
    <HomeRightSidebar onOpenVideo={onOpenVideo} onNav={onNav} />
    </div>
  );
}

function HomeRightSidebar({ onOpenVideo, onNav }) {
  const [slots, setSlots] = hUseState({ hot: [], live: [], ads: [], recent: [] });
  const [aiClips, setAiClips] = hUseState([]);
  hUseEffect(() => {
    let cancel = false;
    const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
    const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${SUPA_URL}/rest/v1/videos?select=id,title,thumb_url,youtube_id,youtube_channel,views,category&category=eq.ai-aerial&status=eq.published&order=views.desc.nullslast&limit=8`, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
    }).then(r => r.ok ? r.json() : []).then(rs => { if (!cancel) setAiClips(rs || []); }).catch(() => {});
    return () => { cancel = true; };
  }, []);
  hUseEffect(() => {
    let cancel = false;
    fetchSidebarSlots().then(s => { if (!cancel) setSlots(s); });
    return () => { cancel = true; };
  }, []);
  const fmtViews = (n) => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'') + 'k' : (n||0);
  const ytThumb = (id) => id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : '';
  return (
    <aside className="home-right-sidebar" style={{
      borderLeft: '1px solid var(--line-strong)', background: 'var(--ink)',
      overflowY: 'auto', padding: '16px 14px 20px',
    }}>
      {slots.live.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--sunset)', margin: '4px 0 10px' }}>● LIVE NOW</h3>
          {slots.live.map(s => (
            <button key={s.id} onClick={() => onNav('live', s.id)}
              style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', marginBottom: 8 }}>
              <div style={{ position: 'relative', width: 120, height: 70, background: 'var(--forest-900)', borderRadius: 4, overflow: 'hidden' }}>
                {s.thumb_url && <img src={s.thumb_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--sunset)', color: '#fff', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '2px 5px', borderRadius: 2 }}>LIVE</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{(s.viewers_peak || 0).toLocaleString()} viewers</div>
              </div>
            </button>
          ))}
        </section>
      )}
      {aiClips.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--amber)', margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--sunset)' }}>✦</span> AI AERIAL
            <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', background: 'rgba(200,90,46,0.10)', color: 'var(--sunset)', borderRadius: 999, letterSpacing: '0.08em', fontWeight: 700 }}>NEW</span>
          </h3>
          {aiClips.slice(0, 6).map(v => (
            <button key={v.id} onClick={() => onOpenVideo && onOpenVideo({ ...v, thumbUrl: v.thumb_url, youtubeId: v.youtube_id })}
              style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', marginBottom: 8 }}>
              <div style={{ position: 'relative', width: 120, height: 70, background: 'var(--forest-900)', borderRadius: 4, overflow: 'hidden' }}>
                {(v.thumb_url || v.youtube_id) && <img src={v.thumb_url || (v.youtube_id ? `https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg` : '')} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--sunset)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontWeight: 700 }}>AI</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v.youtube_channel || ''}</div>
              </div>
            </button>
          ))}
        </section>
      )}
      {slots.ads.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', margin: '4px 0 10px' }}>SPONSORED</h3>
          {slots.ads.map(a => (
            <a key={a.id} href={a.click_url || '#'} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: 10, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, textDecoration: 'none', color: 'inherit', marginBottom: 8 }}>
              {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', borderRadius: 3, marginBottom: 8 }}/>}
              {a.brand && <div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 3, letterSpacing: '0.08em' }}>{a.brand}</div>}
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
              {a.cta_label && <div style={{ fontSize: 12, color: 'var(--amber)' }}>{a.cta_label} →</div>}
            </a>
          ))}
        </section>
      )}
      {slots.recent && slots.recent.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--moss)', margin: '4px 0 10px' }}>↑ JUST UPLOADED</h3>
          {slots.recent.slice(0, 4).map(v => (
            <button key={v.id} onClick={() => onOpenVideo && onOpenVideo(v)}
              style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', marginBottom: 8 }}>
              <div style={{ width: 120, height: 70, background: 'var(--forest-900)', borderRadius: 4, overflow: 'hidden' }}>
                {(v.thumb_url || v.youtube_id) && <img src={v.thumb_url || ytThumb(v.youtube_id)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{v.published_at ? new Date(v.published_at).toLocaleDateString() : 'recent'}</div>
              </div>
            </button>
          ))}
        </section>
      )}
      <section>
        <h3 className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--amber)', margin: '4px 0 10px' }}>★ HOT NOW</h3>
        {slots.hot.map(v => (
          <button key={v.id} onClick={() => onOpenVideo && onOpenVideo(v)}
            style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', marginBottom: 8 }}>
            <div style={{ width: 120, height: 70, background: 'var(--forest-900)', borderRadius: 4, overflow: 'hidden' }}>
              {(v.thumb_url || v.youtube_id) && <img src={v.thumb_url || ytThumb(v.youtube_id)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{fmtViews(v.views)} views</div>
            </div>
          </button>
        ))}
      </section>
    </aside>
  );
}

export function LocationSheet({ loc, onOpenVideo, onClose }) {
  if (!loc) return null;
  // Pull videos for this location from mock fallback (LocationSheet only fires for
  // mock landmarks; YouTube-discovered pins are 1:1 video and bypass this sheet).
  const vids = _MOCK_VIDEOS.filter(v => v.locationId === loc.id);
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
              <span className="chip" style={{ padding: '4px 10px', fontSize: 14 }}>
                <span className="chip-icon" style={{ display: 'inline-flex' }}>{CAT_ICONS[loc.category] && CAT_ICONS[loc.category](12)}</span>
                {CATEGORIES.find(c => c.id === loc.category)?.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">Follow this landmark</button>
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
            <span className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', letterSpacing: '0.12em' }}>RANKED BY LAST 30 DAYS</span>
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
                  <button key={opt} className={'chip' + (i === 0 ? ' active' : '')} style={{ padding: '6px 12px', fontSize: 14 }} data-placeholder="true">{opt}</button>
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
        <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">View all <Ic.chevron/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {videos.slice(0, 8).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} showRank={!!v.rank} />)}
      </div>
    </section>
  );
}


// ─── 2-level category hierarchy (mirrors Explore page; loaded from site_content if present) ─────────
const HOME_DEFAULT_HIERARCHY = {
  groups: [
    { id: 'nature', label: 'Nature', icon: 'mountain', children: [
      { id: 'mountain',     label: 'Mountain & Glacier', fine: ['mountain','glacier'] },
      { id: 'volcano',      label: 'Volcano',            fine: ['volcano'] },
      { id: 'waterfall',    label: 'Waterfall',          fine: ['waterfall'] },
      { id: 'forest',       label: 'Forest & Jungle',    fine: ['rainforest','forest'] },
      { id: 'desert',       label: 'Desert & Dunes',     fine: ['desert','dunes'] },
      { id: 'landscape',    label: 'Landscape',          fine: ['landscape'] },
    ]},
    { id: 'water', label: 'Ocean & Coast', icon: 'water', children: [
      { id: 'open-ocean',   label: 'Open Ocean',     fine: ['ocean'] },
      { id: 'atoll',        label: 'Atolls & Reefs', fine: ['atoll'] },
      { id: 'coast',        label: 'Coastal Cliffs', fine: ['coastal-cliff'] },
      { id: 'marine-life',  label: 'Marine Life',    fine: ['marine-life'] },
      { id: 'polar',        label: 'Polar & Ice',    fine: ['polar'] },
    ]},
    { id: 'sky', label: 'Sky & Weather', icon: 'sky', children: [
      { id: 'aurora',       label: 'Aurora',         fine: ['aurora'] },
      { id: 'phenomena',    label: 'Phenomena',      fine: ['phenomena','storm-chasing','stratosphere'] },
      { id: 'fireworks',    label: 'Fireworks',      fine: ['fireworks'] },
      { id: 'drone-show',   label: 'Drone Shows',    fine: ['drone-show'] },
    ]},
    { id: 'cities', label: 'Cities', icon: 'city', children: [
      { id: 'skyline',      label: 'Skylines',       fine: ['cityscape','night-flight'] },
      { id: 'architecture', label: 'Architecture',   fine: ['architecture'] },
      { id: 'bridge',       label: 'Bridges',        fine: ['bridge'] },
      { id: 'port',         label: 'Ports & Harbors',fine: ['port'] },
    ]},
    { id: 'heritage', label: 'Heritage', icon: 'heritage', children: [
      { id: 'ruins',        label: 'Ancient Ruins',  fine: ['ancient-ruins','ruins-heritage'] },
      { id: 'temple',       label: 'Temples & Shrines', fine: ['temple'] },
      { id: 'castle',       label: 'Castles & Palaces', fine: ['castle'] },
    ]},
    { id: 'human-landscape', label: 'Human Landscape', icon: 'agriculture', children: [
      { id: 'vineyard',     label: 'Vineyards',     fine: ['vineyard'] },
      { id: 'rice-terrace', label: 'Rice Terraces', fine: ['rice-terrace'] },
      { id: 'flower-field', label: 'Flower Fields', fine: ['flower-field'] },
    ]},
    { id: 'action', label: 'Action & Sports', icon: 'action', children: [
      { id: 'fpv-racing',   label: 'FPV Racing',    fine: ['aerial-sports','fpv-racing','sports'] },
      { id: 'surfing',      label: 'Surfing',       fine: ['surfing'] },
      { id: 'skiing',       label: 'Skiing & Snow', fine: ['skiing'] },
    ]},
    { id: 'wildlife', label: 'Wildlife', icon: 'wildlife', children: [
      { id: 'safari',       label: 'Safari Big Game', fine: ['wildlife-safari','wildlife'] },
    ]},
    { id: 'industry', label: 'Industry & Energy', icon: 'industry', children: [
      { id: 'wind-farm',    label: 'Wind Farms',  fine: ['wind-farm'] },
      { id: 'solar-farm',   label: 'Solar Farms', fine: ['solar-farm'] },
    ]},
    { id: 'warfare', label: 'Warfare & Defense', icon: 'warfare', children: [
      { id: 'ukraine-war',  label: 'Ukraine · Russia',   fine: ['war-ukraine','war-russia'] },
      { id: 'middle-east',  label: 'Middle East',        fine: ['war-mideast','war-israel','war-gaza','war-iran'] },
      { id: 'autonomous',   label: 'Autonomous Swarms',  fine: ['war-swarm','war-autonomous'] },
      { id: 'counter-uav',  label: 'Counter-UAV',        fine: ['war-counter'] },
      { id: 'platforms',    label: 'Platforms (MQ-9/Bayraktar/Shahed)', fine: ['war-platform'] },
    ]},
    { id: 'ai', label: 'AI Generated', icon: 'ai', children: [
      { id: 'ai-aerial',    label: 'AI Aerial',          fine: ['ai-aerial'] },
    ]},
  ],
};

function homeParseHierarchy(raw) {
  if (!raw) return HOME_DEFAULT_HIERARCHY;
  if (typeof raw === 'object' && raw.groups) return raw;
  try { const p = JSON.parse(raw); return p?.groups ? p : HOME_DEFAULT_HIERARCHY; }
  catch { return HOME_DEFAULT_HIERARCHY; }
}

export function HomeSidebar({ selected, onSelect, mapFilters, onToggleMapFilter, onClearMapFilters, totals, hierarchy, query, onQuery }) {
  const [expanded, setExpanded] = hUseState(() => new Set());
  // Default: groups collapsed — keeps sidebar within viewport without scrolling.
  const toggleGroup = (id) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const activeFilterCount = Object.values(mapFilters || {}).filter(Boolean).length;

  return (
    <aside style={{
      background: 'var(--forest-950)',
      borderRight: '1px solid var(--line)',
      padding: '14px 10px 20px',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 62px)',
    }}>
      <div style={{ padding: '4px 6px 10px' }}>
        <input
          value={query || ''}
          onChange={e => onQuery?.(e.target.value)}
          placeholder="Search clips / landmarks…"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 14,
            background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
            color: 'var(--bone)', borderRadius: 999, outline: 'none',
          }}/>
      </div>
      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', padding: '6px 10px 8px' }}>BROWSE BY THEME</div>

      <button
        onClick={() => onSelect(null)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 12px', marginBottom: 8,
          background: !selected ? 'var(--bone)' : 'transparent',
          color: !selected ? 'var(--ink)' : 'var(--parchment)',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          textAlign: 'left',
        }}>
        <span>All clips</span>
        <span style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{totals.total}</span>
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hierarchy.groups.map(group => {
          const open = expanded.has(group.id);
          const isActive = selected?.type === 'group' && selected.id === group.id;
          const groupCount = totals.groups[group.id] || 0;
          if (groupCount === 0) return null;
          return (
            <div key={group.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                <button onClick={() => toggleGroup(group.id)} style={{
                  flex: '0 0 auto', width: 22, height: 26,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--parchment-dim)', fontSize: 12,
                }}>{open ? '▾' : '▸'}</button>
                <button
                  onClick={() => onSelect({ type: 'group', id: group.id, fine: group.children.flatMap(c => c.fine || []) })}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 6, fontSize: 14, fontWeight: 700,
                    background: isActive ? 'var(--bone)' : 'transparent',
                    color: isActive ? 'var(--ink)' : 'var(--parchment)',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Ic[group.icon] && <span style={{ display: 'inline-flex' }}>{Ic[group.icon]()}</span>}
                    <span>{group.label}</span>
                  </span>
                  <span style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{groupCount}</span>
                </button>
              </div>
              {open && (
                <ul style={{ listStyle: 'none', padding: '0 0 0 24px', margin: '2px 0 0', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.children.map(child => {
                    const cnt = totals.children[group.id + '/' + child.id] || 0;
                    if (cnt === 0) return null;
                    const childActive = selected?.type === 'child' && selected.id === child.id && selected.groupId === group.id;
                    return (
                      <li key={child.id}>
                        <button
                          onClick={() => onSelect({ type: 'child', id: child.id, groupId: group.id, fine: child.fine || [] })}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '5px 10px', borderRadius: 6, fontSize: 14,
                            background: childActive ? 'var(--bone)' : 'transparent',
                            color: childActive ? 'var(--ink)' : 'var(--parchment)',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}>
                          <span>{child.label}</span>
                          <span style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{cnt}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Map filters section */}
      <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', padding: '0 10px 8px' }}>MAP FILTERS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 6px' }}>
          {[
            ['free',      'Free only'],
            ['paid',      'Paid clips'],
            ['pilot',     'Pilot uploads only'],
            ['commercial','Commercial license'],
            ['extended',  'Extended license'],
            ['exclusive', 'Exclusive (1 buyer)'],
            ['uhd',       '4K+'],
            ['recent',    'Last 30 days'],
            ['featured',  "Editor's picks"],
          ].map(([k, label]) => (
            <label key={k} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
              background: mapFilters[k] ? 'var(--forest-800)' : 'transparent',
              fontSize: 14,
            }}>
              <input
                type="checkbox"
                checked={!!mapFilters[k]}
                onChange={() => onToggleMapFilter(k)}
                style={{ width: 14, height: 14, accentColor: 'var(--lichen)' }}/>
              <span>{label}</span>
            </label>
          ))}
          {activeFilterCount > 0 && (
            <button onClick={onClearMapFilters} style={{
              padding: '6px 10px', fontSize: 12, color: 'var(--sunset)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
            }}>CLEAR FILTERS</button>
          )}
        </div>
      </div>
    </aside>
  );
}


// ─── AI Aerial carousel ─ shows full set of AI clips when AI category is selected ─
function AIClipsRow({ onOpenVideo }) {
  const [clips, setClips] = hUseState([]);
  hUseEffect(() => {
    let cancel = false;
    const SUPA = 'https://eotsbncgkgewgbemaarp.supabase.co';
    const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_xUhKdbvFkBS5_iRHhHiY3A_aXh-PoQt';
    fetch(`${SUPA}/rest/v1/videos?select=id,title,thumb_url,youtube_id,youtube_channel,views,lat,lon,inferred_location_raw,duration_s&category=eq.ai-aerial&status=eq.published&order=views.desc.nullslast&limit=64`, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (!cancel) setClips(d || []); })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);
  if (!clips.length) return null;
  const mapped = clips.filter(v => v.lat != null && v.lon != null).length;
  const unmapped = clips.length - mapped;
  return (
    <section style={{ padding: '32px 28px 40px', maxWidth: 1760, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 6 }}>● AI GENERATED · {clips.length} CLIPS</div>
        <h2 style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Drone-style AI footage</h2>
        <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginTop: 4 }}>{mapped} mapped to real-world locations · {unmapped} fictional / no real coords</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {clips.map(v => {
          const yt = v.youtube_id;
          const thumb = v.thumb_url || (yt ? `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` : '');
          const onMap = v.lat != null && v.lon != null;
          const place = v.inferred_location_raw && (v.inferred_location_raw.value || v.inferred_location_raw.name);
          return (
            <button key={v.id} className="di-card" onClick={() => onOpenVideo && onOpenVideo({ ...v, youtubeId: v.youtube_id, youtubeChannel: v.youtube_channel, thumbUrl: v.thumb_url })} style={{
              display: 'flex', flexDirection: 'column', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', overflow: 'hidden',
            }}>
              <div style={{
                aspectRatio: '16/9', width: '100%',
                background: thumb ? `#0d1410 center/cover no-repeat url('${thumb.replace(/'/g, '%27')}')` : 'linear-gradient(135deg, #2a1f3d, #0d1410)',
                position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 8,
              }}>
                <span className="mono" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--amber)', fontSize: 10, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.08em', fontWeight: 700 }}>AI</span>
                <span className="mono" style={{ background: onMap ? 'rgba(204,0,0,0.85)' : 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.06em', fontWeight: 600 }}>{onMap ? (place || 'on map') : 'FICTIONAL'}</span>
              </div>
              <div style={{ padding: 12, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: 'var(--bone)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }}>{v.youtube_channel} · {(v.views || 0).toLocaleString()} views</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HomePage({ onOpenVideo, onNav }) {
  // DB videos: every published row with lat/lon becomes a map pin.
  const [dbVideos, setDbVideos] = hUseState([]);
  hUseEffect(() => {
    let cancelled = false;
    fetchVideos().then(v => { if (!cancelled) setDbVideos(v || []); });
    return () => { cancelled = true; };
  }, []);
  // Derive one 'location' per video (for Leaflet pin).
  const dbLocations = hUseMemo(() => {
    return (dbVideos || [])
      .filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lon))
      .map(v => ({
        id: v.youtubeId || v.id,
        name: v.title,
        country: (v.description || '').slice(0, 40) || '',
        category: v.category,
        lat: v.lat, lon: v.lon,
        videos: 1,
        featured: (v.qualityScore || 0) >= 8,
        source: v.source,
        video: v,
      }));
  }, [dbVideos]);
  const [selectedLoc, setSelectedLoc] = hUseState(null);
  const [selected, _setSelected] = hUseState(() => {
    try { return JSON.parse(sessionStorage.getItem('mapSelectedFilter') || 'null'); } catch { return null; }
  });
  const setSelected = hUseCallback((v) => {
    _setSelected(v);
    try { sessionStorage.setItem('mapSelectedFilter', JSON.stringify(v)); } catch {}
  }, []);
  const [searchQuery, setSearchQuery] = hUseState('');  // null | { type:'group', id, fine[] } | { type:'child', id, groupId, fine[] }
  const hierarchyRaw = useContent('explore.hierarchy', null);
  const hierarchy = hUseMemo(() => homeParseHierarchy(hierarchyRaw), [hierarchyRaw]);
  const selectedFineSet = hUseMemo(() => selected?.fine ? new Set(selected.fine) : null, [selected]);
  const [mapFilters, setMapFilters] = hUseState({ free: false, paid: false, pilot: false, commercial: false, extended: false, exclusive: false, uhd: false, recent: false, featured: false });
  // Sidebar counts reflect active filters (license/search) but NOT category selection,
  // because category is the dimension the sidebar lets users pick from.
  const totals = hUseMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesQuery = (v) => {
      if (!q) return true;
      return (v.title || '').toLowerCase().includes(q)
        || (v.description || '').toLowerCase().includes(q)
        || (v.creator?.name || '').toLowerCase().includes(q)
        || (v.creator?.handle || '').toLowerCase().includes(q)
        || (v.tags || []).some(t => String(t).toLowerCase().includes(q));
    };
    const matchesMapFilter = (v) => {
      if (mapFilters.free && !(Number(v.price || 0) === 0)) return false;
      if (mapFilters.paid && !(Number(v.price || 0) > 0)) return false;
      if (mapFilters.pilot && !(v.source && v.source !== 'youtube')) return false;
      if (mapFilters.commercial && !(Array.isArray(v.licenseTiers) && v.licenseTiers.includes('commercial'))) return false;
      if (mapFilters.extended && !(Array.isArray(v.licenseTiers) && v.licenseTiers.includes('extended'))) return false;
      if (mapFilters.exclusive && !(Array.isArray(v.licenseTiers) && v.licenseTiers.includes('exclusive'))) return false;
      if (mapFilters.uhd && !(/4K|8K|UHD/i.test(String(v.resolution || '')))) return false;
      if (mapFilters.recent) {
        const ts = v.published_at || v.publishedAt;
        if (!ts) return false;
        const ageMs = Date.now() - new Date(ts).getTime();
        if (ageMs > 30 * 24 * 60 * 60 * 1000) return false;
      }
      if (mapFilters.featured && !v.featured) return false;
      return true;
    };
    const visible = (dbVideos || []).filter(v => matchesQuery(v) && matchesMapFilter(v));
    const byFine = {};
    visible.forEach(v => {
      const fine = v.category;
      if (fine && fine !== 'drone') byFine[fine] = (byFine[fine] || 0) + 1;
    });
    const groups = {}, children = {};
    hierarchy.groups.forEach(g => {
      let s = 0;
      g.children.forEach(c => {
        const n = (c.fine || []).reduce((a, f) => a + (byFine[f] || 0), 0);
        children[g.id + '/' + c.id] = n; s += n;
      });
      groups[g.id] = s;
    });
    return { byFine, groups, children, total: visible.length };
  }, [dbVideos, hierarchy, mapFilters, searchQuery]);
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
      <div style={{
        display: 'grid', gridTemplateColumns: '260px 1fr',
        height: 'calc(100vh - 62px)', minHeight: 560,
      }} className="home-sidebar-grid">
        <HomeSidebar
          selected={selected}
          onSelect={setSelected}
          mapFilters={mapFilters}
          onToggleMapFilter={toggleFilter}
          onClearMapFilters={() => setMapFilters({ free: false, paid: false, pilot: false, commercial: false, extended: false, exclusive: false, uhd: false, recent: false, featured: false })}
          totals={totals}
          hierarchy={hierarchy}
          query={searchQuery}
          onQuery={setSearchQuery}
        />
        <div style={{ position: 'relative', minWidth: 0 }}>
          <MapHero selectedLoc={selectedLoc} onSelectLoc={handleSelect} selectedFineSet={selectedFineSet} mapFilters={mapFilters} searchQuery={searchQuery} locations={dbLocations} videos={dbVideos} onOpenVideo={onOpenVideo} onNav={onNav} />
        </div>
      </div>

      {selected?.id === 'ai' && <AIClipsRow onOpenVideo={onOpenVideo} />}

      <div ref={sheetRef}>
        {selectedLoc && <LocationSheet loc={selectedLoc} onOpenVideo={onOpenVideo} onClose={() => setSelectedLoc(null)} />}
      </div>

      {!selectedLoc && (
        <>
          <FeaturedRow
            eyebrow="● TRENDING THIS WEEK"
            title="What the world is watching"
            videos={(dbVideos.length ? dbVideos : (TRENDING || _MOCK_VIDEOS)).slice(0, 12)}
            onOpenVideo={onOpenVideo}
            accent="var(--sunset)"
          />

          {/* Featured landmarks strip */}
          <section style={{ padding: '40px 28px', maxWidth: 1760, margin: '0 auto' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>EDITOR'S ATLAS</div>
            <h2 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 18 }}>Landmarks worth the flight</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {(dbLocations.length ? dbLocations : _MOCK_LOCATIONS).filter(l => l.featured).concat((dbLocations.length ? dbLocations : _MOCK_LOCATIONS).filter(l => !l.featured).slice(0, 9)).slice(0, 12).map(loc => {
                // Resolve the underlying video — prefer loc.video (set by dbLocations) then search dbVideos
                const v = loc.video || (dbVideos || []).find(vv => {
                  const id = vv.youtubeId || vv.youtube_id || vv.id;
                  if (id && id === loc.id) return true;
                  if (vv.location_id && vv.location_id === loc.id) return true;
                  const vLat = Number(vv.lat || vv.shot_lat) || 0;
                  const vLon = Number(vv.lon || vv.shot_lon) || 0;
                  const lLat = Number(loc.lat) || 0, lLon = Number(loc.lon) || 0;
                  if (!vLat || !vLon || !lLat || !lLon) return false;
                  return Math.abs(vLat - lLat) < 0.3 && Math.abs(vLon - lLon) < 0.3;
                });
                // Thumbnail — try every common spelling, fall back to YouTube CDN
                const yt = v?.youtubeId || v?.youtube_id || v?.yt_id || v?.ytId;
                const thumb = v?.thumbUrl || v?.thumb_url || (yt && `https://i.ytimg.com/vi/${yt}/mqdefault.jpg`);
                // Clean location name — prefer parsed landmark name from inferred_location_raw,
                // fall back to title up to first separator (— | · :)
                const inferredName = v?.inferredLocationRaw?.name || v?.inferred_location_raw?.name;
                const titleLine = (loc.name || v?.title || '').split(/\s[—|·:|]\s/)[0].slice(0, 70);
                const displayName = inferredName || titleLine;
                const country = v?.country || (loc.country?.length > 0 && loc.country.length < 30 ? loc.country : null);
                const catLabel = (CATEGORIES.find(c => c.id === loc.category)?.label || (loc.category || '').replace(/-/g, ' ')).toUpperCase();
                return (
                  <button key={loc.id} className="di-card" onClick={() => { if (loc.video && onOpenVideo) onOpenVideo(loc.video); else handleSelect(loc); }} style={{
                    display: 'flex', flexDirection: 'column', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', overflow: 'hidden',
                  }}>
                    <div style={{
                      aspectRatio: '16/9', width: '100%',
                      background: thumb ? `#0d1410 center/cover no-repeat url('${thumb.replace(/'/g, "%27")}')` : thumbGradient(String(loc.id || loc.name || '').length * 7),
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
                      borderBottom: '1px solid rgba(26,40,32,0.10)', position: 'relative',
                    }}>
                      {!thumb && CAT_ICONS[loc.category] && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', opacity: 0.5 }}>
                          {CAT_ICONS[loc.category](42)}
                        </div>
                      )}
                      {v?.source === 'youtube' && (
                        <span className="mono" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(204,0,0,0.92)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.08em', fontWeight: 700 }}>▶ YOUTUBE</span>
                      )}
                    </div>
                    <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--amber)', fontWeight: 600 }}>{catLabel || 'AERIAL'}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--bone)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayName}</div>
                      <div style={{ fontSize: 13, color: 'var(--parchment-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                        <span>{country ? country : (v?.youtubeChannel || v?.youtube_channel || 'aerial clip')}</span>
                        <span style={{ color: 'var(--sunset)', fontWeight: 600 }}>{loc.videos || 1} clip{(loc.videos || 1) === 1 ? '' : 's'} →</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <FeaturedRow
            eyebrow="CINEMATIC · 4K+"
            title="Fresh from the flight deck"
            videos={(dbVideos.length ? dbVideos : _MOCK_VIDEOS).slice(4, 16)}
            onOpenVideo={onOpenVideo}
          />
        </>
      )}
    </>
  );
}

