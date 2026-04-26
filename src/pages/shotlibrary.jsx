// pages/shotlibrary.jsx — B2B clip licensing marketplace, organised by use-case
import React, { useState, useEffect, useMemo } from 'react';
import { VIDEOS as _MOCK_VIDEOS, thumbGradient } from '../data';
import { fetchVideos } from '../db/videos';
import { VideoCard, Pagination, usePagination } from '../components';

// ──────────────────────────────────────────────────────────────────────
// Use-case → fine-category tag mapping (auto-matched against videos.tags[0])
// ──────────────────────────────────────────────────────────────────────
const USE_CASES = [
  { id: 'realestate', tag: 'REAL ESTATE', name: 'Real estate establishing',
    desc: 'Rooftops, long pulls, façade reveals. Rights cleared for broker MLS use.',
    fine: ['cityscape', 'architecture', 'bridge'] },
  { id: 'wedding', tag: 'WEDDING', name: 'Wedding B-roll',
    desc: 'Venue reveals, reception approaches, vineyard & beach aisles.',
    fine: ['vineyard', 'castle', 'coastal-cliff', 'flower-field', 'temple', 'rice-terrace'] },
  { id: 'music', tag: 'MUSIC', name: 'Music video intros',
    desc: 'Mood, motion, moody skies. Long clips for slow-build intros.',
    fine: ['mountain', 'ocean', 'aurora', 'cityscape', 'phenomena', 'volcano'] },
  { id: 'doc', tag: 'DOCUMENTARY', name: 'Documentary establishing',
    desc: 'Cities, terrain, history, context. Permit-verified for broadcast.',
    fine: ['cityscape', 'ancient-ruins', 'temple', 'castle', 'mountain', 'desert', 'rainforest'] },
  { id: 'esg', tag: 'SUSTAINABILITY', name: 'ESG & sustainability',
    desc: 'Wind farms, reforestation, solar, rewilding, ocean cleanup.',
    fine: ['wind-farm', 'solar-farm', 'rainforest', 'marine-life', 'glacier'] },
  { id: 'news', tag: 'NEWS', name: 'News & editorial',
    desc: 'Breaking locations, city aftermath, rapid turnaround.',
    fine: ['cityscape', 'port', 'bridge', 'architecture', 'volcano'] },
  { id: 'sports', tag: 'SPORTS', name: 'Sports & stadiums',
    desc: 'Stadium approaches, action footage, drone shows.',
    fine: ['aerial-sports', 'drone-show'] },
  { id: 'travel', tag: 'TRAVEL', name: 'Travel & tourism',
    desc: 'Destinations, landmarks, seasonal variations, golden hour.',
    fine: ['temple', 'castle', 'ancient-ruins', 'mountain', 'coastal-cliff', 'waterfall', 'cityscape', 'rice-terrace', 'atoll'] },
  { id: 'fpv', tag: 'FPV', name: 'FPV / cinewhoop chase',
    desc: 'One-shot dives, gaps, interior-to-exterior reveals.',
    fine: ['aerial-sports'] },
  { id: 'corp', tag: 'CORPORATE', name: 'Corporate & industrial',
    desc: 'Data centers, ports, manufacturing, infrastructure.',
    fine: ['cityscape', 'port', 'architecture', 'wind-farm'] },
  { id: 'season', tag: 'WEATHER', name: 'Seasonal & weather',
    desc: 'First snow, cherry blossom, monsoon, autumn color.',
    fine: ['flower-field', 'polar', 'glacier', 'volcano', 'aurora', 'phenomena', 'fireworks'] },
  { id: 'wildlife', tag: 'WILDLIFE', name: 'Wildlife (distance-safe)',
    desc: 'Bird\'s-eye herds, whales, migration. 150m+ altitude, no pursuit.',
    fine: ['marine-life', 'wildlife-safari', 'polar'] },
];

const USE_CASE_BY_ID = Object.fromEntries(USE_CASES.map(u => [u.id, u]));

function videosForUseCase(allVideos, useCase) {
  if (!useCase) return [];
  const set = new Set(useCase.fine);
  return allVideos.filter(v => v.tags?.[0] && set.has(v.tags[0]));
}

function priceFromOrFallback(videos) {
  const n = videos.length;
  if (n >= 200) return 9;
  if (n >= 100) return 14;
  if (n >= 50)  return 19;
  if (n >= 20)  return 29;
  if (n >= 5)   return 39;
  return 49;
}

export function ShotLibraryPage({ onNav, onOpenVideo }) {
  const [allVideos, setAllVideos] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    fetchVideos().then(v => {
      if (cancel) return;
      setAllVideos((v && v.length > 0) ? v : _MOCK_VIDEOS);
      setLoading(false);
    });
    return () => { cancel = true; };
  }, []);

  const useCaseStats = useMemo(() => {
    return USE_CASES.map(u => {
      const matched = videosForUseCase(allVideos, u);
      return { ...u, clips: matched.length, from: priceFromOrFallback(matched) };
    });
  }, [allVideos]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allVideos.filter(v =>
      (v.title || '').toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.creator?.name || '').toLowerCase().includes(q) ||
      (v.creator?.handle || '').toLowerCase().includes(q) ||
      (v.tags || []).some(t => String(t).toLowerCase().includes(q))
    ).slice(0, 24);
  }, [allVideos, query]);

  const trending = useMemo(() => {
    return [...allVideos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8);
  }, [allVideos]);

  const curatorPicks = useMemo(() => {
    return ['wedding', 'music', 'doc', 'esg'].map(id => {
      const u = USE_CASE_BY_ID[id];
      const vids = videosForUseCase(allVideos, u)
        .filter(v => v.price === 0 || v.price == null)
        .sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
      const totalSavings = Math.round(vids.length * (u.id === 'wedding' ? 9 : u.id === 'music' ? 18 : u.id === 'doc' ? 22 : 14) * 0.4);
      return { useCase: u, clips: vids,
        kitName: ({ wedding: '6-clip wedding venue reveal kit', music: '6-clip music video intro mood kit', doc: '6-clip documentary establishing kit', esg: '6-clip sustainability evidence pack' })[id],
        kitPrice: ({ wedding: 49, music: 79, doc: 109, esg: 89 })[id], save: totalSavings };
    }).filter(x => x.clips.length > 0);
  }, [allVideos]);

  return (
    <div>
      {/* PREVIEW BANNER — B2B inquiries route to email, no automated package delivery */}
      <div style={{
        background: 'linear-gradient(90deg, var(--amber) 0%, var(--sunset) 100%)',
        color: '#1a2820', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 13, fontWeight: 600, textAlign: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>[PREVIEW · B2B] 기업용 라이선스 패키지 자동 배송은 아직 준비 중이에요. 문의는 이메일로 응대해 드립니다 · B2B inquiries are routed to email — no automated package delivery yet.</span>
      </div>
      <section style={{ padding: '70px 28px 40px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>SHOT LIBRARY · BROWSE BY WHAT YOU'RE MAKING</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, letterSpacing: '-0.035em', lineHeight: 0.98, fontWeight: 600, marginBottom: 16, maxWidth: 900 }}>Not sure where to start? Start with the cut.</h1>
          <p style={{ fontSize: 17, color: 'var(--parchment)', maxWidth: 620, lineHeight: 1.55, marginBottom: 22 }}>Drone footage organised by production use-case — real estate reveals, music video intros, documentary establishing shots. Pick a use-case to see all matching clips, get a license quote, or commission new footage.</p>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clips by title, location, or keyword…" style={{ width: '100%', maxWidth: 620, padding: '12px 16px', fontSize: 14, background: '#fff', border: '1.5px solid rgba(26,40,32,0.22)', color: 'var(--bone)', borderRadius: 8, outline: 'none' }}/>
          {query && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 12 }}>{searched.length} match{searched.length === 1 ? '' : 'es'} for "{query}" — <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--sunset)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>clear</button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>{searched.slice(0, 8).map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}</div>
            </div>
          )}
        </div>
      </section>
      {!query && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 30px' }}>
          <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--amber)' }}>BROWSE BY PRODUCTION TYPE</div>
          {loading ? <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading clip counts…</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {useCaseStats.map(u => (
                <button key={u.id} className="di-card" onClick={() => onNav('shots', u.id)} style={{ textAlign: 'left', padding: 24, position: 'relative', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  <div className="mono" style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--amber)', marginBottom: 12, fontWeight: 600 }}>{u.tag}</div>
                  <h3 style={{ fontSize: 22, letterSpacing: '-0.01em', marginBottom: 8, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{u.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.55, marginBottom: 18, minHeight: 58 }}>{u.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(26,40,32,0.10)', fontSize: 14 }}>
                    <span style={{ color: 'var(--parchment-dim)' }}>{u.clips.toLocaleString()} clip{u.clips === 1 ? '' : 's'}</span>
                    <span className="mono" style={{ color: 'var(--sunset)', fontWeight: 600 }}>from ${u.from} →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {!query && curatorPicks.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <div><div className="eyebrow" style={{ marginBottom: 6 }}>CURATOR'S PICKS</div><h2 style={{ fontSize: 28 }}>Hand-picked clip bundles</h2></div>
            <span style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>Save ~40% vs. licensing individually</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
            {curatorPicks.map(p => {
              const cover = p.clips[0]?.thumbUrl || (p.clips[0]?.youtubeId ? `https://i.ytimg.com/vi/${p.clips[0].youtubeId}/mqdefault.jpg` : null);
              return (
                <button key={p.useCase.id} className="di-card" onClick={() => onNav('shots', p.useCase.id)} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left' }}>
                  <div style={{ width: '100%', height: '100%', minHeight: 130, background: cover ? `center/cover no-repeat url('${cover.replace(/'/g, '%27')}')` : thumbGradient(p.useCase.id.charCodeAt(0)) }} />
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--amber)', marginBottom: 6 }}>{p.useCase.tag} · BUYER FAV</div>
                      <h3 style={{ fontSize: 16, marginBottom: 4 }}>{p.kitName}</h3>
                      <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{p.clips.length} clips · ready to license</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
                      <div><div className="mono" style={{ fontSize: 12, color: 'var(--lichen)', letterSpacing: '0.1em' }}>SAVE ${p.save}</div><div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sunset)' }}>${p.kitPrice}</div></div>
                      <span className="mono" style={{ color: 'var(--sunset)', fontSize: 13, fontWeight: 600 }}>VIEW BUNDLE →</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {!query && trending.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 24 }}>What editors are using this week</h2>
            <span style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>Sorted by views — top 8</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>{trending.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}</div>
        </section>
      )}
    </div>
  );
}

export function ShotsCategoryPage({ useCaseId, onNav, onOpenVideo }) {
  const useCase = USE_CASE_BY_ID[useCaseId];
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('trending');
  const [resFilter, setResFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetchVideos().then(v => { if (cancel) return; setAllVideos((v && v.length > 0) ? v : _MOCK_VIDEOS); setLoading(false); });
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!useCase) return [];
    let rows = videosForUseCase(allVideos, useCase);
    if (resFilter === 'hd') rows = rows.filter(v => /hd|1080|2k|4k|5k|8k/i.test(v.resolution || ''));
    if (resFilter === '4k') rows = rows.filter(v => /4k|5k|8k/i.test(v.resolution || ''));
    if (priceFilter === 'free') rows = rows.filter(v => !v.price || v.price === 0);
    if (priceFilter === 'paid') rows = rows.filter(v => v.price && v.price > 0);
    if (sort === 'newest') rows = [...rows].sort((a, b) => (a.uploadedDaysAgo || 9999) - (b.uploadedDaysAgo || 9999));
    else if (sort === 'rated') rows = [...rows].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    else rows = [...rows].sort((a, b) => (b.views || 0) - (a.views || 0));
    return rows;
  }, [allVideos, useCase, sort, resFilter, priceFilter]);

  const { page, setPage, pageCount, slice: pagedSlice } = usePagination(filtered, 24);

  if (!useCase) {
    return (<div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>Unknown use-case. <button onClick={() => onNav('shotlibrary')} className="btn" style={{ marginLeft: 8 }}>← Back to Shot Library</button></div>);
  }

  const fromPrice = priceFromOrFallback(filtered);

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 28px 80px' }}>
      <button onClick={() => onNav('shotlibrary')} style={{ background: 'none', border: 'none', color: 'var(--sunset)', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>← All use-cases</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, marginBottom: 28 }}>
        <div>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--amber)', marginBottom: 10, fontWeight: 600 }}>{useCase.tag}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, letterSpacing: '-0.025em', lineHeight: 1.05, fontWeight: 600, marginBottom: 12 }}>{useCase.name}</h1>
          <p style={{ fontSize: 16, color: 'var(--parchment)', lineHeight: 1.55, maxWidth: 640 }}>{useCase.desc}</p>
        </div>
        <aside className="di-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, height: 'fit-content' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>LICENSING</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sunset)' }}>from ${fromPrice}</span>
            <span style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>per clip</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--parchment-dim)', lineHeight: 1.5 }}>{filtered.length} clip{filtered.length === 1 ? '' : 's'} match this use-case. Bulk discounts (10+: 15% off, 25+: 25% off, 50+: 35% off) apply automatically. Broadcast & worldwide rights available.</div>
          <button onClick={() => setShowQuote(true)} style={{ padding: '10px 16px', background: 'var(--sunset)', color: '#faf6ec', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Request quote →</button>
          <a href={`mailto:sales@droneicarus.com?subject=License%20quote%20${useCase.tag}`} style={{ fontSize: 12, color: 'var(--parchment-dim)', textDecoration: 'underline', textAlign: 'center' }}>or email sales@droneicarus.com</a>
        </aside>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--parchment-dim)' }}>{filtered.length} CLIPS</span>
        <div style={{ flex: 1 }} />
        <FilterChips label="Resolution" value={resFilter} setValue={setResFilter} options={[['all','All'],['hd','HD+'],['4k','4K+']]} />
        <FilterChips label="Price" value={priceFilter} setValue={setPriceFilter} options={[['all','All'],['free','Free'],['paid','Paid']]} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, background: '#fff', color: 'var(--bone)', border: '1px solid rgba(26,40,32,0.22)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="trending">Trending</option><option value="newest">Newest</option><option value="rated">Highest rated</option>
        </select>
      </div>
      {loading ? <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading clips…</div> : pagedSlice.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>No clips match these filters. <button onClick={() => { setResFilter('all'); setPriceFilter('all'); }} style={{ background: 'none', border: 'none', color: 'var(--sunset)', cursor: 'pointer', textDecoration: 'underline' }}>Reset filters</button></div>
      ) : (
        <>
          <div id="shots-grid-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>{pagedSlice.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo} />)}</div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={filtered.length} pageSize={24} scrollTargetId="shots-grid-top" />
        </>
      )}
      {showQuote && <QuoteModal useCase={useCase} count={filtered.length} fromPrice={fromPrice} onClose={() => setShowQuote(false)} />}
    </div>
  );
}

function FilterChips({ label, value, setValue, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', background: '#fff', border: '1px solid rgba(26,40,32,0.22)', borderRadius: 999, padding: 2 }}>
        {options.map(([v, l]) => (
          <button key={v} onClick={() => setValue(v)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: value === v ? 600 : 400, background: value === v ? 'var(--sunset)' : 'transparent', color: value === v ? '#faf6ec' : 'var(--parchment)', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function QuoteModal({ useCase, count, fromPrice, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [usage, setUsage] = useState('web');
  const [territory, setTerritory] = useState('worldwide');
  const [needed, setNeeded] = useState(10);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email || !name) return;
    setSubmitting(true);
    const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
    const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    try {
      await fetch(`${SUPA_URL}/rest/v1/license_quote_requests`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ name, email, company, use_case: useCase.id, usage_type: usage, territory, clips_needed: Number(needed) || 1, details: details.slice(0, 2000), source_count: count }),
      });
    } catch (_) {}
    setSubmitting(false); setDone(true);
  };

  return (
    <div role="dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, maxWidth: 540, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', padding: 28, border: '1px solid rgba(26,40,32,0.18)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 8, color: 'var(--lichen)' }}>✓</div>
            <h3 style={{ fontSize: 22, marginBottom: 10 }}>Quote request sent</h3>
            <p style={{ fontSize: 14, color: 'var(--parchment-dim)', lineHeight: 1.55, marginBottom: 22 }}>Our licensing team will reply within 1 business day with a tailored quote for "{useCase.name}".</p>
            <button onClick={onClose} className="btn" style={{ padding: '10px 20px' }}>Close</button>
          </div>
        ) : (
          <>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--sunset)', marginBottom: 8 }}>LICENSE QUOTE — {useCase.tag}</div>
            <h3 style={{ fontSize: 22, marginBottom: 6 }}>{useCase.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 20 }}>{count} clips available · from ${fromPrice}/clip</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <FormInput label="Your name" value={name} onChange={setName} required />
              <FormInput label="Email" value={email} onChange={setEmail} type="email" required />
              <FormInput label="Company" value={company} onChange={setCompany} />
              <FormInput label="Clips needed" value={needed} onChange={setNeeded} type="number" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <FormSelect label="Usage" value={usage} onChange={setUsage} options={[['web','Web / social'],['broadcast','TV / broadcast'],['theatrical','Theatrical / film'],['internal','Internal / corporate']]} />
              <FormSelect label="Territory" value={territory} onChange={setTerritory} options={[['worldwide','Worldwide'],['americas','Americas'],['emea','EMEA'],['apac','APAC']]} />
            </div>
            <FormTextarea label="Project details (optional)" value={details} onChange={setDetails} rows={3} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={onClose} className="btn secondary" style={{ padding: '10px 18px' }}>Cancel</button>
              <button onClick={submit} disabled={submitting || !name || !email} className="btn" style={{ padding: '10px 20px' }}>{submitting ? 'Sending…' : 'Send request'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, required, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--parchment-dim)' }}>
      <span>{label}{required && <span style={{ color: 'var(--sunset)' }}> *</span>}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} style={{ padding: '9px 12px', fontSize: 14, background: '#fff', color: 'var(--bone)', border: '1px solid rgba(26,40,32,0.22)', borderRadius: 6, outline: 'none', fontFamily: 'inherit' }}/>
    </label>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--parchment-dim)' }}>
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '9px 12px', fontSize: 14, background: '#fff', color: 'var(--bone)', border: '1px solid rgba(26,40,32,0.22)', borderRadius: 6, fontFamily: 'inherit', cursor: 'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function FormTextarea({ label, value, onChange, rows = 3 }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--parchment-dim)' }}>
      <span>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ padding: '9px 12px', fontSize: 14, background: '#fff', color: 'var(--bone)', border: '1px solid rgba(26,40,32,0.22)', borderRadius: 6, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}/>
    </label>
  );
}
