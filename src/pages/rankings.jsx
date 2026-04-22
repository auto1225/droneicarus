// pages/rankings.jsx — Global leaderboard
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LOCATIONS, VIDEOS as _MOCK_VIDEOS, TRENDING, CREATORS, thumbGradient, STATS} from '../data';
import { fetchVideos } from '../db/videos';
import { useState as _us, useEffect as _ue } from 'react';
import { Ic, formatViews, FollowButton } from '../components';

export function RankingsPage({ onOpenVideo }) {
  const [tab, setTab] = React.useState('week');

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--sunset)' }}>● GLOBAL LEADERBOARD</div>
      <h1 style={{ fontSize: 52, letterSpacing: '-0.02em', marginBottom: 10 }}>The Icarus Top 100</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 640, marginBottom: 30 }}>
        Ranked by a composite of views, watch-time, licensing purchases, and pilot reputation. Updates hourly.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {[
          ['day', 'Today'],
          ['week', 'This week'],
          ['month', 'This month'],
          ['year', '2026'],
          ['all', 'All-time'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 16px',
            borderBottom: tab === id ? '2px solid var(--sunset)' : '2px solid transparent',
            color: tab === id ? 'var(--bone)' : 'var(--parchment-dim)',
            fontSize: 14, fontWeight: tab === id ? 600 : 400,
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 16, marginBottom: 40, alignItems: 'end' }}>
        {[TRENDING[1], TRENDING[0], TRENDING[2]].map((v, i) => {
          const realRank = [2, 1, 3][i];
          const podiumColor = realRank === 1 ? 'var(--amber)' : realRank === 2 ? 'var(--parchment-dim)' : 'var(--sunset)';
          return (
            <div key={v.id} onClick={() => onOpenVideo(v)} style={{
              cursor: 'pointer',
              paddingTop: realRank === 1 ? 0 : 40,
            }}>
              <div style={{
                position: 'relative',
                aspectRatio: '16/9',
                background: thumbGradient(parseInt(v.id.slice(1))),
                border: `2px solid ${podiumColor}`,
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 14,
              }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} viewBox="0 0 400 225" preserveAspectRatio="none">
                  <g stroke="rgba(245,237,224,0.4)" fill="none" strokeWidth="0.5">
                    {[...Array(8)].map((_, j) => (
                      <path key={j} d={`M0 ${30 + j*25} Q100 ${10 + j*25} 200 ${40 + j*25} T400 ${20 + j*25}`}/>
                    ))}
                  </g>
                </svg>
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  fontSize: realRank === 1 ? 72 : 56,
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  color: podiumColor, lineHeight: 1,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}>#{realRank}</div>
                <div style={{ position: 'absolute', bottom: 14, right: 14, padding: '3px 7px', background: 'rgba(13,20,16,0.9)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{v.duration}</div>
              </div>
              <div style={{ fontSize: realRank === 1 ? 18 : 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{v.title}</div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{v.creator.handle} · {formatViews(v.views)} views</div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1.2fr 2fr 1fr 1fr 120px 100px',
          padding: '14px 20px', background: 'var(--forest-900)',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--parchment-dim)', borderBottom: '1px solid var(--line)',
        }}>
          <span>RANK</span>
          <span>Δ</span>
          <span>CLIP</span>
          <span>LOCATION</span>
          <span>PILOT</span>
          <span style={{ textAlign: 'right' }}>VIEWS</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
        </div>
        {TRENDING.map((v, i) => {
          const loc = LOCATIONS.find(l => l.id === v.locationId);
          const delta = [(i % 3) - 1, (i * 7) % 11 - 4, 0, (i % 5) - 2][i % 4];
          const score = (98 - i * 2.3).toFixed(1);
          return (
            <div key={v.id} onClick={() => onOpenVideo(v)} style={{
              display: 'grid', gridTemplateColumns: '60px 1.2fr 2fr 1fr 1fr 120px 100px',
              padding: '16px 20px', borderBottom: i === TRENDING.length - 1 ? 'none' : '1px solid var(--line)',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-900)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: i < 3 ? 'var(--amber)' : 'var(--bone)' }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="mono" style={{ fontSize: 12, color: delta > 0 ? 'var(--lichen)' : delta < 0 ? 'var(--sunset)' : 'var(--parchment-dim)' }}>
                {delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '—'}
              </span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 80, aspectRatio: '16/9', background: thumbGradient(parseInt(v.id.slice(1))), borderRadius: 2, flexShrink: 0, border: '1px solid var(--line)' }}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v.duration} · {v.resolution} {v.price > 0 && <span style={{ color: 'var(--sunset)' }}>· ${v.price}</span>}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--parchment)' }}>{loc?.name}</span>
              <span style={{ fontSize: 13, color: 'var(--parchment)' }}>{v.creator.handle}</span>
              <span className="mono" style={{ textAlign: 'right', fontSize: 13 }}>{formatViews(v.views)}</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--amber)' }}>{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreatorsPage({ onOpenVideo }) {
  _us(); // keep imports used
  _ue(() => { fetchVideos({ limit: 500 }).then(v => { window.__rkDbVideos = v || []; }); }, []);
  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>PILOT COMMUNITY</div>
      <h1 style={{ fontSize: 52, marginBottom: 10 }}>Meet the pilots.</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 640, marginBottom: 40 }}>
        {STATS.projected.pilots.toLocaleString()} verified drone pilots in {STATS.projected.countries} countries. Follow your favorites, license their work, commission custom flights.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {CREATORS.map(c => {
          const theirVids = (window.__rkDbVideos && window.__rkDbVideos.length ? window.__rkDbVideos : _MOCK_VIDEOS).filter(v => v.creator?.handle === c.handle).slice(0, 3);
          return (
            <div key={c.handle} style={{ padding: 24, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, border: '1px solid var(--line-strong)' }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.name}
                    {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>{c.handle} · {c.region}</div>
                </div>
                <FollowButton creatorId={c.id || c.handle} creatorHandle={c.handle} className="btn" style={{ fontSize: 12, padding: '8px 14px' }} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>Followers</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{formatViews(c.followers)}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>Clips</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{c.videos}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>YTD Earnings</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)' }}>${c.earning.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {theirVids.map(v => (
                  <div key={v.id} onClick={() => onOpenVideo(v)} style={{ cursor: 'pointer', aspectRatio: '16/9', background: thumbGradient(parseInt(v.id.slice(1))), borderRadius: 2, position: 'relative', border: '1px solid var(--line)' }}>
                    {v.price > 0 && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 10, padding: '1px 4px', background: 'var(--sunset)', fontFamily: 'var(--font-mono)', borderRadius: 2 }}>${v.price}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

