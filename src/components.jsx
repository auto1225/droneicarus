// components.jsx — shared UI: header, chips, video card, footer
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, CAT_ICONS, LOCATIONS, VIDEOS, thumbGradient, CURRENT_USER, STATS } from './data';
import { useAuth } from './auth/AuthContext';

// ——— Icons (inline SVG) ———
export const Ic = {
  search: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  drone: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M7 7l2 2M17 7l-2 2M7 17l2-2M17 17l-2-2"/></svg>),
  upload: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v14M6 9l6-6 6 6M4 21h16"/></svg>),
  play: (size=14) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>),
  lock: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>),
  pin: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  eye: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>),
  heart: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>),
  fire: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s4 4 4 8a4 4 0 01-8 0c0-2 2-3 2-5 4 1 6 4 6 7a6 6 0 11-12 0c0-5 8-10 8-10z"/></svg>),
  check: () => (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l6 6L20 6"/></svg>),
  grid: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>),
  menu: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>),
  close: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>),
  chevron: (d='right') => {
    const rot = {right:0,left:180,up:-90,down:90}[d];
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:`rotate(${rot}deg)`}}><path d="M9 6l6 6-6 6"/></svg>);
  },
  star: () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>),
  crown: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 8l5 4 5-7 5 7 5-4-2 12H4z"/></svg>),
};

export function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
export function formatDays(d) {
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d/7)}w ago`;
  if (d < 365) return `${Math.round(d/30)}mo ago`;
  return `${Math.round(d/365)}y ago`;
}

// ——— Search Autocomplete Dropdown ———
export function SearchDropdown({ query, onNav, onSelect, onClose }) {
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState(null); // null = use mock, object = server results
  const q = query.trim().toLowerCase();

  // When DB-backed search is enabled, hit Supabase on query change (debounced).
  useEffect(() => {
    if (!q) { setRemote(null); return; }
    if (import.meta.env.VITE_USE_SUPABASE_DATA !== 'true') { setRemote(null); return; }
    let alive = true;
    const t = setTimeout(async () => {
      const { searchAll } = await import('./db/search');
      const r = await searchAll(q);
      if (alive) setRemote(r);
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const locMatches = q ? (remote?.locations ?? LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
  )).slice(0, 5) : [];
  const creatorMatches = q ? (remote?.creators ?? VIDEOS
    .map(v => v.creator).filter((c,i,a) => a.findIndex(x => x.handle === c.handle) === i)
    .filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q))
  ).slice(0, 3) : [];
  const videoMatches = q ? (remote?.videos ?? VIDEOS.filter(v =>
    v.title.toLowerCase().includes(q) || v.tags?.some(t => t.toLowerCase().includes(q))
  )).slice(0, 4) : [];

  const recents = q ? [] : ['Pyramids of Giza', 'Namsan Tower', 'sunrise mountain', 'aerial beach 4K'];
  const trending = q ? [] : [
    { label: 'Golden hour coast', count: '1.2K clips' },
    { label: 'Glacier & ice', count: '892 clips' },
    { label: 'FPV dives', count: '560 clips' },
    { label: 'City skylines', count: '2.4K clips' },
  ];

  const hasResults = locMatches.length + creatorMatches.length + videoMatches.length > 0;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="search-dd" onMouseDown={e => e.preventDefault()}>
      {!q && (
        <>
          <div className="search-dd-section">Recent</div>
          {recents.map((r, i) => (
            <div key={r} className="search-dd-item" onClick={() => { onNav('search'); onClose(); }}>
              <span className="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
              <span style={{ flex: 1 }}>{r}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>→</span>
            </div>
          ))}
          <div className="search-dd-section" style={{ marginTop: 8 }}>Trending</div>
          {trending.map(t => (
            <div key={t.label} className="search-dd-item" onClick={() => { onNav('search'); onClose(); }}>
              <span className="icon" style={{ color: 'var(--sunset)' }}><Ic.fire/></span>
              <div style={{ flex: 1 }}>
                <div>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{t.count}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {q && !hasResults && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--parchment-dim)' }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>No matches for "{query}"</div>
          <div style={{ fontSize: 11 }}>Try a place name, creator handle, or keyword like "sunset" or "coastline"</div>
        </div>
      )}

      {locMatches.length > 0 && (
        <>
          <div className="search-dd-section">Locations</div>
          {locMatches.map(l => (
            <div key={l.id} className="search-dd-item" onClick={() => { onSelect?.({ type: 'location', data: l }); onNav('location', l.id); onClose(); }}>
              <span className="icon" style={{ color: 'var(--amber)' }}><Ic.pin/></span>
              <div style={{ flex: 1 }}>
                <div>{l.name}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{l.country}{l.videos != null ? ` · ${l.videos} clips` : ''}</div>
              </div>
              <span className="kbd">↵</span>
            </div>
          ))}
        </>
      )}

      {creatorMatches.length > 0 && (
        <>
          <div className="search-dd-section">Creators</div>
          {creatorMatches.map(c => (
            <div key={c.handle} className="search-dd-item" onClick={() => { onNav('profile', c.handle.slice(1)); onClose(); }}>
              <span className="icon" style={{ background: 'var(--sunset)', color: '#faf6ec', borderRadius: '50%' }}>{c.name[0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.name}
                  {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{c.handle}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {videoMatches.length > 0 && (
        <>
          <div className="search-dd-section">Clips</div>
          {videoMatches.map(v => (
            <div key={v.id} className="search-dd-item" onClick={() => { onSelect?.({ type: 'video', data: v }); onClose(); }}>
              <span className="icon" style={{ width: 48, height: 30, background: thumbGradient(parseInt(v.id.slice(1))), color: '#faf6ec' }}>
                <Ic.play size={11}/>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v.creator.handle} · {v.duration} · {v.resolution}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--parchment-dim)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> open</span>
          <span><span className="kbd">esc</span> close</span>
        </div>
        <button onClick={() => { onNav('search'); onClose(); }} style={{ color: 'var(--sunset)', fontWeight: 600 }}>
          See all results →
        </button>
      </div>
    </div>
  );
}

// ——— Header ———
export function Header({ route, onNav, query, setQuery }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  // Cmd+K / Ctrl+K focus
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setDdOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const links = [
    { id: 'home', label: 'Map' },
    { id: 'explore', label: 'Explore' },
    { id: 'shotlibrary', label: 'Shots' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'creators', label: 'Creators' },
    { id: 'atlas', label: 'Atlas' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'live', label: 'Live' },
  ];
  const { profile, user, signOut } = useAuth();
  // Prefer real signed-in profile; fall back to mock for guest preview.
  const u = profile ? {
    id: profile.id,
    name: profile.display_name,
    handle: profile.handle,
    email: profile.email,
    initials: (profile.display_name || profile.handle || '?').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
    pilotVerified: profile.pilot_verified,
    avatarUrl: profile.avatar_url,
  } : CURRENT_USER;
  const isGuest = !user;
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--surface-glass)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '14px 28px', maxWidth: 1760, margin: '0 auto',
      }}>
        <button onClick={() => onNav('home')} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--amber)' }}><Ic.drone/></span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Drone<span style={{ color: 'var(--sunset)' }}>Icarus</span>
          </span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--parchment-dim)', marginLeft: 4, border: '1px solid var(--line)', padding: '2px 5px', borderRadius: 2 }}>BETA</span>
        </button>

        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => onNav(l.id)} style={{
              padding: '8px 14px',
              fontSize: 14,
              color: route === l.id ? 'var(--bone)' : 'var(--parchment-dim)',
              borderBottom: route === l.id ? '2px solid var(--amber)' : '2px solid transparent',
              marginBottom: -1,
            }}>{l.label}</button>
          ))}
        </nav>

        <div ref={searchRef} style={{ flex: 1, maxWidth: 560, marginLeft: 'auto', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--forest-900)',
            border: '1px solid ' + (ddOpen ? 'var(--sunset)' : 'var(--line)'),
            borderRadius: 999, padding: '9px 18px',
            transition: 'border-color 0.15s',
            boxShadow: ddOpen ? '0 0 0 3px rgba(200,90,46,0.12)' : 'none',
          }}>
            <span style={{ color: 'var(--parchment-dim)' }}><Ic.search/></span>
            <input
              ref={inputRef}
              value={query}
              onFocus={() => setDdOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setDdOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onNav('search'); setDdOpen(false); }
                if (e.key === 'Escape') { setDdOpen(false); inputRef.current?.blur(); }
              }}
              placeholder='Search place, creator, or keyword — e.g. "Pyramids", "sunrise mountain"'
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--bone)', fontSize: 14, fontFamily: 'inherit',
                boxShadow: 'none',
              }}
            />
            <span className="kbd">⌘K</span>
          </div>
          {ddOpen && <SearchDropdown query={query} onNav={onNav} onClose={() => setDdOpen(false)} />}
        </div>

        <button onClick={() => onNav('advanced')} title="Advanced filters" style={{
          width: 40, height: 40, borderRadius: 999,
          border: '1px solid var(--line)', background: 'var(--forest-900)',
          color: 'var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/>
            <circle cx="10" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="7" cy="18" r="2" fill="currentColor"/>
          </svg>
        </button>

        <button onClick={() => onNav('notifications')} title="Notifications" style={{
          position: 'relative',
          width: 40, height: 40, borderRadius: 999,
          border: '1px solid var(--line)', background: 'var(--forest-900)',
          color: 'var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/>
          </svg>
          <span className="badge-dot"/>
        </button>

        {profile?.role === 'admin' && (
          <button onClick={() => onNav('admin')} className="btn" style={{ fontSize: 13, background: 'var(--amber)', color: '#1a2820', fontWeight: 700, letterSpacing: '0.08em' }}>CMS</button>
        )}
        <button className="btn secondary" onClick={() => onNav('upload')} style={{ fontSize: 13 }}>
          <Ic.upload/> Upload
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(v => !v)} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--sunset)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#faf6ec',
            border: '1px solid var(--line-strong)',
          }}>{u.initials}</button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0, zIndex: 200,
              width: 260, background: 'var(--ink)',
              border: '1px solid var(--line-strong)',
              borderRadius: 6, boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}>
              <button onClick={() => { setMenuOpen(false); onNav('profile', u.handle.slice(1)); }} style={{
                display: 'flex', gap: 12, alignItems: 'center', width: '100%',
                padding: '14px 16px', borderBottom: '1px solid var(--line)', textAlign: 'left',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--sunset)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#faf6ec',
                }}>{u.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {u.name}
                    {u.pilotVerified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{u.handle} · View profile</div>
                </div>
              </button>
              {(isGuest ? [
                ['signin', 'Sign in / Sign up'],
                ['guidelines', 'Code of conduct'],
                ['legal', 'Licensing & legal'],
              ] : [
                ['mypage', 'My collections'],
                ['messages', 'Messages'],
                ['notifications', 'Notifications'],
                ['orders', 'Orders & licenses'],
                ['creator', 'Creator studio'],
                ['earnings', 'Earnings'],
                ['commission', 'Commission a shoot'],
                ['settings', 'Settings'],
                ['pilot-onboarding', 'Become a verified pilot'],
                ['guidelines', 'Code of conduct'],
                ['legal', 'Licensing & legal'],
              ]).map(([id, label]) => (
                <button key={id} onClick={() => { setMenuOpen(false); onNav(id); }} style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  fontSize: 13, color: 'var(--bone)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-900)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {label}
                </button>
              ))}
              {!isGuest && (
                <button onClick={async () => { setMenuOpen(false); await signOut(); onNav('home'); }} style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  fontSize: 13, color: 'var(--sunset)', borderTop: '1px solid var(--line)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-900)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Sign out
                </button>
              )}
              <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>ID · {u.id}</span>
                <span>KR · ko</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ——— Category Chip Bar ———
export function CategoryChips({ active, onChange, compact = false }) {
  const scrollRef = useRef(null);
  return (
    <div style={{ position: 'relative', padding: compact ? '10px 0' : '16px 0' }}>
      <div ref={scrollRef} style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 28px',
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(c => {
          const Icon = CAT_ICONS[c.id];
          return (
            <button key={c.id} onClick={() => onChange(c.id)}
              className={'chip' + (active === c.id ? ' active' : '')}>
              <span className="chip-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{Icon && Icon(13)}</span>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ——— Video Card ———
export function VideoCard({ video, onClick, size = 'md', showRank = false }) {
  const loc = LOCATIONS.find(l => l.id === video.locationId);
  const [hover, setHover] = useState(false);
  return (
    <article
      className="video-card fade-in"
      onClick={() => onClick(video)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="video-card-thumb" style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        background: thumbGradient(parseInt(video.id.slice(1))),
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid var(--line)',
      }}>
        {/* Topographic lines faux */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} viewBox="0 0 400 225" preserveAspectRatio="none">
          <g stroke="rgba(245,237,224,0.4)" fill="none" strokeWidth="0.5">
            {[...Array(6)].map((_, i) => (
              <path key={i} d={`M0 ${40 + i*30} Q100 ${20 + i*30} 200 ${50 + i*30} T400 ${30 + i*30}`}/>
            ))}
          </g>
        </svg>

        {video.price > 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--thumb-overlay)',
            border: '1px solid var(--sunset)',
            padding: '4px 8px', borderRadius: 2,
            fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--sunset)',
          }}><Ic.lock/> ${video.price}</div>
        )}
        {video.price === 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
          }} className="tag-free">FREE</div>
        )}

        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'var(--thumb-overlay)',
          padding: '3px 7px', borderRadius: 2,
          fontSize: 11, fontFamily: 'var(--font-mono)', color: '#f5ede0',
        }}>{video.duration}</div>

        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
          color: '#f5ede0', background: 'var(--thumb-overlay)',
          padding: '3px 6px', border: '1px solid var(--line-strong)', borderRadius: 2,
        }}>{video.resolution}</div>

        {showRank && video.rank && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700,
            color: 'var(--amber)', textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'baseline', gap: 2,
          }}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>#</span>{video.rank}
          </div>
        )}

        {/* Hover play overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hover ? 'rgba(13, 20, 16, 0.4)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
          pointerEvents: 'none',
        }}>
          {hover && (
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--sunset)', color: 'var(--bone)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Ic.play size={18}/></div>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'var(--moss)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--bone)',
            border: '1px solid var(--line)',
          }}>{video.creator.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              fontSize: 14, fontWeight: 600, marginBottom: 4,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: 1.35, fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em',
            }}>{video.title}</h4>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{video.creator.handle}</span>
              {video.creator.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ color: 'var(--lichen)' }}><Ic.pin/></span>
              <span>{loc?.name}</span>
              <span>·</span>
              <span>{formatViews(video.views)} views</span>
              <span>·</span>
              <span>{formatDays(video.uploadedDaysAgo)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ——— Footer ———
const FOOTER_LINK_ROUTES = {
  'Map': 'home',
  'Categories': 'explore',
  'Rankings': 'rankings',
  '’': 'explore', // Editor’s Picks matches by endsWith("Picks")
  'Upload': 'upload',
  'Licensing': 'legal',
  'Payouts': 'earnings',
  'Guidelines': 'guidelines',
  'About': 'legal',
  'Press': 'legal',
  'Careers': 'legal',
  'Contact': 'legal',
  'Terms': 'legal',
  'Privacy': 'legal',
  'DMCA': 'legal',
  'Airspace': 'legal',
};
function footerRoute(label) {
  if (label.includes('Picks')) return 'explore';
  return FOOTER_LINK_ROUTES[label] || 'home';
}

export function Footer({ onNav }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      marginTop: 60,
      padding: '40px 28px 30px',
      background: 'var(--forest-950)',
    }}>
      <div style={{ maxWidth: 1760, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ color: 'var(--amber)' }}><Ic.drone/></span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>
              Drone<span style={{ color: 'var(--sunset)' }}>Icarus</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--parchment-dim)', maxWidth: 360, lineHeight: 1.6 }}>
            The atlas of aerial footage. Browse the world from above — from Giza to Namsan, from storm fronts to submarine trenches.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <span className="mono" style={{ fontSize: 10, padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--parchment-dim)' }}>EST. 2026</span>
            <span className="mono" style={{ fontSize: 10, padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--parchment-dim)' }}>{STATS.projected.countries} COUNTRIES</span>
          </div>
        </div>
        {[
          { t: 'Explore', links: ['Map', 'Categories', 'Rankings', 'Editor\u2019s Picks'] },
          { t: 'For Pilots', links: ['Upload', 'Licensing', 'Payouts', 'Guidelines'] },
          { t: 'Company', links: ['About', 'Press', 'Careers', 'Contact'] },
          { t: 'Legal', links: ['Terms', 'Privacy', 'DMCA', 'Airspace'] },
        ].map(col => (
          <div key={col.t}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{col.t}</div>
            {col.links.map(l => (
              <button key={l} onClick={() => onNav?.(footerRoute(l))} style={{ display: 'block', background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--parchment)', marginBottom: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1760, margin: '30px auto 0', paddingTop: 20,
        borderTop: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)',
      }}>
        <span>© 2026 Drone Icarus — icarus.fly</span>
        <span>N 37°33'04" / E 126°58'18" — Seoul HQ</span>
      </div>
    </footer>
  );
}

// Reusable follow button — wires real Supabase follows for UUID profiles,
// otherwise just toggles local UI + toast (so demo creators give feedback).
export function FollowButton({ creatorId, creatorHandle, className = 'btn', style }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const isUuid = typeof creatorId === 'string' && /^[0-9a-f]{8}-/.test(creatorId);

  useEffect(() => {
    if (!isUuid) return;
    import('./db/social').then(({ isFollowing }) => isFollowing(creatorId).then(setFollowing).catch(() => {}));
  }, [creatorId, isUuid]);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isUuid) {
        const { toggleFollow } = await import('./db/social');
        const now = await toggleFollow(creatorId);
        setFollowing(now);
        (window.toast || (() => {}))(now ? 'Following' : 'Unfollowed', creatorHandle || '', 'success');
      } else {
        // Mock creator — toggle UI, friendly toast
        setFollowing(v => !v);
        (window.toast || (() => {}))(following ? 'Unfollowed' : 'Following', (creatorHandle || 'pilot') + ' (demo)', 'info');
      }
    } catch (e) {
      (window.toast || (() => {}))('Sign in to follow', e.message || '', 'error');
    } finally { setBusy(false); }
  };

  return (
    <button className={className + (following ? ' secondary' : '')} style={style} onClick={onClick} disabled={busy}>
      {following ? 'Following' : 'Follow'}
    </button>
  );
}


