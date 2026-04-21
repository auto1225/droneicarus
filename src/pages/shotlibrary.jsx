// pages/shotlibrary.jsx — curated by use-case
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS, thumbGradient } from '../data';
import { VideoCard } from '../components';

const USE_CASES = [
  { id: 'realestate', name: 'Real estate establishing', tag: 'REAL ESTATE', desc: 'Rooftops, long pulls, façade reveals. Rights cleared for broker MLS use.', clips: 4280, price: 14 },
  { id: 'wedding', name: 'Wedding B-roll', tag: 'WEDDING', desc: 'Venue reveals, reception approaches, vineyard & beach aisles.', clips: 1820, price: 9 },
  { id: 'music', name: 'Music video intros', tag: 'MUSIC', desc: 'Mood, motion, moody skies. Long clips for slow-build intros.', clips: 2140, price: 24 },
  { id: 'doc', name: 'Documentary establishing', tag: 'DOCUMENTARY', desc: 'Cities, terrain, history, context. Permit-verified for broadcast.', clips: 3960, price: 29 },
  { id: 'esg', name: 'ESG & sustainability', tag: 'SUSTAINABILITY', desc: 'Wind farms, reforestation, solar, rewilding, ocean cleanup.', clips: 940, price: 19 },
  { id: 'news', name: 'News & editorial', tag: 'NEWS', desc: 'Breaking locations, city aftermath, rapid turnaround.', clips: 2540, price: 32 },
  { id: 'sports', name: 'Sports & stadiums', tag: 'SPORTS', desc: 'Stadium approaches, training grounds, event-day crowds.', clips: 1060, price: 38 },
  { id: 'travel', name: 'Travel & tourism', tag: 'TRAVEL', desc: 'Destinations, landmarks, seasonal variations, golden hour.', clips: 6210, price: 12 },
  { id: 'fpv', name: 'FPV / cinewhoop chase', tag: 'FPV', desc: 'One-shot dives, gaps, interior-to-exterior reveals.', clips: 780, price: 49 },
  { id: 'corp', name: 'Corporate & industrial', tag: 'CORPORATE', desc: 'Data centers, ports, manufacturing, infrastructure.', clips: 1320, price: 26 },
  { id: 'season', name: 'Seasonal & weather', tag: 'WEATHER', desc: 'First snow, cherry blossom, monsoon, autumn color.', clips: 2190, price: 15 },
  { id: 'wildlife', name: 'Wildlife (distance-safe)', tag: 'WILDLIFE', desc: 'Bird\'s-eye herds, whales, migration. 150m+ altitude, no pursuit.', clips: 420, price: 34 },
];

export function ShotLibraryPage({ onNav, onOpenVideo }) {
  const videos = VIDEOS;

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '70px 28px 40px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>SHOT LIBRARY · BROWSE BY WHAT YOU'RE MAKING</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, letterSpacing: '-0.035em', lineHeight: 0.98, fontWeight: 600, marginBottom: 16, maxWidth: 900 }}>
            Not sure where to start? Start with the cut.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--parchment)', maxWidth: 620, lineHeight: 1.55 }}>
            Curated shot bundles by production use-case. Real estate reveals, music video intros, documentary establishing shots — picked by editors who actually cut these formats every day.
          </p>
        </div>
      </section>

      {/* Use-case grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {USE_CASES.map((u, i) => (
            <button key={u.id} onClick={() => {}} style={{ textAlign: 'left', padding: 24, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--forest-950)', position: 'relative' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--amber)', marginBottom: 12, fontWeight: 600 }}>{u.tag}</div>
              <h3 style={{ fontSize: 22, letterSpacing: '-0.01em', marginBottom: 8, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{u.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.55, marginBottom: 18, minHeight: 58 }}>{u.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line)', fontSize: 12 }}>
                <span style={{ color: 'var(--parchment-dim)' }}>{u.clips.toLocaleString()} clips</span>
                <span className="mono" style={{ color: 'var(--amber)' }}>from ${u.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Starter kits */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 28 }}>Starter kits · curator-picked</h2>
          <span style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Save 30% vs. buying individually</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
          {[
            { name: 'The 10-clip wedding venue reveal kit', count: 10, price: 89, save: 41, curator: 'by Marta L.', tag: 'WEDDING · BUYER FAV' },
            { name: 'Music video intro — mood kit', count: 8, price: 119, save: 73, curator: 'by Kenji R.', tag: 'MUSIC · 60 FPS+ ONLY' },
            { name: 'Documentary establish — world cities', count: 20, price: 249, save: 130, curator: 'by Adaeze O.', tag: 'DOCUMENTARY · BROADCAST LICENSED' },
            { name: 'ESG reel — sustainability evidence pack', count: 15, price: 149, save: 78, curator: 'by Priya S.', tag: 'ESG · SHOT-DATE VERIFIED' },
          ].map((k, i) => (
            <div key={k.name} style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', display: 'grid', gridTemplateColumns: '200px 1fr' }}>
              <div style={{ position: 'relative', background: thumbGradient(k.name.charCodeAt(0) + i) }}>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, padding: 2 }}>
                  {[0,1,2,3].map(j => <div key={j} style={{ background: thumbGradient(k.name.charCodeAt(0) + i + j + 2), opacity: 0.8 }}/>)}
                </div>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--amber)', marginBottom: 6 }}>{k.tag}</div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{k.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{k.count} clips · {k.curator}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--lichen)', letterSpacing: '0.1em' }}>SAVE ${k.save}</div>
                    <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)' }}>${k.price}</div>
                  </div>
                  <button className="btn" style={{ fontSize: 12 }}>License kit</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tiny gallery */}
        <div style={{ marginTop: 50 }}>
          <h2 style={{ fontSize: 24, marginBottom: 18 }}>What editors are using this week</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {videos.slice(0, 8).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}
          </div>
        </div>
      </section>
    </div>
  );
}

