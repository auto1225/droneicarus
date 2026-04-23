// pages/lab.jsx — Drone research / projects / hardware / learn / pulse
import React, { useState, useEffect, useMemo } from 'react';
import { useContent } from '../content/ContentContext';
import { Ic, formatViews } from '../components';
import { useAuth } from '../auth/AuthContext';
import { LabPagePreview } from './lab-preview';
import {
  fetchLabItems, fetchLabItem, fetchLabTags,
  toggleLabVote, toggleLabSave, fetchMyVotes, fetchMySaves,
} from '../db/lab';

const SUBSECTIONS = [
  { id: 'research',  label: 'Research',  icon: 'heritage', tagline: 'Papers · Journals' },
  { id: 'patents',   label: 'Patents',   icon: 'patent',   tagline: 'USPTO · EPO · KIPRIS · WIPO · global' },
  { id: 'projects',  label: 'Projects',  icon: 'action',   tagline: 'Open source · DIY builds' },
  { id: 'hardware',  label: 'Hardware',  icon: 'industry', tagline: 'FCs · ESCs · Motors · Batteries' },
  { id: 'learn',     label: 'Learn',     icon: 'sky',      tagline: 'Tutorials · Courses · Guides' },
  { id: 'pulse',     label: 'Pulse',     icon: 'water',    tagline: 'News · Regulations · Events' },
  { id: 'print',     label: 'Print',     icon: 'print3d',  tagline: '3D-printable frames · parts · tools (STL)' },
  { id: 'warfare',   label: 'Warfare',   icon: 'warfare',  tagline: 'Combat · defense · counter-UAV analysis (news + docs)' },
];

// ──────────────────────────────────────────────────────────────────────
// Lab Hub — landing page at /#lab
// ──────────────────────────────────────────────────────────────────────
export function LabHubPage({ onNav }) {
  const title = useContent('lab.hero.title', 'Drone Lab');
  const subtitle = useContent('lab.hero.sub', 'Research, projects, hardware, learning, and industry news — for the people who build, design, and advance what drones can do.');

  const [perSection, setPerSection] = useState({});
  const [counts, setCounts] = useState({});
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState([]);
  useEffect(() => {
    let cancel = false;
    // Fetch preview (6) + total count per subsection
    Promise.all(SUBSECTIONS.map(async s => {
      const [rows, totalRows] = await Promise.all([
        fetchLabItems({ subsection: s.id, limit: 6 }),
        fetchLabItems({ subsection: s.id }),   // count (no limit)
      ]);
      return [s.id, rows, totalRows.length];
    })).then(triples => {
      if (cancel) return;
      setPerSection(Object.fromEntries(triples.map(t => [t[0], t[1]])));
      setCounts(Object.fromEntries(triples.map(t => [t[0], t[2]])));
      // Combined for global search
      setAllItems(triples.flatMap(t => t[1]));
    });
    // Also fetch larger pool for search across everything
    fetchLabItems().then(rows => { if (!cancel) setAllItems(rows || []); });
    return () => { cancel = true; };
  }, []);

  // Global search across all items
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (allItems || []).filter(it =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.summary || '').toLowerCase().includes(q) ||
      (it.institution || '').toLowerCase().includes(q) ||
      (it.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (it.authors || []).some(a => a.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [query, allItems]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, maxWidth: 1500, margin: '0 auto', padding: '32px 24px 80px' }} className="lab-hub-layout">
      {/* Left sidebar — subsection nav */}
      <aside style={{ borderRight: '1px solid var(--line)', paddingRight: 18 }} className="lab-hub-sidebar">
        <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 14 }}>DRONE LAB</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SUBSECTIONS.map(s => (
            <button key={s.id} onClick={() => onNav('lab', s.id)}
              style={{
                display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'center',
                padding: '10px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--bone)', textAlign: 'left', borderRadius: 4,
                fontFamily: 'inherit', fontSize: 14, transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-900)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--amber)', display: 'inline-flex' }}>{Ic[s.icon] && Ic[s.icon]()}</span>
              <span>
                <span style={{ display: 'block' }}>{s.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--parchment-dim)' }}>{s.tagline}</span>
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{counts[s.id] ?? '—'}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div>
      <h1 style={{ fontSize: 40, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 12, marginTop: 0 }}>{title}</h1>
      <p style={{ fontSize: 15, color: 'var(--parchment)', maxWidth: 720, marginBottom: 22, lineHeight: 1.5 }}>{subtitle}</p>

      {/* Global search */}
      <div style={{ maxWidth: 720, marginBottom: 36 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search across research, patents, projects, hardware, learn, pulse, print…"
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14,
            background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
            color: 'var(--bone)', borderRadius: 6, outline: 'none',
          }}
        />
      </div>

      {searchResults && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Search results <span style={{ color: 'var(--parchment-dim)', fontWeight: 400, fontSize: 14 }}>· {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}</span></h2>
            <button onClick={() => setQuery('')} style={{ fontSize: 14, color: 'var(--amber)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Clear</button>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--parchment-dim)', border: '1px dashed var(--line)', borderRadius: 6 }}>
              No items match "{query}" — try a broader term or check spelling.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {searchResults.map(item => <LabItemCard key={item.id} item={item} onNav={onNav} />)}
            </div>
          )}
        </div>
      )}

      {!searchResults && (<>
      {/* Featured rows per subsection */}
      {SUBSECTIONS.map(s => {
        const rows = perSection[s.id] || [];
        if (!rows.length) return null;
        return (
          <section key={s.id} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>{s.label}</h2>
              <button onClick={() => onNav('lab', s.id)} style={{
                fontSize: 14, color: 'var(--amber)', background: 'transparent', border: 'none',
                cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
              }}>See all →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {rows.slice(0, 4).map(item => <LabItemCard key={item.id} item={item} onNav={onNav} />)}
            </div>
          </section>
        );
      })}
      </>)}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Subsection listing — /#lab/:subsection
// ──────────────────────────────────────────────────────────────────────
export function LabSubsectionPage({ subsection, onNav }) {
  const current = SUBSECTIONS.find(s => s.id === subsection) || SUBSECTIONS[0];
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sort, setSort] = useState('latest');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch ALL subsection items once (no tag filter). Tag filtering happens
  // client-side so the sidebar tag list + counts stay stable when the user
  // clicks a tag.
  const [allItems, setAllItems] = useState([]);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const order = sort === 'latest'
      ? 'published_at.desc.nullslast'
      : sort === 'upvoted' ? 'upvotes.desc.nullslast' : 'created_at.desc';
    fetchLabItems({ subsection: current.id, order })
      .then(rows => {
        if (cancel) return;
        setAllItems(rows || []);
        setLoading(false);
      });
    return () => { cancel = true; };
  }, [current.id, sort]);

  // Items visible in the grid = allItems filtered by selectedTag (if any)
  useEffect(() => {
    if (!selectedTag) { setItems(allItems); return; }
    setItems(allItems.filter(it => (it.tags || []).includes(selectedTag)));
  }, [allItems, selectedTag]);

  useEffect(() => {
    fetchLabTags().then(rs => setTags(rs || []));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(v =>
      (v.title || '').toLowerCase().includes(q) ||
      (v.summary || '').toLowerCase().includes(q) ||
      (v.authors || []).some(a => a.toLowerCase().includes(q)) ||
      (v.institution || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  // Build tag sidebar from REAL item tags (count-sorted, top 25).
  // lab_tags is consulted only for human-readable labels; if a slug isn't
  // there, we title-case the slug itself.
  const tagLabels = useMemo(() => {
    const m = new Map();
    tags.forEach(t => m.set(t.slug, t.label_en || t.slug));
    return m;
  }, [tags]);
  const tagCounts = useMemo(() => {
    const m = new Map();
    allItems.forEach(it => (it.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return m;
  }, [allItems]);
  const sidebarTags = useMemo(() => {
    const entries = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);
    return entries.map(([slug, count]) => ({
      slug,
      label_en: tagLabels.get(slug) || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
    }));
  }, [tagCounts, tagLabels]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, maxWidth: 1500, margin: '0 auto', padding: '32px 24px 80px' }} className="lab-subsection-layout">
      <aside style={{
        position: 'sticky', top: 80, alignSelf: 'start',
        maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
        padding: '0 4px',
      }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', padding: '4px 10px 10px' }}>SECTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
          <button onClick={() => onNav('lab')} style={rowStyle(false)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14 }}>◆</span>
              <span>Lab home</span>
            </span>
          </button>
          {SUBSECTIONS.map(s => (
            <button key={s.id} onClick={() => onNav('lab', s.id)} style={rowStyle(s.id === current.id)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {Ic[s.icon] && <span style={{ display: 'inline-flex' }}>{Ic[s.icon]()}</span>}
                <span>{s.label}</span>
              </span>
            </button>
          ))}
        </div>

        {sidebarTags.length > 0 && (
          <>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', padding: '4px 10px 10px' }}>TAGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button onClick={() => setSelectedTag(null)} style={rowStyle(!selectedTag, true)}>
                <span>All</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{allItems.length}</span>
              </button>
              {sidebarTags.map(t => {
                const active = selectedTag === t.slug;
                const count = t.count;
                if (count === 0 && !active) return null;
                return (
                  <button key={t.slug} onClick={() => setSelectedTag(t.slug)} style={rowStyle(active, true)}>
                    <span>{t.label_en}</span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      <main style={{ minWidth: 0 }}>
        <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 8 }}>DRONE LAB · {current.label.toUpperCase()}</div>
        <h1 style={{ fontSize: 32, marginBottom: 6, letterSpacing: '-0.01em' }}>{current.label}</h1>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 22 }}>{current.tagline}</p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${current.label.toLowerCase()}…`}
            style={{
              flex: 1, minWidth: 240, padding: '8px 14px', fontSize: 14,
              background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
              color: 'var(--bone)', borderRadius: 4, outline: 'none',
            }}/>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['latest','Latest'],['upvoted','Most upvoted'],['newest','Newest']].map(([k,l]) => (
              <button key={k} onClick={() => setSort(k)} style={{
                padding: '6px 12px', fontSize: 14, borderRadius: 999,
                background: sort === k ? 'var(--bone)' : 'transparent',
                color: sort === k ? 'var(--ink)' : 'var(--parchment)',
                border: '1px solid ' + (sort === k ? 'var(--bone)' : 'var(--line-strong)'),
                cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)', border: '1px dashed var(--line)', borderRadius: 6 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>No items found</div>
            <div style={{ fontSize: 14 }}>{selectedTag ? 'Try clearing the tag filter' : 'No items match your filters yet.'}</div>
          </div>
        ) : (
          <>
            <PaginatedGrid items={filtered} onNav={onNav} />
          </>
        )}
      </main>
    </div>
  );
}

const PAGE_SIZE = 30;
function PaginatedGrid({ items, onNav }) {
  const [page, setPage] = useState(1);
  // Reset to page 1 when item set changes (new filter/search/sort)
  useEffect(() => { setPage(1); }, [items.length, items[0]?.id]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const slice = items.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {slice.map(item => <LabItemCard key={item.id} item={item} onNav={onNav} />)}
      </div>
      {totalPages > 1 && <Pager current={cur} total={totalPages} onPage={(p) => {
        setPage(p);
        // scroll to top of main on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />}
    </>
  );
}

function Pager({ current, total, onPage }) {
  // Render: ◀ 1 … (current-1) current (current+1) … total ▶
  const pages = [];
  const push = (n) => { if (!pages.includes(n)) pages.push(n); };
  push(1);
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) push(i);
  if (total > 1) push(total);
  const btn = (label, disabled, onClick, active) => (
    <button key={label + '-' + (active ? 'A' : '')} onClick={onClick} disabled={disabled} style={{
      minWidth: 40, height: 36, padding: '0 12px', fontSize: 14, fontWeight: active ? 700 : 500,
      background: active ? 'var(--amber)' : 'var(--forest-900)',
      color: active ? 'var(--ink)' : disabled ? 'var(--parchment-dim)' : 'var(--bone)',
      border: '1px solid ' + (active ? 'var(--amber)' : 'var(--line)'),
      borderRadius: 4, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>{label}</button>
  );
  return (
    <nav style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 32, flexWrap: 'wrap' }}>
      {btn('◀', current === 1, () => onPage(current - 1), false)}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {gap && <span style={{ color: 'var(--parchment-dim)', padding: '0 4px' }}>…</span>}
            {btn(String(p), false, () => onPage(p), p === current)}
          </React.Fragment>
        );
      })}
      {btn('▶', current === total, () => onPage(current + 1), false)}
    </nav>
  );
}

function rowStyle(active, indented = false) {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '6px 10px',
    paddingLeft: indented ? 16 : 10,
    background: active ? 'var(--bone)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--parchment)',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
    textAlign: 'left', fontWeight: active ? 600 : 400,
  };
}

// ─── Patents — Google Patents search portal ───────────────────────────
function PatentsGoogleSearch({ defaultQuery }) {
  const [q, setQ] = useState(defaultQuery || '');
  const open = (query) => {
    const u = `https://patents.google.com/?q=${encodeURIComponent(query || 'drone')}`;
    window.open(u, '_blank', 'noopener,noreferrer');
  };
  const presets = [
    'drone navigation', 'UAV swarm', 'quadcopter battery', 'FPV racing',
    'VTOL aircraft', 'drone delivery', 'agricultural drone', 'anti-drone',
    'drone gimbal', 'LiDAR UAV', 'solar drone', 'tethered drone',
  ];
  return (
    <div style={{ marginBottom: 28, padding: 18, background: 'linear-gradient(135deg, #3a1f3a, #1a0f1f)', border: '1px solid var(--line-strong)', borderRadius: 6 }}>
      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: '#b97a4d', marginBottom: 10 }}>SEARCH GOOGLE PATENTS · GLOBAL</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && open(q)}
          placeholder="Search any drone-related patent topic worldwide…"
          style={{ flex: 1, padding: '10px 14px', fontSize: 14, background: 'rgba(13,20,16,0.6)', border: '1px solid #5a3a5a', color: 'var(--bone)', borderRadius: 4, outline: 'none' }}/>
        <button onClick={() => open(q)} style={{ padding: '10px 18px', background: '#b97a4d', color: 'var(--ink)', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          Search →
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#d1c8b5', opacity: 0.7, padding: '4px 0', marginRight: 4 }}>Popular:</span>
        {presets.map(t => (
          <button key={t} onClick={() => open(t)} style={{
            padding: '4px 10px', fontSize: 12, borderRadius: 999,
            background: 'rgba(13,20,16,0.4)', color: '#f5ede0',
            border: '1px solid #5a3a5a', cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#d1c8b5', opacity: 0.6, marginTop: 10 }}>
        Results open at patents.google.com — every patent listed below also has its full PDF viewable inside the lab.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Item detail — /#lab/item/:id
// ──────────────────────────────────────────────────────────────────────
export function LabItemPage({ itemId, onNav }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchLabItem(itemId).then(it => { if (!cancel) { setItem(it); setLoading(false); } });
    return () => { cancel = true; };
  }, [itemId]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading…</div>;
  if (!item) return (
    <div style={{ padding: 80, textAlign: 'center' }}>
      <div style={{ fontSize: 18, marginBottom: 10 }}>Item not found</div>
      <button className="btn secondary" onClick={() => onNav('lab')}>← Back to Lab</button>
    </div>
  );

  const published = item.published_at ? new Date(item.published_at).toLocaleDateString() : null;
  const subsection = SUBSECTIONS.find(s => s.id === item.subsection) || { label: item.subsection };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 28px 80px' }}>
      <button onClick={() => onNav('lab', item.subsection)} style={{ background: 'transparent', border: 'none', color: 'var(--parchment-dim)', fontSize: 14, marginBottom: 18, cursor: 'pointer' }}>
        ← {subsection.label}
      </button>

      <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 8 }}>{item.type && item.type.toLowerCase() !== item.subsection ? `${item.type.toUpperCase()} · ${subsection.label.toUpperCase()}` : subsection.label.toUpperCase()}</div>
      <h1 style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.01em' }}>{item.title}</h1>

      <div style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 22, flexWrap: 'wrap' }}>
        {item.institution && <span>{item.institution}</span>}
        {item.authors && item.authors.length > 0 && <span>· {item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ' et al.' : ''}</span>}
        {published && <span>· {published}</span>}
        {item.upvotes > 0 && <span>· {item.upvotes} upvotes</span>}
      </div>

      {(() => {
        const embed = detectMediaType(item.document_url) .type !== 'none' && detectMediaType(item.document_url).type !== 'other'
          ? detectMediaType(item.document_url)
          : detectMediaType(item.external_url);
        const hasEmbed = ['youtube','vimeo','pdf','pdf-arxiv','docx'].includes(embed.type);
        return hasEmbed
          ? <DocumentViewer documentUrl={item.document_url} externalUrl={item.external_url} documentType={item.document_type} />
          : (item.cover_image_url
              ? <img src={item.cover_image_url} alt="" style={{ width: '100%', borderRadius: 6, marginBottom: 22 }} referrerPolicy="no-referrer" />
              : null);
      })()}

      {item.summary && (
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--parchment)', marginBottom: 22 }}>{item.summary}</p>
      )}

      {item.body_markdown && (
        <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--parchment)', whiteSpace: 'pre-wrap', marginBottom: 22 }}>{item.body_markdown}</div>
      )}

      {(item.tags && item.tags.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {item.tags.map(t => (
            <span key={t} className="mono" style={{ padding: '3px 8px', background: 'var(--forest-800)', border: '1px solid var(--line)', borderRadius: 999, fontSize: 12, color: 'var(--parchment)' }}>#{t}</span>
          ))}
        </div>
      )}

      {item.spec && Object.keys(item.spec).length > 0 && (
        <div style={{ marginBottom: 22, padding: 14, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--forest-900)' }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--parchment-dim)' }}>SPECIFICATIONS</div>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(item.spec).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--parchment-dim)', textTransform: 'uppercase', width: 200 }}>{k}</td>
                  <td style={{ padding: '5px 0' }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(item.price_min_usd != null || item.price_max_usd != null) && (
        <div style={{ marginBottom: 22, fontSize: 14 }}>
          <strong>Price range:</strong>{' '}
          {item.price_min_usd != null && `$${item.price_min_usd}`}
          {item.price_max_usd != null && item.price_min_usd != null && ` – $${item.price_max_usd}`}
          {item.brand && ` · ${item.brand}`}
        </div>
      )}

      {item.external_url && (
        <div style={{ marginTop: 24, padding: 16, background: 'var(--forest-900)', border: '1px solid var(--lichen)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ color: 'var(--lichen)', marginBottom: 6 }}>READ ON ORIGINAL SOURCE</div>
          <a href={item.external_url} target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--amber)', fontSize: 14, wordBreak: 'break-all' }}>
            {item.external_url}
          </a>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────
// DocumentViewer — renders PDF, YouTube, Vimeo, or download fallback
// ──────────────────────────────────────────────────────────────────────
function detectMediaType(url) {
  if (!url) return { type: 'none' };
  const u = String(url).toLowerCase();
  // YouTube
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (m) return { type: 'youtube', id: m[1], embed: `https://www.youtube.com/embed/${m[1]}?rel=0` };
  // Vimeo
  m = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (m) return { type: 'vimeo', id: m[1], embed: `https://player.vimeo.com/video/${m[1]}` };
  // PDF (ends in .pdf or contains /pdf/)
  if (u.endsWith('.pdf') || u.includes('/pdf/')) return { type: 'pdf', embed: url };
  // arXiv abstract link — can derive PDF URL
  m = url.match(/arxiv\.org\/abs\/([\d.]+v?\d*)/);
  if (m) return { type: 'pdf-arxiv', embed: `https://arxiv.org/pdf/${m[1]}.pdf`, abstract: url };
  // DOCX
  if (u.endsWith('.docx')) return { type: 'docx', embed: url };
  return { type: 'other', url };
}

function DocumentViewer({ documentUrl, externalUrl, documentType }) {
  const primary = detectMediaType(documentUrl);
  const fallback = detectMediaType(externalUrl);
  const best = primary.type !== 'none' && primary.type !== 'other' ? primary : fallback;

  if (best.type === 'youtube' || best.type === 'vimeo') {
    return (
      <div style={{ margin: '16px 0 22px', borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
        <iframe
          src={best.embed}
          title="embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    );
  }

  if (best.type === 'pdf' || best.type === 'pdf-arxiv') {
    return (
      <div style={{ margin: '16px 0 22px' }}>
        <div style={{
          borderRadius: 6, overflow: 'hidden',
          border: '1px solid var(--line-strong)',
          height: 720, background: 'var(--forest-900)',
        }}>
          <object data={best.embed} type="application/pdf" style={{ width: '100%', height: '100%' }}>
            <iframe src={best.embed} title="PDF document" style={{ width: '100%', height: '100%', border: 'none' }}/>
          </object>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 14 }}>
          <a href={best.embed} target="_blank" rel="noopener noreferrer" download
             style={{ color: 'var(--amber)', textDecoration: 'none' }}>
            Download PDF ↓
          </a>
          {best.type === 'pdf-arxiv' && best.abstract && (
            <a href={best.abstract} target="_blank" rel="noopener noreferrer"
               style={{ color: 'var(--parchment-dim)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              View abstract on arXiv
            </a>
          )}
        </div>
      </div>
    );
  }

  if (best.type === 'docx') {
    return (
      <div style={{ margin: '16px 0 22px', padding: 20, border: '1px solid var(--line)', borderRadius: 6, textAlign: 'center', background: 'var(--forest-900)' }}>
        <div style={{ marginBottom: 10, fontSize: 14 }}>Word document</div>
        <a href={best.embed} target="_blank" rel="noopener noreferrer" download className="btn" style={{ padding: '8px 16px', fontSize: 14 }}>Download DOCX ↓</a>
      </div>
    );
  }

  return null;
}

function cleanLabTitle(item) {
  let t = item.title || '';
  if (item.subsection === 'projects' && item.external_url) {
    // GitHub repo: pull just the repo name out of OWNER/REPO[ — desc] format
    const m = (item.external_url || '').match(/github\.com\/[^/]+\/([^/?#]+)/);
    if (m) return m[1].replace(/\.git$/, '');
  }
  return t;
}
function cleanLabSummary(item) {
  let s = item.summary || '';
  if (item.subsection === 'projects') {
    s = s.replace(/^[★\u2605]\s*[\d,]+\s*stars?\.\s*/i, '');  // strip "★ N stars. "
  }
  return s;
}
function LabItemCard({ item, onNav }) {
  return (
    <div onClick={() => onNav('lab-item', item.id)} style={{
      cursor: 'pointer', padding: 0, background: 'var(--forest-900)',
      border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, transform 0.15s',
    }}>
      <LabPagePreview item={item} fallback={item.cover_image_url}/>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>
          {item.type?.toUpperCase()}{item.institution ? ` · ${item.institution}` : ''}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>{cleanLabTitle(item)}</div>
        {item.summary && (
          <div style={{ fontSize: 14, color: 'var(--parchment-dim)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {cleanLabSummary(item)}
          </div>
        )}
        {(item.price_min_usd != null || item.price_max_usd != null || item.brand) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, fontSize: 12, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            {item.price_min_usd != null && (
              <span style={{ padding: '2px 8px', background: 'rgba(198,136,32,0.1)', border: '1px solid var(--amber)', borderRadius: 3 }}>
                ${item.price_min_usd}{item.price_max_usd != null && item.price_max_usd !== item.price_min_usd ? `–$${item.price_max_usd}` : ''}
              </span>
            )}
            {item.brand && <span style={{ color: 'var(--parchment-dim)' }}>{item.brand}</span>}
          </div>
        )}
        {(item.tags && item.tags.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="mono" style={{ padding: '2px 6px', background: 'var(--forest-800)', borderRadius: 999, fontSize: 12, color: 'var(--parchment-dim)' }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
