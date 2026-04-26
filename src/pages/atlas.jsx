// pages/atlas.jsx — community wishlist of places not yet filmed
// Real DB-backed bounty system. Replaces the prior PREVIEW page.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  fetchBounties,
  fetchAtlasStats,
  createBounty,
  voteBounty,
  unvoteBounty,
  addToPurse,
  claimBounty,
  hasUserVoted,
  hasUserClaimed,
} from '../db/atlas';

const DIFFICULTY_COLOR = {
  easy: 'var(--lichen)',
  moderate: 'var(--amber)',
  hard: 'var(--sunset)',
  extreme: 'var(--sunset)',
};

function fmtMoney(n) {
  return '$' + (n || 0).toLocaleString();
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

export function AtlasPage({ onNav }) {
  const { user, session } = useAuth();
  const accessToken = session?.access_token;

  const [sort, setSort] = useState('votes');
  const [filter, setFilter] = useState('all');
  const [bounties, setBounties] = useState([]);
  const [stats, setStats] = useState({ openCount: 0, totalPurse: 0, claimsThisMonth: 0, avgDaysToSubmit: 0, medianPurse: 0 });
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(new Set());
  const [myClaims, setMyClaims] = useState(new Map()); // bountyId -> claim row
  const [modal, setModal] = useState(null); // { kind: 'suggest' | 'purse' | 'claim', bounty? }

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, agg] = await Promise.all([
      fetchBounties({ sort, difficulty: filter }),
      fetchAtlasStats(),
    ]);
    setBounties(list);
    setStats(agg);
    if (user?.id) {
      const v = new Set();
      const m = new Map();
      await Promise.all(list.map(async (b) => {
        const [hasV, claim] = await Promise.all([
          hasUserVoted(b.id, user.id, accessToken),
          hasUserClaimed(b.id, user.id, accessToken),
        ]);
        if (hasV) v.add(b.id);
        if (claim) m.set(b.id, claim);
      }));
      setVoted(v);
      setMyClaims(m);
    } else {
      setVoted(new Set());
      setMyClaims(new Map());
    }
    setLoading(false);
  }, [sort, filter, user?.id, accessToken]);

  useEffect(() => { reload(); }, [reload]);

  const filtered = useMemo(() => {
    if (!filter || filter === 'all') return bounties;
    if (['easy','moderate','hard','extreme'].includes(filter)) {
      return bounties.filter(b => b.difficulty === filter);
    }
    // tag filter
    return bounties.filter(b => Array.isArray(b.tags) && b.tags.includes(filter));
  }, [bounties, filter]);

  const requireAuth = (fn) => () => {
    if (!user) { onNav?.('signin'); return; }
    fn();
  };

  const onVote = async (bounty) => {
    if (!user) { onNav?.('signin'); return; }
    try {
      if (voted.has(bounty.id)) {
        await unvoteBounty(bounty.id, user.id, accessToken);
      } else {
        await voteBounty(bounty.id, user.id, accessToken);
      }
      reload();
    } catch (e) {
      console.warn('[atlas] vote', e.message);
      alert('Vote failed: ' + e.message);
    }
  };

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
            <div className="eyebrow" style={{ marginBottom: 10 }}>THE ATLAS · LIVE</div>
            <h1 style={{ fontSize: 72, letterSpacing: '-0.03em', lineHeight: 0.98, marginBottom: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Places the<br/>map forgot.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--parchment)', lineHeight: 1.55, maxWidth: 520, marginBottom: 26 }}>
              가본 적 없는 장소를 발굴하기 위한 크라우드소싱 현상금 보드. 사용자가 장소 제안 → 투표 → 현상금 후원 → 첫 통과 영상에게 전액 지급.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={requireAuth(() => setModal({ kind: 'suggest' }))}>Suggest a place</button>
              <button className="btn secondary" onClick={() => onNav?.('bounties-howto')}>How bounties work</button>
            </div>
          </div>
          <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--forest-900)' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>ATLAS · LIVE STATS</div>
            {[
              ['Open bounties', loading ? '—' : String(stats.openCount)],
              ['Total purse', loading ? '—' : fmtMoney(stats.totalPurse)],
              ['Claims this month', loading ? '—' : String(stats.claimsThisMonth)],
              ['Avg. days to first submission', loading ? '—' : (stats.avgDaysToSubmit > 0 ? String(stats.avgDaysToSubmit) : '—')],
              ['Median bounty', loading ? '—' : fmtMoney(stats.medianPurse)],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: 14 }}>
                <span style={{ color: 'var(--parchment-dim)' }}>{k}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Controls */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 28px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['all', `All · ${bounties.length}`],
            ['easy','Easy'],
            ['moderate','Moderate'],
            ['hard','Hard'],
            ['extreme','Extreme'],
            ['wildlife','Wildlife'],
            ['arctic','Arctic'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={'chip' + (filter === k ? ' active' : '')} style={{ fontSize: 14 }}>{l}</button>
          ))}
        </div>
        <select onChange={e => setSort(e.target.value)} value={sort} style={{ background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', padding: '6px 12px', fontSize: 14, borderRadius: 3 }}>
          <option value="votes">Most voted</option>
          <option value="bounty">Highest bounty</option>
        </select>
      </div>

      {/* Bounty list */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 28px 60px' }}>
        {loading && <div style={{ padding: 32, color: 'var(--parchment-dim)' }}>Loading bounties…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 32, color: 'var(--parchment-dim)' }}>No bounties match this filter yet. Try Suggest a place.</div>
        )}
        {!loading && filtered.map((b, i) => {
          const myClaim = myClaims.get(b.id);
          const isVoted = voted.has(b.id);
          const diffKey = (b.difficulty || 'moderate').toLowerCase();
          return (
            <article key={b.id} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 240px 160px', gap: 22,
              padding: '24px 0', borderTop: i === 0 ? '1px solid var(--line-strong)' : '1px solid var(--line)', alignItems: 'center',
            }}>
              <button onClick={() => onVote(b)} aria-label={isVoted ? 'Unvote' : 'Vote'} style={{
                width: 56, padding: '10px 0',
                border: '1px solid ' + (isVoted ? 'var(--sunset)' : 'var(--line-strong)'),
                borderRadius: 3,
                background: isVoted ? 'var(--sunset-dim, rgba(220,90,40,0.12))' : 'var(--forest-900)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isVoted ? 'var(--sunset)' : 'none'} stroke="var(--sunset)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 L4 14 L10 14 L10 20 L14 20 L14 14 L20 14 Z"/></svg>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                  {b.votes_count >= 1000 ? (b.votes_count/1000).toFixed(1) + 'K' : (b.votes_count ?? 0)}
                </span>
              </button>
              <div>
                <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>
                  {(b.country || '').toUpperCase()} · DIFFICULTY <span style={{ color: DIFFICULTY_COLOR[diffKey] || 'var(--amber)' }}>● {String(b.difficulty || 'moderate').toUpperCase()}</span>
                  {b.active_claims > 0 && <span style={{ marginLeft: 10, color: 'var(--lichen)' }}>· CLAIMED</span>}
                </div>
                <h3 style={{ fontSize: 24, letterSpacing: '-0.01em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{b.place}</h3>
                <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.55, marginBottom: 10, maxWidth: 600 }}>{b.brief}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(b.tags || []).map(t => (
                    <span key={t} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--parchment-dim)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>BOUNTY PURSE</div>
                <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
                  {fmtMoney(b.purse_total)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Deadline · {fmtDate(b.deadline)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myClaim ? (
                  <button className="btn" disabled style={{ fontSize: 14, opacity: 0.7 }}>
                    {myClaim.status === 'submitted' ? 'Submitted' : 'Claimed (' + Math.max(0, Math.round((new Date(myClaim.deadline) - Date.now())/86400000)) + 'd left)'}
                  </button>
                ) : (
                  <button
                    className="btn"
                    style={{ fontSize: 14 }}
                    disabled={b.active_claims > 0}
                    title={b.active_claims > 0 ? 'Already claimed by another pilot' : ''}
                    onClick={requireAuth(() => setModal({ kind: 'claim', bounty: b }))}>
                    {b.active_claims > 0 ? 'Already claimed' : 'Claim'}
                  </button>
                )}
                <button className="btn secondary" style={{ fontSize: 14 }} onClick={requireAuth(() => setModal({ kind: 'purse', bounty: b }))}>Add to purse</button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modals */}
      {modal?.kind === 'suggest' && (
        <SuggestPlaceModal
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            await createBounty(data, user.id, accessToken);
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === 'purse' && modal.bounty && (
        <AddToPurseModal
          bounty={modal.bounty}
          onClose={() => setModal(null)}
          onSubmit={async (amount) => {
            await addToPurse(modal.bounty.id, amount, user.id, accessToken);
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === 'claim' && modal.bounty && (
        <ClaimModal
          bounty={modal.bounty}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await claimBounty(modal.bounty.id, user.id, accessToken, 30);
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

// ——— Modals ———

function ModalShell({ title, children, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--forest-900)', border: '1px solid var(--line-strong)', borderRadius: 4,
        width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 22, fontFamily: 'var(--font-display)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--parchment)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--parchment-dim)', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '8px 10px', background: 'var(--forest-950, #0c1310)', border: '1px solid var(--line-strong)', borderRadius: 3, color: 'var(--bone)', fontSize: 14, marginBottom: 14, fontFamily: 'inherit' };

function SuggestPlaceModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ place: '', country: '', brief: '', lat: '', lon: '', difficulty: 'moderate', tags: '', deadline: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = form.place.trim() && form.country.trim() && form.brief.trim();
  return (
    <ModalShell title="Suggest a place" onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true); setError('');
        try {
          await onSubmit({
            place: form.place.trim(),
            country: form.country.trim(),
            brief: form.brief.trim(),
            lat: form.lat ? Number(form.lat) : null,
            lon: form.lon ? Number(form.lon) : null,
            difficulty: form.difficulty,
            tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
            deadline: form.deadline || null,
          });
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
      }}>
        <label style={labelStyle}>Place name</label>
        <input style={inputStyle} value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} placeholder="e.g. Plitvice Lakes — winter freeze" required />

        <label style={labelStyle}>Country</label>
        <input style={inputStyle} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="e.g. Croatia" required />

        <label style={labelStyle}>Brief — what makes this shot worth a bounty?</label>
        <textarea style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }} value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} placeholder="What needs to be filmed, what conditions, any permits?" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Latitude (optional)</label>
            <input style={inputStyle} type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="44.8654" />
          </div>
          <div>
            <label style={labelStyle}>Longitude (optional)</label>
            <input style={inputStyle} type="number" step="any" value={form.lon} onChange={e => setForm({ ...form, lon: e.target.value })} placeholder="15.5820" />
          </div>
        </div>

        <label style={labelStyle}>Difficulty</label>
        <select style={inputStyle} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>

        <label style={labelStyle}>Tags (comma-separated)</label>
        <input style={inputStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="winter, frozen, heritage" />

        <label style={labelStyle}>Deadline (optional)</label>
        <input style={inputStyle} type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />

        {error && <div style={{ color: 'var(--sunset)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn" disabled={!valid || busy}>{busy ? 'Submitting…' : 'Submit bounty'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddToPurseModal({ bounty, onClose, onSubmit }) {
  const [amount, setAmount] = useState('25');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const amt = Number(amount);
  const valid = amt >= 5;
  return (
    <ModalShell title="Add to purse" onClose={onClose}>
      <p style={{ fontSize: 14, color: 'var(--parchment)', marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
        <strong>{bounty.place}</strong><br/>
        Current purse: <span className="mono" style={{ color: 'var(--amber)' }}>{fmtMoney(bounty.purse_total)}</span>
      </p>
      <form onSubmit={async (e) => {
        e.preventDefault(); if (!valid) return;
        setBusy(true); setError('');
        try { await onSubmit(amt); } catch (err) { setError(err.message); } finally { setBusy(false); }
      }}>
        <label style={labelStyle}>Amount (USD, min $5)</label>
        <input style={inputStyle} type="number" min="5" step="1" value={amount} onChange={e => setAmount(e.target.value)} required />
        <p style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 16 }}>
          Funds are pledged to the first pilot whose submission passes review. If the bounty expires unfilled, all contributors are refunded.
        </p>
        {error && <div style={{ color: 'var(--sunset)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn" disabled={!valid || busy}>{busy ? 'Adding…' : `Pledge ${fmtMoney(amt)}`}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ClaimModal({ bounty, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <ModalShell title="Claim this bounty" onClose={onClose}>
      <p style={{ fontSize: 14, color: 'var(--parchment)', marginTop: 0, lineHeight: 1.5 }}>
        <strong>{bounty.place}</strong> — {bounty.country}
      </p>
      <div style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 3, marginBottom: 14, fontSize: 13, color: 'var(--parchment)', lineHeight: 1.55 }}>
        {bounty.brief}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--parchment)', lineHeight: 1.7 }}>
        <li>You will have <strong>30 days</strong> to upload a passing video.</li>
        <li>Difficulty: <strong>{bounty.difficulty}</strong> · Tags: {(bounty.tags || []).join(', ') || '—'}</li>
        <li>Current purse: <span className="mono" style={{ color: 'var(--amber)' }}>{fmtMoney(bounty.purse_total)}</span></li>
        <li>Other pilots cannot claim while your claim is active.</li>
        <li>If you do not submit by the deadline, the bounty re-opens.</li>
      </ul>
      {error && <div style={{ color: 'var(--sunset)', fontSize: 13, marginTop: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
        <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn" disabled={busy} onClick={async () => {
          setBusy(true); setError('');
          try { await onConfirm(); } catch (err) { setError(err.message); } finally { setBusy(false); }
        }}>{busy ? 'Claiming…' : 'Confirm claim · 30 days'}</button>
      </div>
    </ModalShell>
  );
}
