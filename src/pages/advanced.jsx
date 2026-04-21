// pages/advanced.jsx — Advanced search with faceted filters (like Shutterstock/iStock)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS } from '../data';
import { Ic, VideoCard } from '../components';

const DRONE_MODELS = ['DJI Mavic 3 Pro', 'DJI Inspire 3', 'DJI Avata 2', 'DJI Mini 4 Pro', 'Autel Evo II', 'Skydio 2+', 'FPV custom'];
const CODECS = ['ProRes 422 HQ', 'H.265 · 10-bit', 'H.264 · 8-bit', 'RAW / BRAW'];
const TIMES_OF_DAY = ['Blue hour', 'Sunrise', 'Morning', 'Midday', 'Golden hour', 'Sunset', 'Twilight', 'Night'];
const WEATHER = ['Clear', 'Overcast', 'Fog / mist', 'Storm', 'Snow', 'Rain'];
const FLIGHT_TYPES = ['Static hover', 'Reveal', 'Orbit', 'Pull-back', 'Fly-over', 'Chase / FPV', 'Top-down'];

export function AdvancedPage({ onOpenVideo, onNav }) {
  const [filters, setFilters] = React.useState({
    resolution: '4K+',
    fps: 'any',
    license: 'any',
    codec: [],
    time: [],
    weather: [],
    flight: [],
    drone: [],
    priceMax: 200,
    durationMin: 0,
    releaseModel: 'any',
    verified: true,
  });

  const toggle = (key, val) => {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  };

  const results = VIDEOS.filter(v => {
    if (filters.priceMax < 200 && v.price > filters.priceMax) return false;
    return true;
  });

  const FacetGroup = ({ title, options, selected, onToggle }) => (
    <div style={{ marginBottom: 22 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onToggle(opt)} style={{
            padding: '5px 10px', fontSize: 11,
            border: '1px solid ' + (selected.includes(opt) ? 'var(--amber)' : 'var(--line)'),
            background: selected.includes(opt) ? 'rgba(232,176,74,0.12)' : 'transparent',
            color: selected.includes(opt) ? 'var(--amber)' : 'var(--parchment)',
            borderRadius: 2, letterSpacing: '0.01em',
          }}>{opt}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, maxWidth: 1760, margin: '0 auto' }}>
      {/* Sidebar filters */}
      <aside style={{ padding: '28px 22px', borderRight: '1px solid var(--line)', position: 'sticky', top: 65, alignSelf: 'start', maxHeight: 'calc(100vh - 65px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div className="eyebrow">FILTERS</div>
          <button onClick={() => setFilters({ resolution:'4K+', fps:'any', license:'any', codec:[], time:[], weather:[], flight:[], drone:[], priceMax:200, durationMin:0, releaseModel:'any', verified:true })} style={{ fontSize: 11, color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Reset</button>
        </div>

        {/* Resolution */}
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, marginBottom: 10 }}>RESOLUTION</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['HD','4K','4K+','5K+','8K'].map(r => (
              <button key={r} onClick={() => setFilters(f => ({...f, resolution: r}))} style={{
                flex: 1, padding: '7px 0', fontSize: 11,
                border: '1px solid ' + (filters.resolution === r ? 'var(--amber)' : 'var(--line)'),
                background: filters.resolution === r ? 'rgba(232,176,74,0.12)' : 'transparent',
                color: filters.resolution === r ? 'var(--amber)' : 'var(--parchment)',
                borderRadius: 2,
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* FPS */}
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, marginBottom: 10 }}>FRAME RATE</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['any','24','30','60','120','240'].map(r => (
              <button key={r} onClick={() => setFilters(f => ({...f, fps: r}))} style={{
                padding: '6px 10px', fontSize: 11,
                border: '1px solid ' + (filters.fps === r ? 'var(--amber)' : 'var(--line)'),
                background: filters.fps === r ? 'rgba(232,176,74,0.12)' : 'transparent',
                color: filters.fps === r ? 'var(--amber)' : 'var(--parchment)',
                borderRadius: 2,
              }}>{r === 'any' ? 'Any' : r + ' fps'}</button>
            ))}
          </div>
        </div>

        {/* License tier */}
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, marginBottom: 10 }}>LICENSE TIER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['any','Any'],
              ['free','Free · CC-BY'],
              ['personal','Personal'],
              ['commercial','Commercial'],
              ['extended','Extended / broadcast'],
              ['exclusive','Exclusive available'],
            ].map(([k,v]) => (
              <button key={k} onClick={() => setFilters(f => ({...f, license: k}))} style={{
                textAlign: 'left', padding: '7px 10px', fontSize: 12,
                border: '1px solid ' + (filters.license === k ? 'var(--amber)' : 'var(--line)'),
                background: filters.license === k ? 'rgba(232,176,74,0.12)' : 'transparent',
                color: filters.license === k ? 'var(--amber)' : 'var(--parchment)',
                borderRadius: 2, display: 'flex', justifyContent: 'space-between',
              }}>{v}{filters.license === k && <span><Ic.check/></span>}</button>
            ))}
          </div>
        </div>

        {/* Price max */}
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>MAX PRICE</span>
            <span style={{ color: 'var(--amber)' }}>{filters.priceMax >= 200 ? '$200+' : '$' + filters.priceMax}</span>
          </div>
          <input type="range" min="0" max="200" step="5" value={filters.priceMax} onChange={e => setFilters(f => ({...f, priceMax: +e.target.value}))} style={{ width: '100%', accentColor: 'var(--amber)' }}/>
        </div>

        <FacetGroup title="Codec" options={CODECS} selected={filters.codec} onToggle={v => toggle('codec', v)}/>
        <FacetGroup title="Time of day" options={TIMES_OF_DAY} selected={filters.time} onToggle={v => toggle('time', v)}/>
        <FacetGroup title="Weather" options={WEATHER} selected={filters.weather} onToggle={v => toggle('weather', v)}/>
        <FacetGroup title="Flight type" options={FLIGHT_TYPES} selected={filters.flight} onToggle={v => toggle('flight', v)}/>
        <FacetGroup title="Drone model" options={DRONE_MODELS} selected={filters.drone} onToggle={v => toggle('drone', v)}/>

        {/* Release model */}
        <div style={{ marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', fontWeight: 600, marginBottom: 10 }}>MODEL / PROPERTY RELEASE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['any','Any'],
              ['none','No releases needed (no people/property)'],
              ['editorial','Editorial only'],
              ['model','Model release on file'],
              ['property','Property release on file'],
              ['both','Both releases'],
            ].map(([k,v]) => (
              <button key={k} onClick={() => setFilters(f => ({...f, releaseModel: k}))} style={{
                textAlign: 'left', padding: '6px 10px', fontSize: 11,
                border: '1px solid ' + (filters.releaseModel === k ? 'var(--amber)' : 'var(--line)'),
                background: filters.releaseModel === k ? 'rgba(232,176,74,0.12)' : 'transparent',
                color: filters.releaseModel === k ? 'var(--amber)' : 'var(--parchment)',
                borderRadius: 2,
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Verified */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 3, cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.verified} onChange={e => setFilters(f => ({...f, verified: e.target.checked}))} style={{ accentColor: 'var(--amber)' }}/>
          <span>Only flight-log verified clips</span>
        </label>
      </aside>

      {/* Main results */}
      <main style={{ padding: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>ADVANCED SEARCH</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: '-0.025em', fontWeight: 600 }}>
            {results.length.toLocaleString()} clips match your filters.
          </h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Relevance','Newest','Price ↑','Price ↓','Best rated'].map((s, i) => (
              <button key={s} className={'chip' + (i === 0 ? ' active' : '')} style={{ padding: '6px 12px', fontSize: 12 }} data-placeholder="true">{s}</button>
            ))}
          </div>
        </div>

        {/* Active filter summary */}
        {(filters.codec.length + filters.time.length + filters.weather.length + filters.flight.length + filters.drone.length > 0 || filters.license !== 'any' || filters.fps !== 'any') && (
          <div style={{ padding: 12, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 3, marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginRight: 6 }}>ACTIVE:</span>
            {filters.resolution !== 'any' && <span className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--forest-800)', borderRadius: 2, border: '1px solid var(--line)' }}>{filters.resolution}</span>}
            {filters.fps !== 'any' && <span className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--forest-800)', borderRadius: 2, border: '1px solid var(--line)' }}>{filters.fps} fps</span>}
            {filters.license !== 'any' && <span className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--forest-800)', borderRadius: 2, border: '1px solid var(--line)' }}>{filters.license}</span>}
            {[...filters.codec, ...filters.time, ...filters.weather, ...filters.flight, ...filters.drone].map(v => (
              <span key={v} className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--forest-800)', borderRadius: 2, border: '1px solid var(--line)' }}>{v}</span>
            ))}
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {results.slice(0, 24).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}
        </div>
      </main>
    </div>
  );
}

