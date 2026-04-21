// pages/atlas.jsx — community wishlist of places not yet filmed
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
const atUseState = useState;

const BOUNTIES = [
  { id: 'b1', place: 'Socotra — Dragon Blood Forest', country: 'Yemen', votes: 2874, bounty: 4200, deadline: 'Jun 30', difficulty: 'Extreme', tags: ['remote','endemic flora'], brief: 'First-light overhead of the alien canopy. No one has uploaded this under open commercial license yet.' },
  { id: 'b2', place: 'Salar de Uyuni — mirror season', country: 'Bolivia', votes: 2341, bounty: 3100, deadline: 'Feb 2027', difficulty: 'Moderate', tags: ['reflection','altitude'], brief: 'That 2-week window in Feb when the salt flat floods. Need reflections showing the horizon swap.' },
  { id: 'b3', place: 'Meteora monasteries at fog', country: 'Greece', votes: 1987, bounty: 2400, deadline: 'Nov 15', difficulty: 'Moderate', tags: ['architecture','fog'], brief: 'Early autumn, monasteries rising out of valley fog. Daytime permit already handled.' },
  { id: 'b4', place: 'Ittoqqortoormiit · harbor at ice-break', country: 'Greenland', votes: 1642, bounty: 5600, deadline: 'May 20', difficulty: 'Extreme', tags: ['arctic','logistics'], brief: 'World\'s most remote settlement, colored houses against sea-ice cracking apart.' },
  { id: 'b5', place: 'Danakil Depression — salt volcanoes', country: 'Ethiopia', votes: 1520, bounty: 4800, deadline: 'Dec 31', difficulty: 'Extreme', tags: ['geothermal','heat'], brief: 'Vertical sulphur terraces from 80m. Pilot must carry own cooled battery kit.' },
  { id: 'b6', place: 'Oodnadatta — post-rain wildflowers', country: 'Australia', votes: 1204, bounty: 2200, deadline: 'Sep 10', difficulty: 'Easy', tags: ['seasonal','remote'], brief: 'After rare inland rain, outback blooms. Window is 9–14 days max.' },
  { id: 'b7', place: 'Nuuk fjord — whales from above', country: 'Greenland', votes: 1100, bounty: 3400, deadline: 'Jul 20', difficulty: 'Moderate', tags: ['wildlife','distance rules'], brief: 'Humpback pods. Must stay 150m+ altitude and not change animal behavior.' },
  { id: 'b8', place: 'Lalibela rock-hewn churches', country: 'Ethiopia', votes: 944, bounty: 2800, deadline: 'Jan 15', difficulty: 'Moderate', tags: ['heritage','permits'], brief: 'Orthodox Christmas pilgrimage, overhead. Requires church permission — we will coordinate.' },
];

export function AtlasPage({ onNav }) {
  const [sort, setSort] = atUseState('votes');
  const [filter, setFilter] = atUseState('all');
  const sorted = [...BOUNTIES].sort((a, b) => sort === 'bounty' ? b.bounty - a.bounty : b.votes - a.votes);
  const DIFFICULTY_COLOR = { Easy: 'var(--lichen)', Moderate: 'var(--amber)', Extreme: 'var(--sunset)' };

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '70px 28px 48px', borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }} viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice">
          <g stroke="var(--parchment)" fill="none" strokeWidth="0.5">
            {[...Array(22)].map((_, i) => (
              <path key={i} d={`M0 ${28*i} Q400 ${28*i-20} 800 ${28*i+20} T1600 ${28*i-5}`}/>
            ))}
          </g>
        </svg>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>THE ATLAS · LAST UPDATED 6 MIN AGO</div>
            <h1 style={{ fontSize: 72, letterSpacing: '-0.03em', lineHeight: 0.98, marginBottom: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Places the<br/>map forgot.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--parchment)', lineHeight: 1.55, maxWidth: 520, marginBottom: 26 }}>
              A crowdsourced list of the places Drone Icarus doesn't yet have. Vote them up. Post a bounty. Any verified pilot can claim one — and the first to deliver a clip that clears review takes the whole purse.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn">Suggest a place</button>
              <button className="btn secondary">How bounties work</button>
            </div>
          </div>
          <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--forest-900)' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>ATLAS · AT A GLANCE</div>
            {[
              ['Open bounties', '184'],
              ['Total purse', '$472,800'],
              ['Places claimed this month', '38'],
              ['Avg. days to first submission', '21'],
              ['Median bounty', '$2,600'],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: 13 }}>
                <span style={{ color: 'var(--parchment-dim)' }}>{k}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Controls */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 28px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All · 184'],['easy','Easy'],['moderate','Moderate'],['extreme','Extreme'],['wildlife','Wildlife'],['arctic','Arctic']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={'chip' + (filter === k ? ' active' : '')} style={{ fontSize: 12 }}>{l}</button>
          ))}
        </div>
        <select onChange={e => setSort(e.target.value)} value={sort} style={{ background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', padding: '6px 12px', fontSize: 12, borderRadius: 3 }}>
          <option value="votes">Most voted</option>
          <option value="bounty">Highest bounty</option>
        </select>
      </div>

      {/* Bounty list */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 28px 60px' }}>
        {sorted.map((b, i) => (
          <article key={b.id} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 240px 160px', gap: 22,
            padding: '24px 0', borderTop: i === 0 ? '1px solid var(--line-strong)' : '1px solid var(--line)', alignItems: 'center',
          }}>
            <button style={{
              width: 56, padding: '10px 0', border: '1px solid var(--line-strong)', borderRadius: 3, background: 'var(--forest-900)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sunset)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 L4 14 L10 14 L10 20 L14 20 L14 14 L20 14 Z"/></svg>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{(b.votes/1000).toFixed(1)}K</span>
            </button>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>
                {b.country.toUpperCase()} · DIFFICULTY <span style={{ color: DIFFICULTY_COLOR[b.difficulty] }}>● {b.difficulty.toUpperCase()}</span>
              </div>
              <h3 style={{ fontSize: 24, letterSpacing: '-0.01em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{b.place}</h3>
              <p style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.55, marginBottom: 10, maxWidth: 600 }}>{b.brief}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {b.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--parchment-dim)' }}>{t}</span>)}
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>BOUNTY PURSE</div>
              <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.02em' }}>${b.bounty.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>Deadline · {b.deadline}, 2026</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn" style={{ fontSize: 12 }}>Claim this</button>
              <button className="btn secondary" style={{ fontSize: 12 }}>Add to purse</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

