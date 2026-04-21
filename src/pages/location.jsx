// pages/location.jsx — deep-dive page for a landmark
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LOCATIONS, VIDEOS, thumbGradient } from '../data';
import { VideoCard } from '../components';

export function LocationPage({ id, onOpenVideo, onNav }) {
  const loc = LOCATIONS.find(l => l.id === id) || LOCATIONS[0];
  const vids = VIDEOS.filter(v => v.locationId === loc.id);
  const display = vids.length ? vids : VIDEOS.slice(0, 12);

  return (
    <div>
      {/* Parallax-style hero */}
      <header style={{ position: 'relative', height: 560, overflow: 'hidden', background: thumbGradient(loc.id.charCodeAt(0)), borderBottom: '1px solid var(--line)' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 1600 560" preserveAspectRatio="xMidYMid slice">
          <g stroke="rgba(245,237,224,0.7)" fill="none" strokeWidth="0.5">
            {[...Array(28)].map((_, i) => <path key={i} d={`M0 ${20*i} Q400 ${20*i-10} 800 ${20*i+10} T1600 ${20*i-5}`}/>)}
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,20,16,0) 30%, rgba(13,20,16,0.9) 100%)' }}/>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1200, padding: '0 28px', color: '#f5ede0' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#e8b04a', marginBottom: 12 }}>
            {loc.country.toUpperCase()} · {loc.lat.toFixed(4)}° N · {loc.lon.toFixed(4)}° E
          </div>
          <h1 style={{ fontSize: 84, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 0.96, marginBottom: 14, color: '#f5ede0' }}>
            {loc.name.split(' — ')[0]}
          </h1>
          <p style={{ fontSize: 17, opacity: 0.9, maxWidth: 560, lineHeight: 1.5, color: '#f5ede0' }}>
            {loc.name.includes('—') ? loc.name.split(' — ')[1] + '. ' : ''}{display.length} clips from {new Set(display.map(v => v.creator.name)).size} pilots, ranging from 2022 to last week.
          </p>
        </div>

        <div style={{ position: 'absolute', top: 20, left: 28, display: 'flex', gap: 8 }}>
          <button onClick={() => onNav('home')} style={{ padding: '6px 12px', background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: 2 }}>← MAP</button>
        </div>
      </header>

      {/* Sticky summary bar */}
      <div style={{ position: 'sticky', top: 62, zIndex: 50, background: 'var(--surface-glass)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['Clips', display.length], ['Pilots', new Set(display.map(v => v.creator.name)).size], ['Best time', 'Apr–Oct'], ['Permits', 'Required']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.1em' }}>{k.toUpperCase()}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" style={{ fontSize: 12 }}>Save location</button>
            <button onClick={() => onNav('commission')} className="btn" style={{ fontSize: 12 }}>Commission a shot here</button>
          </div>
        </div>
      </div>

      {/* Body: two columns */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '50px 28px', display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 50 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>DISPATCH</div>
          <h2 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 18, fontFamily: 'var(--font-display)' }}>How to fly here, without making trouble.</h2>
          <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--parchment)' }}>
            <p style={{ marginBottom: 16 }}>{loc.name.split(' — ')[0]} sits in a controlled zone — civil airspace class G in the open area, but the core structures are permit-only. The local authority processes requests within 10 business days. Our verified pilots file through the Drone Icarus permit assistant and it usually comes back in 72 hours.</p>
            <p style={{ marginBottom: 16 }}>Mornings are best. The prevailing wind shifts onshore around 10:30 and the light flattens out. Summer haze reduces effective visibility from November through February — consider a polarizer.</p>
            <p>Do not fly over gathered people. There is a no-fly bubble during major holidays (check calendar). The ranger station on the north approach has a volunteer who answers questions — bring them coffee.</p>
          </div>

          {/* Dispatch facts grid */}
          <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
            {[
              ['ALTITUDE LIMIT', '120 m AGL'],
              ['MIN. DISTANCE', '50 m from visitors'],
              ['AIRSPACE CLASS', 'G (below 150m)'],
              ['SEASON', 'Apr – Oct best'],
              ['PERMIT TURNAROUND', '72h (verified)'],
              ['TYPICAL WIND', '8–14 km/h'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--ink)', padding: '16px 18px' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.14em', marginBottom: 6 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="eyebrow" style={{ marginBottom: 10 }}>ON THE GROUND</div>
          <div style={{ aspectRatio: '4/3', background: thumbGradient(loc.id.charCodeAt(1) + 3), borderRadius: 3, marginBottom: 10 }}/>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--parchment-dim)', marginBottom: 22 }}>Approach road from the south side, as of last week.</div>

          <div className="eyebrow" style={{ marginBottom: 10 }}>FIRST-LIGHT · NEXT 7 DAYS</div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 3 }}>
            {['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24', 'Fri 25', 'Sat 26', 'Sun 27'].map((d, i) => (
              <div key={d} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', padding: '9px 14px', borderTop: i > 0 ? '1px solid var(--line)' : 'none', fontSize: 12, alignItems: 'center' }}>
                <span className="mono">{d}</span>
                <span style={{ color: 'var(--parchment-dim)' }}>{['Clear', 'Fog AM', 'Clear', 'Cloudy', 'Clear', 'Wind 18', 'Clear'][i]}</span>
                <span className="mono" style={{ textAlign: 'right', color: 'var(--amber)' }}>{['5:41','5:40','5:39','5:38','5:38','5:37','5:36'][i]}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Clips grid */}
      <section style={{ borderTop: '1px solid var(--line)', padding: '50px 28px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>CATALOG</div>
              <h2 style={{ fontSize: 28 }}>{display.length} clips at this location</h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="chip active" style={{ fontSize: 11 }}>All</button>
              <button className="chip" style={{ fontSize: 11 }}>Dawn</button>
              <button className="chip" style={{ fontSize: 11 }}>Free</button>
              <button className="chip" style={{ fontSize: 11 }}>4K+</button>
              <button className="chip" style={{ fontSize: 11 }}>Commercial license</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {display.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}
          </div>
        </div>
      </section>
    </div>
  );
}

