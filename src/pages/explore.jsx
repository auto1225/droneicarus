// pages/explore.jsx — Explore (sidebar + hierarchy) + SearchPage
import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES, LOCATIONS, VIDEOS as _MOCK_VIDEOS, CREATORS } from '../data';
import { fetchVideos } from '../db/videos';
import { Ic, formatViews, VideoCard, FollowButton, Pagination, usePagination } from '../components';
import { useContent } from '../content/ContentContext';

/* ─────────────────────────────────────────────
   Default hierarchy — used if site_content has none
   ───────────────────────────────────────────── */
const DEFAULT_HIERARCHY = {
  groups: [
    { id: 'nature', label: 'Nature', icon: 'mountain', children: [
      { id: 'mountain',     label: 'Mountain & Glacier', fine: ['mountain','glacier'] },
      { id: 'volcano',      label: 'Volcano',            fine: ['volcano'] },
      { id: 'waterfall',    label: 'Waterfall',          fine: ['waterfall'] },
      { id: 'forest',       label: 'Forest & Jungle',    fine: ['rainforest'] },
      { id: 'desert',       label: 'Desert & Dunes',     fine: ['desert','dunes'] },
      { id: 'landscape',    label: 'Landscape',          fine: ['landscape'] },
    ]},
    { id: 'water', label: 'Ocean & Coast', icon: 'water', children: [
      { id: 'open-ocean',   label: 'Open Ocean',     fine: ['ocean'] },
      { id: 'atoll',        label: 'Atolls & Reefs', fine: ['atoll'] },
      { id: 'coast',        label: 'Coastal Cliffs', fine: ['coastal-cliff'] },
      { id: 'marine-life',  label: 'Marine Life',    fine: ['marine-life'] },
      { id: 'polar',        label: 'Polar & Ice',    fine: ['polar'] },
    ]},
    { id: 'sky', label: 'Sky & Weather', icon: 'sky', children: [
      { id: 'aurora',       label: 'Aurora',         fine: ['aurora'] },
      { id: 'phenomena',    label: 'Phenomena',      fine: ['phenomena'] },
      { id: 'fireworks',    label: 'Fireworks',      fine: ['fireworks'] },
      { id: 'drone-show',   label: 'Drone Shows',    fine: ['drone-show'] },
    ]},
    { id: 'cities', label: 'Cities', icon: 'city', children: [
      { id: 'skyline',      label: 'Skylines',       fine: ['cityscape'] },
      { id: 'architecture', label: 'Architecture',   fine: ['architecture'] },
      { id: 'bridge',       label: 'Bridges',        fine: ['bridge'] },
      { id: 'port',         label: 'Ports & Harbors',fine: ['port'] },
    ]},
    { id: 'heritage', label: 'Heritage', icon: 'heritage', children: [
      { id: 'ruins',        label: 'Ancient Ruins',  fine: ['ancient-ruins'] },
      { id: 'temple',       label: 'Temples & Shrines', fine: ['temple'] },
      { id: 'castle',       label: 'Castles & Palaces', fine: ['castle'] },
    ]},
    { id: 'human-landscape', label: 'Human Landscape', icon: 'agriculture', children: [
      { id: 'vineyard',     label: 'Vineyards',     fine: ['vineyard'] },
      { id: 'rice-terrace', label: 'Rice Terraces', fine: ['rice-terrace'] },
      { id: 'flower-field', label: 'Flower Fields', fine: ['flower-field'] },
    ]},
    { id: 'action', label: 'Action & Sports', icon: 'action', children: [
      { id: 'fpv-racing',   label: 'FPV Racing',    fine: ['aerial-sports'] },
      { id: 'surfing',      label: 'Surfing',       fine: ['surfing'] },
      { id: 'skiing',       label: 'Skiing & Snow', fine: ['skiing'] },
    ]},
    { id: 'wildlife', label: 'Wildlife', icon: 'wildlife', children: [
      { id: 'safari',       label: 'Safari Big Game', fine: ['wildlife-safari'] },
    ]},
    { id: 'industry', label: 'Industry & Energy', icon: 'industry', children: [
      { id: 'wind-farm',    label: 'Wind Farms',  fine: ['wind-farm'] },
      { id: 'solar-farm',   label: 'Solar Farms', fine: ['solar-farm'] },
    ]},
    { id: 'warfare', label: 'Warfare & Defense', icon: 'warfare', children: [
      { id: 'ukraine-war',  label: 'Ukraine · Russia',   fine: ['war-ukraine','war-russia'] },
      { id: 'middle-east',  label: 'Middle East',        fine: ['war-mideast','war-israel','war-gaza','war-iran'] },
      { id: 'autonomous',   label: 'Autonomous Swarms',  fine: ['war-swarm','war-autonomous'] },
      { id: 'counter-uav',  label: 'Counter-UAV',        fine: ['war-counter'] },
      { id: 'platforms',    label: 'Platforms (MQ-9/Bayraktar/Shahed)', fine: ['war-platform'] },
    ]},
    { id: 'ai', label: 'AI Generated', icon: 'ai', children: [
      { id: 'ai-aerial',    label: 'AI Aerial',          fine: ['ai-aerial'] },
    ]},
  ],
};

function parseHierarchy(raw) {
  if (!raw) return DEFAULT_HIERARCHY;
  if (typeof raw === 'object' && raw.groups) return raw;
  try { const p = JSON.parse(raw); return p?.groups ? p : DEFAULT_HIERARCHY; }
  catch { return DEFAULT_HIERARCHY; }
}

/* ─────────────────────────────────────────────
   ExplorePage — sidebar tree + video grid
   ───────────────────────────────────────────── */
export function ExplorePage({ onOpenVideo, onNav }) {
  const title    = useContent('explore.hero.title',    'Every sky has a name.');
  const subtitle = useContent('explore.hero.subtitle', "Browse footage by what's in the frame.");
  const hierarchyRaw = useContent('explore.hierarchy', null);
  const hierarchy = useMemo(() => parseHierarchy(hierarchyRaw), [hierarchyRaw]);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    fetchVideos().then(v => {
      if (cancel) return;
      setVideos((v && v.length > 0) ? v : _MOCK_VIDEOS);
      setLoading(false);
    });
    return () => { cancel = true; };
  }, []);

  // selected: null = all | { type:'group', id } | { type:'child', id, groupId, fine[] }
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [sort, setSort] = useState('newest');
  const [licenseFilter, setLicenseFilter] = useState('all'); // all | free | paid | commercial | extended | exclusive | pilot
  const [query, setQuery] = useState('');
  // Default: groups collapsed — user expands what they want. Keeps sidebar within viewport without scrolling.

  // count map: byFine[fine] = N — counts reflect the active license + query filters
  // so the sidebar stays in sync with whatever the user has chosen on top.
  // (Category selection is intentionally NOT applied — that's the dimension
  // the sidebar is letting you pick from.)
  const counts = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const matchesQuery = (v) => {
      if (!q) return true;
      return (v.title || '').toLowerCase().includes(q)
        || (v.description || '').toLowerCase().includes(q)
        || (v.creator?.name || '').toLowerCase().includes(q)
        || (v.creator?.handle || '').toLowerCase().includes(q)
        || (v.tags || []).some(t => String(t).toLowerCase().includes(q));
    };
    const matchesLicense = (v) => {
      if (licenseFilter === 'all')   return true;
      if (licenseFilter === 'free')  return Number(v.price || 0) === 0;
      if (licenseFilter === 'paid')  return Number(v.price || 0) > 0;
      if (licenseFilter === 'pilot') return v.source && v.source !== 'youtube';
      return Array.isArray(v.licenseTiers) && v.licenseTiers.includes(licenseFilter);
    };
    const visible = videos.filter(v => matchesLicense(v) && matchesQuery(v));
    const byFine = {};
    visible.forEach(v => {
      const fine = v.category;
      if (fine && fine !== 'drone') byFine[fine] = (byFine[fine] || 0) + 1;
    });
    const groups = {}, children = {};
    hierarchy.groups.forEach(g => {
      let s = 0;
      g.children.forEach(c => {
        const n = (c.fine || []).reduce((a, f) => a + (byFine[f] || 0), 0);
        children[`${g.id}/${c.id}`] = n; s += n;
      });
      groups[g.id] = s;
    });
    return { byFine, groups, children, total: visible.length };
  }, [videos, hierarchy, licenseFilter, query]);

  const filtered = useMemo(() => {
    if (!selected) return videos;
    if (selected.type === 'group') {
      const g = hierarchy.groups.find(x => x.id === selected.id);
      if (!g) return [];
      const set = new Set(g.children.flatMap(c => c.fine || []));
      return videos.filter(v => v.category && set.has(v.category));
    }
    if (selected.type === 'child') {
      const set = new Set(selected.fine || []);
      return videos.filter(v => v.category && set.has(v.category));
    }
    return videos;
  }, [videos, selected, hierarchy]);

  // apply text search on top of category filter
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(v =>
      (v.title || '').toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.creator?.name || '').toLowerCase().includes(q) ||
      (v.creator?.handle || '').toLowerCase().includes(q) ||
      (v.tags || []).some(t => String(t).toLowerCase().includes(q))
    );
  }, [filtered, query]);
  // license filter overlay
  const licenseFiltered = useMemo(() => {
    if (licenseFilter === 'all') return searched;
    return searched.filter(v => {
      if (licenseFilter === 'free')      return Number(v.price || 0) === 0;
      if (licenseFilter === 'paid')      return Number(v.price || 0) > 0;
      if (licenseFilter === 'pilot')     return v.source && v.source !== 'youtube';
      // tier-specific: must include this tier
      return Array.isArray(v.licenseTiers) && v.licenseTiers.includes(licenseFilter);
    });
  }, [searched, licenseFilter]);



  const sorted = useMemo(() => {
    const arr = [...licenseFiltered];
    if (sort === 'newest')  arr.sort((a,b) => (b.uploadedDaysAgo||0) > (a.uploadedDaysAgo||0) ? -1 : 1);
    else if (sort === 'rated') arr.sort((a,b) => (b.qualityScore||0) - (a.qualityScore||0));
    else if (sort === 'free')  arr.sort((a,b) => (a.price||0) - (b.price||0));
    else arr.sort((a,b) => (b.views||0) - (a.views||0));
    return arr;
  }, [licenseFiltered, sort]);

  // Pagination — 24 clips per page; resets on filter/search/sort change
  const { page, setPage, pageCount, slice: pagedSlice } = usePagination(sorted, 24);

  const headerText = !selected ? useContent('explore.header.all_clips', 'All Clips')
    : selected.type === 'group'
      ? hierarchy.groups.find(g => g.id === selected.id)?.label
      : hierarchy.groups.find(g => g.id === selected.groupId)?.children.find(c => c.id === selected.id)?.label;

  const toggleGroup = (id) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="explore-layout">
      <aside className="explore-sidebar">
        <div className="sidebar-hero">
          <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 6 }}>BROWSE BY THEME</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <button className={`sidebar-all ${!selected ? 'active' : ''}`} onClick={() => setSelected(null)}>
          <span>All</span>
          <span className="count">{counts.total}</span>
        </button>

        <nav className="sidebar-tree">
          {hierarchy.groups.map(group => {
            const open = expanded.has(group.id);
            const isActive = selected?.type === 'group' && selected.id === group.id;
            const groupCount = counts.groups[group.id] || 0;
            if (groupCount === 0) return null;
            return (
              <div key={group.id} className="tree-group">
                <div className="tree-group-row">
                  <button className="tree-group-toggle" onClick={() => toggleGroup(group.id)}
                          aria-label={open ? 'collapse' : 'expand'}>
                    {open ? '▾' : '▸'}
                  </button>
                  <button className={`tree-group-label ${isActive ? 'active' : ''}`}
                          onClick={() => setSelected({ type:'group', id: group.id })}>
                    <span className="icon">{Ic[group.icon] ? Ic[group.icon]() : null}</span>
                    <span className="label">{group.label}</span>
                    <span className="count">{groupCount}</span>
                  </button>
                </div>
                {open && (
                  <ul className="tree-children">
                    {group.children.map(child => {
                      const cnt = counts.children[`${group.id}/${child.id}`] || 0;
                      if (cnt === 0) return null;
                      const ca = selected?.type==='child' && selected.id===child.id && selected.groupId===group.id;
                      return (
                        <li key={child.id}>
                          <button className={`tree-child ${ca ? 'active' : ''}`}
                                  onClick={() => setSelected({ type:'child', id: child.id, groupId: group.id, fine: child.fine || [] })}>
                            <span className="label">{child.label}</span>
                            <span className="count">{cnt}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="explore-main">
        <header className="explore-header">
          <h1>{headerText} <span className="muted">· {sorted.length} clips</span></h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clips…"
              style={{
                padding: '6px 12px', fontSize: 14,
                background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
                color: 'var(--bone)', borderRadius: 999, outline: 'none',
                width: 200,
              }}/>
            <div className="sort-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginRight: 4 }}>License</span>
              {[['all','All'],['free','Free'],['paid','Paid'],['pilot','Pilot uploads'],['commercial','Commercial'],['extended','Extended'],['exclusive','Exclusive']].map(([k,l]) => (
                <button key={k} className={`chip ${licenseFilter===k?'active':''}`} onClick={() => setLicenseFilter(k)}>{l}</button>
              ))}
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', margin: '0 4px 0 12px' }}>Sort</span>
              {[['trending','Trending'],['newest','Newest'],['rated','Highest rated'],['free','Free first']].map(([k,l]) => (
                <button key={k} className={`chip ${sort===k?'active':''}`} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
        </header>
        {loading ? <div className="explore-loading">Loading…</div>
          : sorted.length === 0 ? <div className="explore-empty">No clips in this category yet.</div>
          : <>
              <div className="video-grid" id="explore-grid-top">
                {pagedSlice.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} />)}
              </div>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={sorted.length} pageSize={24} scrollTargetId="explore-grid-top" />
            </>}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SearchPage — kept as-is (was paired with ExplorePage)
   ───────────────────────────────────────────── */
export function SearchPage({ query, onOpenVideo, onNav, onSelectLoc }) {
  const q = (query || '').toLowerCase().trim();
  const matchedLocs = LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
  );
  const [dbVideosS, setDbVideosS] = useState([]);
  useEffect(() => {
    let cancel = false;
    fetchVideos().then(v => { if (!cancel) setDbVideosS(v || []); });
    return () => { cancel = true; };
  }, []);
  const VIDEOS = dbVideosS.length > 0 ? dbVideosS : _MOCK_VIDEOS;
  const matchedVideos = VIDEOS.filter(v =>
    (v.title||'').toLowerCase().includes(q) ||
    (v.creator?.name||'').toLowerCase().includes(q) ||
    (v.creator?.handle||'').toLowerCase().includes(q) ||
    (v.category||'').toLowerCase().includes(q)
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
              <button key={loc.id} className="di-card" onClick={() => { onSelectLoc(loc); onNav('home'); }} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, textAlign: 'left',
              }}>
                <span style={{ color: 'var(--amber)' }}><Ic.pin/></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{loc.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{loc.country} · {loc.videos} clips</div>
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
              <div key={c.handle} className="di-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--line-strong)' }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.name}
                    {c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{c.handle} · {formatViews(c.followers)} followers</div>
                </div>
                <FollowButton creatorId={c.id || c.handle} creatorHandle={c.handle} className="btn secondary" style={{ fontSize: 14 }} />
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
