// pages/commissions.jsx — reverse-auction commission requests (browse, detail, post)
// Buyers post a brief, verified pilots bid, buyer accepts → awarded.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ic } from '../components';
import { useAuth } from '../auth/AuthContext';
import { RequireAuth } from '../auth/RequireAuth';
import { supabase } from '../supabase';
import { toast } from '../toast';
import {
  fetchOpenCommissions,
  fetchCommission,
  createCommission,
  placeBid,
  acceptBid,
} from '../db/commissions';

// ---------- helpers ----------
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'cityscape', label: 'Cityscape' },
  { id: 'ocean', label: 'Ocean / Coast' },
  { id: 'vineyard', label: 'Vineyard / Field' },
  { id: 'fpv-racing', label: 'FPV / Racing' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'other', label: 'Other' },
];
const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'awarded', label: 'Awarded' },
  { id: 'all', label: 'All' },
];
const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'closing', label: 'Closing soon' },
  { id: 'budget', label: 'Highest budget' },
];
const LICENSES = ['personal', 'commercial', 'extended', 'exclusive'];
const RESOLUTIONS = ['HD', '4K', '6K', '8K'];

function fmtMoney(n) {
  const v = Number(n || 0);
  if (v >= 1000) return '$' + Math.round(v).toLocaleString();
  return '$' + v.toFixed(0);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
function StatusBadge({ status }) {
  const map = {
    open: { bg: 'rgba(107,142,78,0.14)', fg: '#2d4a1e', label: 'Open' },
    awarded: { bg: 'rgba(217,112,69,0.14)', fg: '#8b3e1d', label: 'Awarded' },
    completed: { bg: 'rgba(60,80,60,0.10)', fg: '#2a3a2a', label: 'Completed' },
    cancelled: { bg: 'rgba(120,40,40,0.10)', fg: '#7a2020', label: 'Cancelled' },
    expired: { bg: 'rgba(80,80,80,0.10)', fg: '#555', label: 'Expired' },
  };
  const s = map[status] || map.open;
  return (
    <span className="mono" style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.fg, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>{s.label}</span>
  );
}

// ---------- LIST PAGE ----------
export function CommissionsPage({ onNav }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchOpenCommissions({ status: statusFilter, category, sort })
      .then(r => { if (alive) { setRows(r); setLoading(false); } })
      .catch(e => { if (alive) { console.error('[commissions] list err', e); setRows([]); setLoading(false); } });
    return () => { alive = false; };
  }, [statusFilter, category, sort]);

  // Stats — derive from current row set
  const stats = useMemo(() => {
    const open = rows.filter(r => r.status === 'open').length;
    const totalBids = rows.reduce((s, r) => s + (r.bids_count || 0), 0);
    const awarded = rows.filter(r => r.status === 'awarded');
    const avgAward = awarded.length
      ? Math.round(awarded.reduce((s, r) => s + Number(r.budget_max_usd || 0), 0) / awarded.length)
      : 0;
    return { open, totalBids, avgAward };
  }, [rows]);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 24px 80px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>COMMISSIONS · REVERSE AUCTION</div>
        <h1 style={{ fontSize: 38, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Commission custom drone work — set your brief, pilots compete.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--parchment-dim)', maxWidth: 720, margin: '0 0 18px' }}>
          Post what you need (location, deadline, budget cap, license). Verified pilots submit bids — you pick the best one.
        </p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <Stat label="Open requests" value={stats.open} />
          <Stat label="Total bids" value={stats.totalBids} />
          <Stat label="Avg awarded budget" value={stats.avgAward ? fmtMoney(stats.avgAward) : '—'} />
          <button className="btn" onClick={() => onNav('commission-new')} style={{ marginLeft: 'auto' }}>
            Post a request →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '20px 0 18px' }}>
        <Seg opts={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="di-tag"
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                background: category === c.id ? 'var(--sunset)' : 'transparent',
                color: category === c.id ? '#faf6ec' : 'var(--parchment)',
                border: '1px solid ' + (category === c.id ? 'var(--sunset)' : 'var(--line)'),
              }}
            >{c.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.14em' }}>SORT</span>
          <Seg opts={SORTS} value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="di-empty" style={{ padding: 60, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)' }}>LOADING…</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="di-empty" style={{ padding: 60, textAlign: 'center' }}>
          <div className="di-empty-title">No commissions match these filters</div>
          <div style={{ color: 'var(--parchment-dim)', fontSize: 14, marginTop: 6 }}>
            Try clearing filters or post the first one.
          </div>
          <button className="btn" onClick={() => onNav('commission-new')} style={{ marginTop: 16 }}>
            Post a request →
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16,
        }}>
          {rows.map(r => (
            <CommissionCard key={r.id} row={r} onNav={onNav} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Seg({ opts, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bone)', border: '1px solid var(--line)', borderRadius: 4, padding: 2 }}>
      {opts.map(o => (
        <button
          key={String(o.id)}
          onClick={() => onChange(o.id)}
          style={{
            padding: '6px 12px', fontSize: 13, borderRadius: 3, cursor: 'pointer',
            background: value === o.id ? 'var(--sunset)' : 'transparent',
            color: value === o.id ? '#faf6ec' : 'var(--parchment)',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function CommissionCard({ row, onNav }) {
  const dleft = daysUntil(row.deadline);
  const cat = CATEGORIES.find(c => c.id === row.category);
  return (
    <div
      className="di-card"
      onClick={() => onNav('commission', row.id)}
      style={{ padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{row.title}</div>
        <StatusBadge status={row.status} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="di-tag" style={{ fontSize: 12 }}>{(cat && cat.label) || row.category}</span>
        {row.region && <span className="di-tag" style={{ fontSize: 12 }}>{row.region}</span>}
        <span className="di-tag" style={{ fontSize: 12 }}>{row.resolution_required}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--parchment-dim)', lineHeight: 1.5 }}>
        {(row.brief || '').slice(0, 110)}{(row.brief || '').length > 110 ? '…' : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>Budget cap</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sunset)', fontFamily: 'var(--font-display)' }}>{fmtMoney(row.budget_max_usd)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>
            {dleft != null && dleft >= 0 ? `${dleft}d left` : 'Closed'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {row.bids_count || 0} bid{row.bids_count === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- DETAIL PAGE ----------
export function CommissionDetailPage({ id, onNav }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    fetchCommission(id)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error('[commissions] detail err', e); setLoading(false); });
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)' }}>LOADING…</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Commission not found</div>
        <button className="btn" onClick={() => onNav('commissions')}>← Back to commissions</button>
      </div>
    );
  }

  const isBuyer = user && user.id === data.buyer_id;
  const myBid = user ? (data.bids || []).find(b => b.pilot_id === user.id) : null;
  const canBid = !!user && !isBuyer && !myBid && data.status === 'open';
  const dleft = daysUntil(data.deadline);

  const handleAccept = async (bidId) => {
    if (!isBuyer) return;
    setAccepting(true);
    try {
      await acceptBid(bidId, data.id);
      toast && toast('Bid accepted', 'The pilot has been notified.', 'success');
      reload();
    } catch (e) {
      console.error(e);
      toast && toast('Accept failed', e.message || 'Try again', 'error');
    } finally { setAccepting(false); }
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px' }}>
      <button onClick={() => onNav('commissions')} style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 16 }}>← All commissions</button>

      {data.status === 'awarded' && (
        <div style={{
          padding: 14, border: '1px solid var(--sunset)', background: 'rgba(217,112,69,0.08)',
          borderRadius: 6, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ color: 'var(--sunset)' }}><Ic.check /></span>
          <div style={{ fontSize: 14 }}>
            <strong>Awarded.</strong> A pilot has been selected for this commission.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 30 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <StatusBadge status={data.status} />
            <span className="di-tag" style={{ fontSize: 12 }}>{(CATEGORIES.find(c => c.id === data.category) || {}).label || data.category}</span>
            {data.region && <span className="di-tag" style={{ fontSize: 12 }}>{data.region}</span>}
          </div>
          <h1 style={{ fontSize: 32, letterSpacing: '-0.01em', margin: '0 0 14px', lineHeight: 1.2 }}>{data.title}</h1>

          <div className="di-card" style={{ padding: 18, marginBottom: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Brief</div>
            <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{data.brief}</p>
          </div>

          <div className="di-card" style={{ padding: 18, marginBottom: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Bids ({(data.bids || []).length})</div>
            {(data.bids || []).length === 0 ? (
              <div className="di-empty" style={{ padding: 20, textAlign: 'center', color: 'var(--parchment-dim)' }}>
                No bids yet. Be the first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.bids || []).map(b => (
                  <BidRow
                    key={b.id}
                    bid={b}
                    canAccept={isBuyer && data.status === 'open'}
                    accepting={accepting}
                    onAccept={() => handleAccept(b.id)}
                    awarded={b.id === data.awarded_bid_id}
                  />
                ))}
              </div>
            )}
          </div>

          {canBid && (
            <BidForm requestId={data.id} onPlaced={reload} />
          )}
          {myBid && (
            <div className="di-card" style={{ padding: 16, background: 'var(--bone)' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Your bid</div>
              <div style={{ fontSize: 14 }}>
                You bid <strong>{fmtMoney(myBid.price_usd)}</strong> · ETA {myBid.eta_days}d · status: <strong>{myBid.status}</strong>
              </div>
            </div>
          )}
          {!user && data.status === 'open' && (
            <div className="di-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>Sign in as a pilot to place a bid.</div>
              <button className="btn" onClick={() => onNav('signin')}>Sign in</button>
            </div>
          )}
          {isBuyer && data.status === 'open' && (
            <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginTop: 10 }}>
              You're the buyer. Click <strong>Accept</strong> on the bid you want to award.
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside>
          <div className="di-card" style={{ padding: 18, marginBottom: 14 }}>
            <Field label="Budget cap"><strong style={{ fontSize: 22, color: 'var(--sunset)', fontFamily: 'var(--font-display)' }}>{fmtMoney(data.budget_max_usd)}</strong></Field>
            <Field label="Deadline">
              {new Date(data.deadline).toLocaleDateString()}
              {dleft != null && (
                <span className="mono" style={{ marginLeft: 6, fontSize: 11, color: dleft < 7 ? 'var(--sunset)' : 'var(--parchment-dim)', letterSpacing: '0.14em' }}>
                  {dleft >= 0 ? `${dleft}D LEFT` : 'CLOSED'}
                </span>
              )}
            </Field>
            <Field label="License">{data.license_required}</Field>
            <Field label="Resolution">{data.resolution_required}</Field>
            <Field label="Category">{(CATEGORIES.find(c => c.id === data.category) || {}).label || data.category}</Field>
            {data.region && <Field label="Region">{data.region}</Field>}
            {data.target_lat != null && data.target_lon != null && (
              <Field label="Target">
                <span className="mono" style={{ fontSize: 12 }}>
                  {Number(data.target_lat).toFixed(4)}°, {Number(data.target_lon).toFixed(4)}°
                </span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${data.target_lat}&mlon=${data.target_lon}#map=10/${data.target_lat}/${data.target_lon}`}
                  target="_blank" rel="noreferrer"
                  style={{ marginLeft: 8, fontSize: 12, color: 'var(--sunset)' }}
                >Open map →</a>
              </Field>
            )}
            <Field label="Posted">{timeAgo(data.created_at)}</Field>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{children}</div>
    </div>
  );
}

function BidRow({ bid, canAccept, accepting, onAccept, awarded }) {
  const pilot = bid.pilot || {};
  const handle = pilot.handle || 'pilot';
  const name = pilot.display_name || handle;
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12, alignItems: 'flex-start',
      border: '1px solid ' + (awarded ? 'var(--sunset)' : 'var(--line)'),
      background: awarded ? 'rgba(217,112,69,0.06)' : 'transparent',
      borderRadius: 6,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sunset)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {name} <span className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', fontWeight: 400 }}>{handle}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--sunset)', fontFamily: 'var(--font-display)' }}>{fmtMoney(bid.price_usd)}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.12em' }}>ETA {bid.eta_days}D</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--parchment)', marginTop: 6, lineHeight: 1.5 }}>{bid.pitch}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.12em' }}>
            {timeAgo(bid.created_at)} · {bid.status}
          </span>
          {canAccept && (
            <button className="btn" onClick={onAccept} disabled={accepting} style={{ fontSize: 13, padding: '6px 14px' }}>
              {accepting ? 'Accepting…' : 'Accept'}
            </button>
          )}
          {awarded && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--sunset)', letterSpacing: '0.14em' }}>WINNING BID</span>
          )}
        </div>
      </div>
    </div>
  );
}

function BidForm({ requestId, onPlaced }) {
  const { user } = useAuth();
  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('');
  const [pitch, setPitch] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { toast && toast('Sign in', 'You need to be signed in to bid.', 'error'); return; }
    const p = Number(price), et = parseInt(eta, 10);
    if (!(p > 0)) { toast && toast('Invalid price', 'Enter a positive USD amount.', 'error'); return; }
    if (!(et > 0)) { toast && toast('Invalid ETA', 'Enter days as a positive integer.', 'error'); return; }
    if (!pitch.trim()) { toast && toast('Pitch required', 'A short pitch helps the buyer choose.', 'error'); return; }
    setBusy(true);
    try {
      await placeBid({
        request_id: requestId,
        pilot_id: user.id,
        price_usd: p,
        eta_days: et,
        pitch: pitch.trim(),
      });
      toast && toast('Bid placed', 'The buyer has been notified.', 'success');
      setPrice(''); setEta(''); setPitch('');
      onPlaced && onPlaced();
    } catch (err) {
      console.error('[bid err]', err);
      toast && toast('Bid failed', err.message || 'Try again', 'error');
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="di-card" style={{ padding: 18 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Place a bid</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Lab label="Price (USD)">
          <input type="number" min="1" step="1" className="di-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 480" required />
        </Lab>
        <Lab label="ETA (days)">
          <input type="number" min="1" step="1" className="di-input" value={eta} onChange={e => setEta(e.target.value)} placeholder="e.g. 7" required />
        </Lab>
      </div>
      <Lab label="Short pitch">
        <textarea className="di-textarea" value={pitch} onChange={e => setPitch(e.target.value)} placeholder="Why you, what kit, location proximity, prior similar work." required />
      </Lab>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit bid'}</button>
      </div>
    </form>
  );
}

function Lab({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}

// ---------- POST FORM ----------
export function CommissionNewPage({ onNav }) {
  return (
    <RequireAuth onNav={onNav} message="Sign in to post a commission.">
      <CommissionNewForm onNav={onNav} />
    </RequireAuth>
  );
}

function CommissionNewForm({ onNav }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [category, setCategory] = useState('mountain');
  const [region, setRegion] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [license, setLicense] = useState('commercial');
  const [resolution, setResolution] = useState('4K');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !brief.trim() || !budget || !deadline) {
      toast && toast('Missing fields', 'Title, brief, budget, and deadline are required.', 'error');
      return;
    }
    setBusy(true);
    try {
      const row = await createCommission({
        buyer_id: user.id,
        title: title.trim(),
        brief: brief.trim(),
        category,
        region: region.trim() || null,
        target_lat: lat ? Number(lat) : null,
        target_lon: lon ? Number(lon) : null,
        budget_max_usd: Number(budget),
        deadline,
        license_required: license,
        resolution_required: resolution,
      });
      toast && toast('Posted', 'Pilots can now bid on your request.', 'success');
      onNav('commission', row.id);
    } catch (err) {
      console.error('[commission create]', err);
      toast && toast('Post failed', err.message || 'Try again', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
      <button onClick={() => onNav('commissions')} style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 16 }}>← All commissions</button>
      <div className="eyebrow" style={{ marginBottom: 8 }}>POST A REQUEST</div>
      <h1 style={{ fontSize: 30, letterSpacing: '-0.01em', margin: '0 0 8px' }}>Brief your shoot. Pilots bid.</h1>
      <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 24 }}>
        The clearer the brief, the better the bids. You can set a budget cap — pilots will quote at or below it.
      </p>

      <form onSubmit={submit} className="di-card" style={{ padding: 22 }}>
        <Lab label="Title">
          <input className="di-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mt Fuji at sunrise — cinematic 4K" required />
        </Lab>
        <Lab label="Brief (location, mood, deliverables)">
          <textarea className="di-textarea" style={{ minHeight: 140 }} value={brief} onChange={e => setBrief(e.target.value)} placeholder="What you need, where, the mood, references, deliverable formats." required />
        </Lab>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Lab label="Category">
            <select className="di-input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Lab>
          <Lab label="Region (free text)">
            <input className="di-input" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Asia · Japan" />
          </Lab>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Lab label="Target latitude (optional)">
            <input className="di-input" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 35.3606" />
          </Lab>
          <Lab label="Target longitude (optional)">
            <input className="di-input" type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 138.7274" />
          </Lab>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Lab label="Budget cap (USD)">
            <input className="di-input" type="number" min="1" step="1" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 800" required />
          </Lab>
          <Lab label="Deadline">
            <input className="di-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
          </Lab>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Lab label="License required">
            <select className="di-input" value={license} onChange={e => setLicense(e.target.value)}>
              {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Lab>
          <Lab label="Min resolution">
            <select className="di-input" value={resolution} onChange={e => setResolution(e.target.value)}>
              {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Lab>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button type="button" className="btn secondary" onClick={() => onNav('commissions')} disabled={busy}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Posting…' : 'Post request'}</button>
        </div>
      </form>
    </div>
  );
}
