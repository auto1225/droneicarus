// pages/mypage.jsx — User profile (viewer-focused) · Pinterest-style collections
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS, CREATORS, thumbGradient, CURRENT_USER, COLLECTIONS } from '../data';
import { Ic, formatViews } from '../components';
import { useAuth } from '../auth/AuthContext';
import { fetchCollections } from '../db/social';
import { fetchOrders, logDownloadEvent, buildCacheDownloadUrl } from '../db/commerce';
const mpUseState = useState;
const mpUseMemo = useMemo;

export function MyPage({ onOpenVideo, onNav }) {
  const { profile } = useAuth();
  const u = profile ? {
    id: profile.id,
    name: profile.display_name || 'User',
    handle: profile.handle || '@user',
    email: profile.email,
    initials: (profile.display_name || profile.handle || '?').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
    pilotVerified: profile.pilot_verified,
    joined: profile.created_at ? new Date(profile.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : CURRENT_USER.joined,
    location: profile.location || CURRENT_USER.location,
    followers: profile.followers_count ?? CURRENT_USER.followers,
    following: profile.following_count ?? CURRENT_USER.following,
    collections: CURRENT_USER.collections,
    purchases: CURRENT_USER.purchases,
  } : CURRENT_USER;
  const [tab, setTab] = mpUseState('purchases');
  const [selectedCol, setSelectedCol] = mpUseState(null);
  const [cols, setCols] = mpUseState(COLLECTIONS);
  const [orders, setOrders] = mpUseState([]);
  const [ordersLoading, setOrdersLoading] = mpUseState(true);

  useEffect(() => {
    fetchCollections().then(rows => { if (rows && rows.length) setCols(rows); });
  }, [profile?.id]);

  useEffect(() => {
    let cancel = false;
    setOrdersLoading(true);
    fetchOrders().then(rows => {
      if (!cancel) { setOrders(rows || []); setOrdersLoading(false); }
    }).catch(() => { if (!cancel) setOrdersLoading(false); });
    return () => { cancel = true; };
  }, [profile?.id]);

  if (selectedCol) return <CollectionDetail col={selectedCol} onBack={() => setSelectedCol(null)} onOpenVideo={onOpenVideo} />;

  const likedIds = ['v0','v2','v5','v8','v11','v14','v17','v20','v23','v26','v29','v32','v35','v38','v41','v44','v47','v50','v53','v56','v59','v62'];
  const liked = likedIds.map(id => VIDEOS.find(v => v.id === id)).filter(Boolean);

  return (
    <div>
      {/* Cover header */}
      <div style={{
        position: 'relative', height: 220,
        background: 'linear-gradient(135deg, #6b4a32 0%, #3a4a3b 60%, #2d3a2e 100%)',
        overflow: 'hidden',
      }}>
        <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22 }}>
          <g stroke="#f5ede0" fill="none" strokeWidth="0.6">
            {[...Array(12)].map((_, i) => (
              <path key={i} d={`M0 ${20*i+20} Q300 ${20*i} 600 ${20*i+30} T1200 ${20*i-10}`}/>
            ))}
          </g>
        </svg>
        <div className="mono" style={{ position: 'absolute', top: 20, right: 24, fontSize: 10, letterSpacing: '0.18em', color: 'rgba(245,237,224,0.7)' }}>
          MEMBER SINCE {u.joined.toUpperCase()} · {u.location.toUpperCase()}
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 28px' }}>
        {/* Profile strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr auto',
          alignItems: 'end',
          gap: 24,
          marginTop: -58, marginBottom: 22,
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'var(--sunset)', color: '#faf6ec',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42, fontFamily: 'var(--font-display)', fontWeight: 700,
            border: '4px solid var(--ink)', boxShadow: 'var(--shadow-lg)',
            flexShrink: 0,
          }}>{u.initials}</div>
          <div style={{ minWidth: 0, paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 28, margin: 0 }}>{u.name}</h1>
              {u.pilotVerified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 8 }}>{u.handle} · {u.email}</div>
            <div style={{ display: 'flex', gap: 22, fontSize: 13, flexWrap: 'wrap' }}>
              <span><strong>{u.collections}</strong> <span style={{ color: 'var(--parchment-dim)' }}>boards</span></span>
              <span><strong>{formatViews(u.followers)}</strong> <span style={{ color: 'var(--parchment-dim)' }}>followers</span></span>
              <span><strong>{u.following}</strong> <span style={{ color: 'var(--parchment-dim)' }}>following</span></span>
              <span><strong>{u.purchases}</strong> <span style={{ color: 'var(--parchment-dim)' }}>licenses</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 10 }}>
            <button className="btn secondary" onClick={() => onNav('settings')}>Edit profile</button>
            <button className="btn" data-placeholder="true">Share</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
          {[
            ['purchases', 'My purchases', orders.length],
            ['collections', 'Collections', u.collections],
            ['liked', 'Liked', liked.length],
            ['following', 'Following', u.following],
            ['activity', 'Activity', null],
          ].map(([k, label, n]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '12px 18px', fontSize: 14,
              color: tab === k ? 'var(--bone)' : 'var(--parchment-dim)',
              borderBottom: tab === k ? '2px solid var(--sunset)' : '2px solid transparent',
              marginBottom: -1,
            }}>{label} {n !== null && <span style={{ color: 'var(--parchment-dim)', fontWeight: 400 }}>· {n}</span>}</button>
          ))}
        </div>

        {tab === 'purchases' && (
          <PurchasesPanel orders={orders} loading={ordersLoading} onOpenVideo={onOpenVideo} />
        )}

        {tab === 'collections' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>SORTED BY LAST UPDATED</div>
              <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">+ New board</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 60 }}>
              {cols.map(c => <BoardCard key={c.id} col={c} onClick={() => setSelectedCol(c)} />)}
            </div>
          </div>
        )}

        {tab === 'liked' && (
          <div style={{
            columnCount: 4, columnGap: 14, marginBottom: 60,
          }}>
            {liked.map((v, i) => (
              <div key={v.id} onClick={() => onOpenVideo(v)}
                style={{ breakInside: 'avoid', marginBottom: 14, cursor: 'pointer' }}>
                <div style={{
                  aspectRatio: [1, 1.6, 1.2, 0.75, 1.3, 0.9][i % 6],
                  background: thumbGradient(i + 7),
                  borderRadius: 6, overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)' }}>{v.duration}</div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '20px 12px 10px',
                    background: 'linear-gradient(to top, rgba(13,20,16,0.85), transparent)',
                    color: '#f5ede0',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{v.title}</div>
                    <div style={{ fontSize: 10, opacity: 0.75 }}>{v.creator.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'following' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 60 }}>
            {CREATORS.concat(CREATORS).slice(0, 8).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: 16, border: '1px solid var(--line)', borderRadius: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.name} {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>{c.handle} · {c.region}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.1em' }}>
                    {formatViews(c.followers)} FOLLOWERS · {c.videos} CLIPS
                  </div>
                </div>
                <button className="btn secondary" style={{ fontSize: 12, alignSelf: 'flex-start' }} data-placeholder="true">Following</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div style={{ marginBottom: 60 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 12 }}>LAST 30 DAYS</div>
            {[
              ['Mar 14, 2026 · 09:42', 'Saved to collection', 'Golden Hour Ascent — Director\u2019s Edit', 'Dawn & Gold'],
              ['Mar 12, 2026 · 18:31', 'Purchased · Commercial', 'Cinematic Flight 4K — Aerial Study', '$17.98'],
              ['Mar 10, 2026 · 12:06', 'Followed pilot', 'Sky Waltz', null],
              ['Mar 08, 2026 · 21:15', 'Liked', 'Above the Clouds — Director\u2019s Edit', null],
              ['Mar 05, 2026 · 07:55', 'Purchased · Personal', 'Dawn Patrol — Aerial Study', '$4.99'],
              ['Mar 01, 2026 · 14:22', 'Created board', 'Coastal Vertical', null],
            ].map(([ts, kind, title, extra], i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.1em', width: 160, flexShrink: 0, paddingTop: 2 }}>{ts}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 3 }}>{kind}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                </div>
                {extra && <div style={{ alignSelf: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>→ {extra}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardCard({ col, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', display: 'block' }}>
      <div style={{
        aspectRatio: '4/3', display: 'grid',
        gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr',
        gap: 2, borderRadius: 6, overflow: 'hidden',
        border: '1px solid var(--line-strong)',
      }}>
        {col.cover.slice(0, 4).map((vid, i) => (
          <div key={i} style={{
            background: thumbGradient((vid.charCodeAt(1) || 0) + i),
            gridRow: i === 0 ? '1 / span 2' : 'auto',
            gridColumn: i === 0 ? '1' : '2',
          }}/>
        ))}
      </div>
      <div style={{ padding: '10px 2px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {col.name}
            {col.private && <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--parchment-dim)', border: '1px solid var(--line)', padding: '1px 5px', borderRadius: 2 }}>PRIVATE</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 2 }}>{col.count} clips · Updated {col.updated}</div>
        </div>
      </div>
    </button>
  );
}

function CollectionDetail({ col, onBack, onOpenVideo }) {
  // Pinterest-style masonry of the clips in this board
  const vids = VIDEOS.slice(0, col.count);
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 28px 80px' }}>
      <button onClick={onBack} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 18 }}>← Back to collections</button>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 20 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 8 }}>
            COLLECTION · {col.count} CLIPS · UPDATED {col.updated.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.05 }}>{col.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Edit board</button>
          <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Share</button>
          <button className="btn" style={{ fontSize: 12 }} data-placeholder="true">+ Add clips</button>
        </div>
      </div>
      <div style={{ columnCount: 4, columnGap: 14 }}>
        {vids.map((v, i) => {
          const heights = [220, 300, 260, 180, 340, 220, 280, 200, 310, 240];
          return (
            <div key={v.id} onClick={() => onOpenVideo(v)}
              style={{ breakInside: 'avoid', marginBottom: 14, cursor: 'pointer' }}>
              <div style={{
                height: heights[i % heights.length],
                background: thumbGradient(i),
                borderRadius: 6, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)' }}>{v.duration}</div>
                {v.price > 0 && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--sunset)', color: '#faf6ec', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${v.price}</div>}
              </div>
              <div style={{ padding: '8px 2px 2px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 2 }}>{v.creator.handle} · {formatViews(v.views)} views</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// PurchasesPanel — list of buyer's orders with 7-day download window
// ─────────────────────────────────────────────────────────────────
function PurchasesPanel({ orders, loading, onOpenVideo }) {
  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading your purchases…</div>;
  }
  if (!orders.length) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: 'var(--parchment)', marginBottom: 6 }}>No purchases yet</div>
        <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>Licensed clips will appear here with a 7-day download window.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 60 }}>
      {orders.map(o => <PurchaseRow key={o.id} order={o} onOpenVideo={onOpenVideo} />)}
    </div>
  );
}

function PurchaseRow({ order, onOpenVideo }) {
  const [downloading, setDownloading] = useState(false);
  const [tick, setTick] = useState(0);
  // tick every 30s to refresh countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const v = order.video || {};
  const expiresAt = order.cacheExpiresAt ? new Date(order.cacheExpiresAt) : null;
  const now = new Date();
  const msLeft = expiresAt ? (expiresAt - now) : 0;
  const expired = expiresAt && msLeft <= 0;
  const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
  const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
  const windowLabel = expired ? 'Expired' :
    (daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h left` : `${hoursLeft}h left`);

  const cached = !!order.cachedUrl && !expired;
  const preparing = !order.cachedUrl && !expired && order.status === 'complete';

  const thumb = v.thumb_url || v.thumbUrl ||
    (v.youtube_id || v.yt_id ? `https://i.ytimg.com/vi/${v.youtube_id || v.yt_id}/hqdefault.jpg` : null);

  const onDownload = async () => {
    if (!cached) return;
    setDownloading(true);
    try {
      const url = await buildCacheDownloadUrl(order.cachedUrl);
      if (!url) throw new Error('Download URL not available (worker not configured)');
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = (v.title || 'clip').replace(/[^\w\-]+/g, '_') + '.mp4';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Log event (fire-and-forget)
      logDownloadEvent({ orderId: order.id, videoId: order.videoId, httpStatus: 200 });
    } catch (e) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 16,
      padding: 14, border: '1px solid var(--line)', borderRadius: 6,
      background: 'var(--forest-900)', alignItems: 'center',
    }}>
      <div style={{
        aspectRatio: '16/9', borderRadius: 4, overflow: 'hidden',
        background: thumb ? `center / cover no-repeat url('${thumb}')` : 'var(--forest-800)',
        cursor: v.id ? 'pointer' : 'default',
      }} onClick={() => v.id && onOpenVideo?.(v)} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.title || 'Untitled'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>
          {order.license} license · {order.card} · {order.date}
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, alignItems: 'center' }}>
          <span className="mono" style={{ padding: '2px 8px', borderRadius: 999,
            background: expired ? 'rgba(139,58,31,0.15)' : (cached ? 'rgba(139,154,91,0.15)' : 'rgba(198,136,32,0.15)'),
            color: expired ? 'var(--rust)' : (cached ? 'var(--lichen)' : 'var(--amber)'),
            border: '1px solid ' + (expired ? 'var(--rust)' : (cached ? 'var(--lichen)' : 'var(--amber)')),
            letterSpacing: '0.1em',
          }}>{expired ? 'EXPIRED' : (cached ? 'READY' : 'PREPARING')}</span>
          <span style={{ color: 'var(--parchment-dim)' }}>{windowLabel}</span>
          {order.downloadCount > 0 && (
            <span style={{ color: 'var(--parchment-dim)' }}>
              · Downloaded {order.downloadCount}×
            </span>
          )}
        </div>
      </div>
      <div>
        <button
          onClick={onDownload}
          disabled={!cached || downloading}
          className="btn"
          style={{
            padding: '10px 18px', fontSize: 13,
            opacity: (!cached || downloading) ? 0.45 : 1,
            cursor: (!cached || downloading) ? 'not-allowed' : 'pointer',
            minWidth: 120,
          }}>
          {downloading ? 'Preparing…' : (expired ? 'Window closed' : (cached ? 'Download' : 'Preparing…'))}
        </button>
      </div>
    </div>
  );
}
