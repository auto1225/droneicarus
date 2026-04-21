// pages/mypage.jsx — User profile (viewer-focused) · Pinterest-style collections

const { useState: mpUseState, useMemo: mpUseMemo } = React;

function MyPage({ onOpenVideo, onNav }) {
  const u = window.CURRENT_USER;
  const [tab, setTab] = mpUseState('collections');
  const [selectedCol, setSelectedCol] = mpUseState(null);

  if (selectedCol) return <CollectionDetail col={selectedCol} onBack={() => setSelectedCol(null)} onOpenVideo={onOpenVideo} />;

  const likedIds = ['v0','v2','v5','v8','v11','v14','v17','v20','v23','v26','v29','v32','v35','v38','v41','v44','v47','v50','v53','v56','v59','v62'];
  const liked = likedIds.map(id => window.VIDEOS.find(v => v.id === id)).filter(Boolean);

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
              <span><strong>{window.formatViews(u.followers)}</strong> <span style={{ color: 'var(--parchment-dim)' }}>followers</span></span>
              <span><strong>{u.following}</strong> <span style={{ color: 'var(--parchment-dim)' }}>following</span></span>
              <span><strong>{u.purchases}</strong> <span style={{ color: 'var(--parchment-dim)' }}>licenses</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 10 }}>
            <button className="btn secondary" onClick={() => onNav('settings')}>Edit profile</button>
            <button className="btn">Share</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
          {[
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

        {tab === 'collections' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>SORTED BY LAST UPDATED</div>
              <button className="btn secondary" style={{ fontSize: 12 }}>+ New board</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 60 }}>
              {window.COLLECTIONS.map(c => <BoardCard key={c.id} col={c} onClick={() => setSelectedCol(c)} />)}
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
                  background: window.thumbGradient(i + 7),
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
            {window.CREATORS.concat(window.CREATORS).slice(0, 8).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: 16, border: '1px solid var(--line)', borderRadius: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.name} {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>{c.handle} · {c.region}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.1em' }}>
                    {window.formatViews(c.followers)} FOLLOWERS · {c.videos} CLIPS
                  </div>
                </div>
                <button className="btn secondary" style={{ fontSize: 12, alignSelf: 'flex-start' }}>Following</button>
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
            background: window.thumbGradient((vid.charCodeAt(1) || 0) + i),
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
  const vids = window.VIDEOS.slice(0, col.count);
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
          <button className="btn secondary" style={{ fontSize: 12 }}>Edit board</button>
          <button className="btn secondary" style={{ fontSize: 12 }}>Share</button>
          <button className="btn" style={{ fontSize: 12 }}>+ Add clips</button>
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
                background: window.thumbGradient(i),
                borderRadius: 6, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)' }}>{v.duration}</div>
                {v.price > 0 && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--sunset)', color: '#faf6ec', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${v.price}</div>}
              </div>
              <div style={{ padding: '8px 2px 2px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 2 }}>{v.creator.handle} · {window.formatViews(v.views)} views</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { MyPage });
