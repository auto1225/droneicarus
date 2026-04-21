// pages/explore.jsx — Category explore page + Search results
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, LOCATIONS, VIDEOS, CREATORS } from '../data';
import { Ic, formatViews, CategoryChips, VideoCard } from '../components';

export function ExplorePage({ onOpenVideo, onNav }) {
  const [active, setActive] = React.useState('all');
  const vids = active === 'all' ? VIDEOS : VIDEOS.filter(v => v.category === active);

  // Category cells
  const catStats = CATEGORIES.slice(1).map(c => ({
    ...c,
    count: VIDEOS.filter(v => v.category === c.id).length,
  }));

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>BROWSE BY THEME</div>
      <h1 style={{ fontSize: 52, letterSpacing: '-0.02em', marginBottom: 10 }}>Every sky has a name.</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 640, marginBottom: 40 }}>
        Browse footage by what's in the frame — glaciers, racetracks, conflict zones, coral reefs.
        Our taxonomy spans {CATEGORIES.length - 1} themes and counting.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 50 }}>
        {catStats.map(c => (
          <button key={c.id} onClick={() => setActive(c.id)} style={{
            position: 'relative',
            padding: 24,
            background: active === c.id ? 'var(--forest-800)' : 'var(--forest-900)',
            border: '1px solid ' + (active === c.id ? 'var(--amber)' : 'var(--line)'),
            borderRadius: 4, textAlign: 'left',
            minHeight: 140,
            transition: 'all 0.15s',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 120, color: 'var(--forest-800)', fontFamily: 'var(--font-mono)', opacity: active === c.id ? 0.35 : 0.2 }}>{c.icon}</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 10 }}>{String(catStats.indexOf(c) + 1).padStart(2, '0')}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em' }}>{c.label}</div>
            <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>{c.count} clips</div>
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <CategoryChips active={active} onChange={setActive} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '24px 28px 18px' }}>
          <h2 style={{ fontSize: 24 }}>{CATEGORIES.find(c => c.id === active)?.label} · <span className="mono" style={{ color: 'var(--parchment-dim)', fontWeight: 400 }}>{vids.length} clips</span></h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Trending', 'Newest', 'Highest rated', 'Free first'].map((s, i) => (
              <button key={s} className={'chip' + (i === 0 ? ' active' : '')} style={{ padding: '6px 12px', fontSize: 12 }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {vids.slice(0, 20).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} />)}
        </div>
      </div>
    </div>
  );
}

export function SearchPage({ query, onOpenVideo, onNav, onSelectLoc }) {
  const q = (query || '').toLowerCase().trim();
  const matchedLocs = LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
  );
  const matchedVideos = VIDEOS.filter(v =>
    v.title.toLowerCase().includes(q) ||
    v.creator.name.toLowerCase().includes(q) ||
    v.creator.handle.toLowerCase().includes(q) ||
    v.category.toLowerCase().includes(q)
  );
  const matchedCreators = CREATORS.filter(c =>
    c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
  );

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>SEARCH RESULTS</div>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>"{query}"</h1>
      <p style={{ color: 'var(--parchment-dim)', fontSize: 14, marginBottom: 40 }}>
        {matchedLocs.length} landmarks · {matchedVideos.length} clips · {matchedCreators.length} pilots
      </p>

      {matchedLocs.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>Landmarks</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {matchedLocs.map(loc => (
              <button key={loc.id} onClick={() => { onSelectLoc(loc); onNav('home'); }} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)',
                borderRadius: 4, textAlign: 'left',
              }}>
                <span style={{ color: 'var(--amber)' }}><Ic.pin/></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{loc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{loc.country} · {loc.videos} clips</div>
                </div>
                <span style={{ color: 'var(--parchment-dim)' }}><Ic.chevron/></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {matchedVideos.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>Clips</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {matchedVideos.slice(0, 12).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} />)}
          </div>
        </section>
      )}

      {matchedCreators.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>Pilots</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {matchedCreators.map(c => (
              <div key={c.handle} style={{ padding: 16, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--line-strong)' }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.name}
                    {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{c.handle} · {formatViews(c.followers)} followers</div>
                </div>
                <button className="btn secondary" style={{ fontSize: 12 }}>Follow</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {matchedLocs.length + matchedVideos.length + matchedCreators.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.4 }}>◎</div>
          No matches for "{query}". Try "pyramid", "namsan", or a category like "mountain".
        </div>
      )}
    </div>
  );
}

