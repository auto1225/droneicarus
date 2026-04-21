// pages/flightlog.jsx — per-clip flight metadata sheet
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LOCATIONS, VIDEOS } from '../data';

export function FlightLogPage({ videoId, onNav }) {
  const v = VIDEOS.find(x => x.id === videoId) || VIDEOS[0];
  const loc = LOCATIONS.find(l => l.id === v.locationId) || LOCATIONS[0];

  // Synthesize flight stats deterministically from id
  const seed = v.id.charCodeAt(1) || 5;
  const alt = 60 + (seed * 7) % 80;
  const duration = 4 + (seed % 6);
  const wind = 6 + (seed % 12);
  const temp = 8 + (seed % 20);

  const waypoints = Array.from({ length: 28 }, (_, i) => ({
    t: i * (duration * 60 / 28),
    x: 80 + Math.sin(i * 0.4 + seed) * 60 + i * 18,
    y: 160 + Math.cos(i * 0.3 + seed) * 40 - i * 2,
    alt: alt + Math.sin(i * 0.5) * 20,
  }));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 80px' }}>
      <button onClick={() => onNav('watch', v.id)} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 18 }}>← Back to clip</button>

      <div className="eyebrow" style={{ marginBottom: 8 }}>FLIGHT LOG · {v.id.toUpperCase()} · CHAIN-OF-CUSTODY VERIFIED</div>
      <h1 style={{ fontSize: 42, letterSpacing: '-0.02em', marginBottom: 6 }}>{v.title}</h1>
      <div style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 30 }}>
        {loc.name} · {loc.country} · flown by <button onClick={() => onNav('profile', v.creator.handle.replace('@',''))} style={{ color: 'var(--sunset)' }}>{v.creator.name}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 30 }}>
        {/* Track + chart */}
        <div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>FLIGHT TRACK · GPS ACCURACY ±0.8 M</div>
              <button style={{ fontSize: 11, color: 'var(--sunset)' }} data-placeholder="true">Download GPX →</button>
            </div>
            <svg viewBox="0 0 520 300" style={{ width: '100%', height: 320, background: 'var(--forest-900)', display: 'block' }}>
              {/* Topo lines */}
              <g stroke="var(--line)" fill="none" strokeWidth="0.5">
                {[...Array(10)].map((_, i) => <path key={i} d={`M0 ${30*i+20} Q130 ${30*i} 260 ${30*i+20} T520 ${30*i-5}`}/>)}
              </g>
              {/* Path */}
              <polyline fill="none" stroke="var(--sunset)" strokeWidth="2.5" strokeLinecap="round" points={waypoints.map(w => `${w.x},${w.y}`).join(' ')}/>
              {/* Take-off */}
              <circle cx={waypoints[0].x} cy={waypoints[0].y} r="7" fill="var(--amber)" stroke="#1a2820" strokeWidth="2"/>
              <text x={waypoints[0].x + 12} y={waypoints[0].y + 4} fontSize="10" fill="var(--bone)" fontFamily="var(--font-mono)">T/O</text>
              {/* Landing */}
              <circle cx={waypoints[waypoints.length-1].x} cy={waypoints[waypoints.length-1].y} r="7" fill="var(--lichen)" stroke="#1a2820" strokeWidth="2"/>
              <text x={waypoints[waypoints.length-1].x + 12} y={waypoints[waypoints.length-1].y + 4} fontSize="10" fill="var(--bone)" fontFamily="var(--font-mono)">LAND</text>
              {/* North arrow */}
              <g transform="translate(480, 30)">
                <circle r="18" fill="var(--forest-800)" stroke="var(--line-strong)"/>
                <path d="M0 -12 L4 4 L0 0 L-4 4 Z" fill="var(--sunset)"/>
                <text y="24" textAnchor="middle" fontSize="9" fill="var(--parchment-dim)" fontFamily="var(--font-mono)">N</text>
              </g>
            </svg>

            {/* Altitude profile */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 10 }}>ALTITUDE PROFILE (M AGL)</div>
              <svg viewBox="0 0 520 80" style={{ width: '100%', height: 80 }}>
                <polyline fill="rgba(217,112,69,0.18)" stroke="var(--sunset)" strokeWidth="1.5"
                  points={`0,80 ${waypoints.map((w, i) => `${(i/(waypoints.length-1))*520},${80 - (w.alt/120)*70}`).join(' ')} 520,80`}/>
                <line x1="0" y1="13" x2="520" y2="13" stroke="var(--amber)" strokeWidth="0.5" strokeDasharray="4 3"/>
                <text x="6" y="11" fontSize="9" fill="var(--amber)" fontFamily="var(--font-mono)">120m · LEGAL CEILING</text>
              </svg>
            </div>
          </div>

          {/* Chain of custody */}
          <div style={{ marginTop: 22, border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>CHAIN OF CUSTODY</div>
            </div>
            {[
              ['T+00:00', 'Take-off · N37.5512 E126.9882 · battery 98%'],
              ['T+02:14', 'Entered active record · D-Log M, 5.1K / 50 fps'],
              ['T+' + String(duration).padStart(2,'0') + ':38', 'Landing · battery 34% · all waypoints nominal'],
              ['+7 min', 'Clip offloaded to secure NVMe · SHA-256 hashed'],
              ['+12 min', 'Uploaded to Drone Icarus · signed by pilot key'],
              ['+1h 20m', 'Passed automated airspace audit · KCAA permit matched'],
              ['+2h', 'Published · immutable metadata committed'],
            ].map(([t, e], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 20px', padding: '11px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: 12, alignItems: 'center' }}>
                <span className="mono" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>{t}</span>
                <span style={{ color: 'var(--parchment)' }}>{e}</span>
                <span style={{ color: 'var(--lichen)' }}>✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats rail */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StatBlock
            title="Flight envelope"
            rows={[
              ['Max altitude', alt + ' m AGL'],
              ['Distance flown', (1.2 + seed * 0.08).toFixed(2) + ' km'],
              ['Duration', duration + ':38'],
              ['Avg speed', (5 + seed % 4) + ' m/s'],
              ['Max speed', (11 + seed % 6) + ' m/s'],
              ['Return trigger', 'Manual RTH'],
            ]}
          />

          <StatBlock
            title="Weather at time of shoot"
            rows={[
              ['Wind', wind + ' km/h · NW 305°'],
              ['Gust peak', (wind + 4) + ' km/h'],
              ['Visibility', '14.3 km'],
              ['Temperature', temp + '° C'],
              ['Pressure', '1013 hPa'],
              ['Cloud ceiling', '2100 ft'],
              ['Light', 'Golden hour · EV 8.2'],
            ]}
          />

          <StatBlock
            title="Aircraft"
            rows={[
              ['Model', 'DJI Mavic 3 Pro Cine'],
              ['Serial', '1W7Z-J···-' + seed + '412'],
              ['Firmware', 'v01.02.0300'],
              ['Sensor', '4/3 CMOS Hasselblad'],
              ['Codec', 'ProRes 422 HQ'],
              ['Color', 'D-Log M'],
            ]}
          />

          <StatBlock
            title="Permits & airspace"
            rows={[
              ['CAA class', 'G · uncontrolled'],
              ['Operator', 'KCAA Commercial #21-887'],
              ['Remote pilot', 'FAA Part 107 · Korean Type-2'],
              ['Permit ref', 'YS-2026-0418-NAM'],
              ['Insurance', '$2M public liability'],
            ]}
            accent
          />
        </aside>
      </div>

      <div style={{ marginTop: 40, padding: 22, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>WHY THIS MATTERS</div>
          <p style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.6, margin: 0 }}>
            Every clip on Drone Icarus ships with its flight log. Editors get provenance, broadcasters get compliance, and you get proof that what you licensed was flown legally and really captured where it says it was.
          </p>
        </div>
        <button className="btn" style={{ fontSize: 13, whiteSpace: 'nowrap' }} data-placeholder="true">Verify this log →</button>
      </div>
    </div>
  );
}

function StatBlock({ title, rows, accent }) {
  return (
    <div style={{ border: '1px solid ' + (accent ? 'var(--amber)' : 'var(--line)'), borderRadius: 4, background: accent ? 'rgba(232,176,74,0.04)' : 'transparent' }}>
      <div className="eyebrow" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', color: accent ? 'var(--amber)' : 'var(--parchment-dim)' }}>{title}</div>
      {rows.map(([k, v], i) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: '9px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: 12 }}>
          <span className="mono" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.06em', fontSize: 10, textTransform: 'uppercase' }}>{k}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

