// pages/collection.jsx — public collection page (magazine-style)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS, thumbGradient, CURRENT_USER, COLLECTIONS } from '../data';
import { VideoCard } from '../components';

export function CollectionPage({ id, onOpenVideo, onNav }) {
  const col = COLLECTIONS.find(c => c.id === id) || COLLECTIONS[0];
  const videos = (col.cover || []).map(vid => VIDEOS.find(v => v.id === vid)).filter(Boolean);
  while (videos.length < 12) videos.push(VIDEOS[(videos.length * 5) % VIDEOS.length]);
  const author = CURRENT_USER;

  return (
    <div>
      {/* Magazine hero */}
      <header style={{ borderBottom: '1px solid var(--line)', padding: '70px 28px 50px', position: 'relative', overflow: 'hidden', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 50, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--sunset)' }}>A COLLECTION · CURATED FOR YOU</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 76, lineHeight: 0.95, letterSpacing: '-0.035em', fontWeight: 500, marginBottom: 18, color: 'var(--bone)' }}>
              {col.name}.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--parchment)', marginBottom: 24, fontStyle: 'italic', maxWidth: 460 }}>
              "{col.name === 'Dawn & Gold' ? 'Twenty-eight mornings, fourteen countries. What I learned is that dawn is a negotiation — the light arrives, you arrive, and you hope the weather shows up too.' : 'A quiet board. Things I keep coming back to. Nothing here is urgent, which is exactly why I keep it.'}"
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sunset)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{author.initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{author.name}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{author.handle} · updated {col.updated}</div>
              </div>
              <div style={{ width: 1, height: 30, background: 'var(--line)', margin: '0 4px' }}/>
              <button className="btn" style={{ fontSize: 14 }} data-placeholder="true">Follow collection</button>
              <button style={{ fontSize: 14, color: 'var(--parchment-dim)' }} data-placeholder="true">Share</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '110px 110px 110px', gap: 5, height: 340 }}>
            {videos.slice(0, 9).map((v, i) => (
              <div key={v.id + i} style={{ background: thumbGradient(v.id.charCodeAt(1) + i), borderRadius: 3 }}/>
            ))}
          </div>
        </div>
      </header>

      {/* Meta strip */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '0 28px' }}>
          {[
            ['CLIPS', col.count],
            ['COUNTRIES', 11],
            ['TOTAL DURATION', '34m 12s'],
            ['AVG. PILOT RATING', '4.91'],
            ['LICENSED FROM', '$4'],
          ].map(([k, v], i) => (
            <div key={k} style={{ padding: '20px 20px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Essay */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '60px 28px 40px' }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>FROM THE CURATOR</div>
        <h2 style={{ fontSize: 32, letterSpacing: '-0.02em', marginBottom: 22, fontFamily: 'var(--font-display)' }}>Why these, and not the others.</h2>
        <div style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--parchment)' }}>
          <p style={{ marginBottom: 18 }}>I used to chase sunrise the way people chase good coffee — if you miss it, the whole day feels slightly off. Then I spent a year not chasing, just noticing, and I learned something: the gold in "golden hour" isn't the color, it's the way light arrives <em>in layers</em>, each one disclosing something the last one hid.</p>
          <p style={{ marginBottom: 18 }}>These twenty-eight clips are from pilots who understood that. They didn't rush the light. They let it come to them. You can feel it in the frame rate, in the slow push, in how long they held the shot after the "money" moment was technically over.</p>
          <p style={{ marginBottom: 18 }}>If you license any of these, I hope you give them that same patience in the edit.</p>
          <p className="mono" style={{ fontSize: 14, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>— Hyunwoo</p>
        </div>
      </section>

      {/* Clips grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 28px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24 }}>The clips · {videos.length}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="chip active" style={{ fontSize: 12 }} data-placeholder="true">Curator order</button>
            <button className="chip" style={{ fontSize: 12 }} data-placeholder="true">By date shot</button>
            <button className="chip" style={{ fontSize: 12 }} data-placeholder="true">By country</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {videos.map((v, i) => (
            <div key={v.id + '-' + i}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--amber)', letterSpacing: '0.1em', fontWeight: 600 }}>{String(i+1).padStart(2, '0')}</span>
                <span style={{ fontSize: 12, color: 'var(--parchment-dim)', fontStyle: 'italic' }}>{['Morning proper','Before the city woke','A long pull east','Into the harbor','The quiet kind','After the rain','Right as the fog lifted','Ten minutes of nothing','The best one','Not the money shot','Overheard','The way back'][i % 12]}</span>
              </div>
              <VideoCard video={v} onClick={onOpenVideo}/>
            </div>
          ))}
        </div>
      </section>

      {/* More from curator */}
      <section style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>MORE BOARDS FROM {author.name.toUpperCase()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {COLLECTIONS.filter(c => c.id !== col.id).slice(0, 4).map(c => (
              <button key={c.id} onClick={() => onNav('collection', c.id)} style={{ textAlign: 'left' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3, aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ gridRow: 'span 2', background: thumbGradient(c.id.charCodeAt(1)) }}/>
                  <div style={{ background: thumbGradient(c.id.charCodeAt(1) + 1) }}/>
                  <div style={{ background: thumbGradient(c.id.charCodeAt(1) + 2) }}/>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{c.count} clips · {c.updated}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

