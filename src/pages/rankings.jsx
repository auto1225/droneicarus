// pages/rankings.jsx — Global leaderboard backed by real DB videos.
import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES, VIDEOS as _MV, CREATORS, thumbGradient, STATS } from '../data';
import { fetchVideos } from '../db/videos';
import { Ic, formatViews, FollowButton } from '../components';

const ratio = v => (v.views > 0 ? (v.likes || 0) / v.views : 0);
const score = v => Math.min(99.9, Math.log10(Math.max(v.views || 1, 1)) * 12 + Math.min(ratio(v) * 800, 30));
const ytThumb = v => v.thumbUrl || (v.youtubeId || v.ytId ? `https://i.ytimg.com/vi/${v.youtubeId || v.ytId}/hqdefault.jpg` : null);
const chOf = v => v.channel || v.youtubeChannel || v.youtube_channel || v.creator?.handle || '';
const catLabel = id => CATEGORIES.find(c => c.id === id)?.label || (id || 'Aerial').replace(/-/g, ' ');

const TABS = [
  { id: 'viewed', label: 'Most viewed',   filter: () => true,                                    sort: (a,b) => (b.views||0) - (a.views||0) },
  { id: 'rated',  label: 'Top rated',     filter: v => (v.views||0) >= 1000,                     sort: (a,b) => ratio(b) - ratio(a) },
  { id: 'score',  label: 'Editor score',  filter: () => true,                                    sort: (a,b) => score(b) - score(a) },
  { id: 'recent', label: 'This year',     filter: v => (v.uploadedDaysAgo ?? 9999) < 365,        sort: (a,b) => (b.views||0) - (a.views||0) },
  { id: 'cinema', label: 'Cinematic 4K+', filter: v => /4K|5K|8K/i.test(v.resolution || ''),     sort: (a,b) => (b.views||0) - (a.views||0) },
];

const cardBgUrl = t => t ? `#0d1410 center/cover no-repeat url('${t.replace(/'/g, '%27')}')` : null;

export function RankingsPage({ onOpenVideo }) {
  const [tab, setTab] = useState('viewed');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    fetchVideos().then(rows => { if (!c) { setVideos(rows || []); setLoading(false); } });
    return () => { c = true; };
  }, []);

  const cfg = TABS.find(t => t.id === tab) || TABS[0];
  const ranked = useMemo(() => videos.filter(cfg.filter).sort(cfg.sort).slice(0, 100), [videos, tab]);
  const podium = ranked.slice(0, 3);
  const rows = ranked.slice(0, 50);

  const channels = useMemo(() => {
    const m = new Map();
    for (const v of videos) {
      const ch = chOf(v); if (!ch) continue;
      if (!m.has(ch)) m.set(ch, { name: ch, clips: 0, views: 0, likes: 0, samples: [] });
      const e = m.get(ch);
      e.clips++; e.views += +v.views||0; e.likes += +v.likes||0;
      if (e.samples.length < 3) e.samples.push(v);
    }
    return [...m.values()].sort((a,b) => b.views - a.views).slice(0, 12);
  }, [videos]);

  const byCat = useMemo(() => {
    const seen = new Map();
    for (const v of [...videos].sort((a,b) => (b.views||0) - (a.views||0))) {
      if (!v.category) continue;
      if (!seen.has(v.category)) seen.set(v.category, v);
      if (seen.size >= 8) break;
    }
    return [...seen.entries()].map(([cat, v]) => ({ cat, video: v }));
  }, [videos]);

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--sunset)' }}>● GLOBAL LEADERBOARD</div>
      <h1 style={{ fontSize: 52, letterSpacing: '-0.02em', marginBottom: 10 }}>The Icarus Top 100</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 720, marginBottom: 24, lineHeight: 1.55 }}>
        Ranked by a composite of views, engagement, and editorial score across {videos.length.toLocaleString() || '—'} clips from {channels.length > 0 ? new Set(videos.map(chOf).filter(Boolean)).size.toLocaleString() : '—'} pilots and channels.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 32, borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 18px',
            borderBottom: tab === t.id ? '2px solid var(--sunset)' : '2px solid transparent',
            color: tab === t.id ? 'var(--bone)' : 'var(--parchment-dim)',
            fontSize: 14, fontWeight: tab === t.id ? 600 : 500,
            marginBottom: -1, background: 'transparent', cursor: 'pointer', border: 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div className="di-empty"><div className="di-empty-title">Crunching the numbers…</div>Loading the latest leaderboard.</div>}
      {!loading && ranked.length === 0 && (
        <div className="di-empty">
          <div className="di-empty-title">No clips match this filter</div>
          Try a different tab — there's plenty in "Most viewed" and "All-time".
        </div>
      )}

      {/* Podium */}
      {!loading && podium.length === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 16, marginBottom: 48, alignItems: 'end' }}>
          {[podium[1], podium[0], podium[2]].map((v, i) => {
            const r = [2, 1, 3][i];
            const c = r === 1 ? 'var(--amber)' : r === 2 ? 'var(--parchment-dim)' : 'var(--sunset)';
            const t = ytThumb(v);
            return (
              <button key={v.id} className="di-card" onClick={() => onOpenVideo(v)} style={{
                cursor: 'pointer', textAlign: 'left', padding: 0, border: `2px solid ${c}`,
                marginTop: r === 1 ? 0 : 32, background: 'transparent',
                font: 'inherit', color: 'inherit',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'relative', aspectRatio: '16/9',
                  background: cardBgUrl(t) || thumbGradient(String(v.id||'').length * 7),
                }}>
                  <div style={{
                    position: 'absolute', top: 12, left: 14,
                    fontSize: r === 1 ? 64 : 48, fontFamily: 'var(--font-display)', fontWeight: 700,
                    color: '#fff', lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,0.85)',
                  }}>#{r}</div>
                  <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 8px', background: c, color: '#fff', borderRadius: 99, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    {score(v).toFixed(1)}
                  </div>
                  {v.duration && (
                    <div style={{ position: 'absolute', bottom: 12, right: 14, padding: '3px 8px', background: 'rgba(13,20,16,0.85)', color: '#fff', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.duration}</div>
                  )}
                </div>
                <div style={{ padding: '14px 16px 18px' }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{catLabel(v.category)}</div>
                  <div style={{ fontSize: r === 1 ? 17 : 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--bone)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginTop: 6 }}>{chOf(v)} · {formatViews(v.views || 0)} views</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <div className="di-card" style={{ marginBottom: 56, padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 70px 2.4fr 1fr 1fr 110px 90px',
            padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--parchment-dim)',
            borderBottom: '1px solid var(--line)', background: 'var(--forest-950)',
          }}>
            <span>Rank</span><span>Score</span><span>Clip</span><span>Channel</span>
            <span>Category</span><span style={{ textAlign: 'right' }}>Views</span><span style={{ textAlign: 'right' }}>Likes %</span>
          </div>
          {rows.map((v, i) => {
            const t = ytThumb(v);
            const s = score(v);
            const rp = (ratio(v) * 100).toFixed(1) + '%';
            return (
              <div key={v.id} onClick={() => onOpenVideo(v)} style={{
                display: 'grid', gridTemplateColumns: '60px 70px 2.4fr 1fr 1fr 110px 90px',
                padding: '14px 20px',
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--line)',
                alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s',
              }} onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-950)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: i < 3 ? 'var(--amber)' : 'var(--bone)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--sunset)' }}>{s.toFixed(1)}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  <div style={{
                    width: 96, aspectRatio: '16/9', flexShrink: 0,
                    background: cardBgUrl(t) || thumbGradient(String(v.id||'').length * 7),
                    borderRadius: 4, border: '1px solid var(--line)',
                  }}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--bone)' }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 2 }}>
                      {v.duration} {v.resolution ? `· ${v.resolution}` : ''} {v.price > 0 && <span style={{ color: 'var(--sunset)' }}>· ${v.price}</span>}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--parchment)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chOf(v)}</span>
                <span className="di-tag" style={{ justifySelf: 'start' }}>{catLabel(v.category)}</span>
                <span className="mono" style={{ textAlign: 'right', fontSize: 14, color: 'var(--bone)' }}>{formatViews(v.views || 0)}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: ratio(v) >= 0.02 ? 'var(--lichen)' : 'var(--parchment-dim)' }}>{rp}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Channels */}
      {!loading && channels.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <div className="di-section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 6 }}>● TOP CHANNELS</div>
              <h2 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Most-watched aerial channels</h2>
            </div>
            <span className="di-section-meta">By total views</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {channels.map((c, i) => (
              <div key={c.name} className="di-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--moss), var(--lichen))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {c.name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: 'var(--bone)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>RANK #{i + 1}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
                  <Stat label="Views" value={formatViews(c.views)}/>
                  <Stat label="Clips" value={c.clips}/>
                  <Stat label="Likes %" value={(c.views > 0 ? (c.likes / c.views * 100).toFixed(1) : 0) + '%'} color="var(--lichen)"/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {c.samples.map(v => {
                    const t = ytThumb(v);
                    return (
                      <div key={v.id} onClick={(e) => { e.stopPropagation(); onOpenVideo(v); }} style={{
                        cursor: 'pointer', aspectRatio: '16/9',
                        background: cardBgUrl(t) || thumbGradient(String(v.id||'').length * 7),
                        borderRadius: 3, border: '1px solid var(--line)',
                      }}/>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* By category */}
      {!loading && byCat.length > 0 && (
        <section>
          <div className="di-section-head">
            <div>
              <div className="eyebrow" style={{ color: 'var(--lichen)', marginBottom: 6 }}>● TOP BY CATEGORY</div>
              <h2 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Best in each genre</h2>
            </div>
            <span className="di-section-meta">One leader per category</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {byCat.map(({ cat, video }) => {
              const t = ytThumb(video);
              return (
                <button key={cat} className="di-card" onClick={() => onOpenVideo(video)} style={{
                  textAlign: 'left', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', overflow: 'hidden',
                  background: '#fff', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ aspectRatio: '16/9', width: '100%', background: cardBgUrl(t) || thumbGradient(String(video.id||'').length * 7) }}/>
                  <div style={{ padding: 14 }}>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase' }}>{catLabel(cat)}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: 'var(--bone)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }}>{chOf(video)} · {formatViews(video.views || 0)} views</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: color || 'var(--bone)' }}>{value}</div>
    </div>
  );
}

export function CreatorsPage({ onOpenVideo, onNav }) {
  const [dbVids, setDbVids] = useState([]);
  useEffect(() => { fetchVideos().then(v => setDbVids(v || [])); }, []);

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '40px 28px 60px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>PILOT COMMUNITY</div>
      <h1 style={{ fontSize: 52, marginBottom: 10 }}>Meet the pilots.</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 640, marginBottom: 40 }}>
        데모 프로필 {CREATORS.length}개 표시 중 — 실제 파일럿이 가입하면 점진적으로 교체됩니다. 향후 {STATS.projected.pilots.toLocaleString()}+ verified drone creators in {STATS.projected.countries} countries 목표. Follow your favorites, license their work, commission custom flights.
      </p>
      <div style={{
        background: 'linear-gradient(90deg, var(--amber) 0%, var(--sunset) 100%)',
        color: '#1a2820', padding: '12px 20px',
        borderRadius: 8, marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12,
        fontSize: 13, fontWeight: 600,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>데모 프로필 — 아래 카드들은 모두 샘플 데이터입니다. 팔로우·통계·수익 모두 데모용 수치이며 실제 사용자가 아닙니다. 가입하시면 진짜 파일럿 카드가 추가됩니다.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {CREATORS.map(c => {
          const vids = (dbVids.length ? dbVids : _MV).filter(v => v.creator?.handle === c.handle).slice(0, 3);
          return (
            <div key={c.handle} className="di-card" onClick={() => onNav?.('profile', (c.handle||'').replace(/^@/, ''))} style={{ padding: 24, cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--moss), var(--lichen))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bone)' }}>
                    {c.name}{c.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}<span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', background: 'var(--amber)', color: '#1a2820', padding: '2px 7px', borderRadius: 999 }}>DEMO</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{c.handle} · {c.region}</div>
                </div>
                <FollowButton creatorId={c.id || c.handle} creatorHandle={c.handle} className="btn" style={{ fontSize: 14, padding: '8px 14px' }} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                <Stat label="Followers" value={formatViews(c.followers)}/>
                <Stat label="Clips" value={c.videos}/>
                <Stat label="YTD Earnings" value={'$' + c.earning.toLocaleString()} color="var(--amber)"/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {vids.map(v => {
                  const t = ytThumb(v);
                  return (
                    <div key={v.id} onClick={() => onOpenVideo(v)} style={{
                      cursor: 'pointer', aspectRatio: '16/9',
                      background: cardBgUrl(t) || thumbGradient(parseInt(String(v.id||'').slice(1)) || 0),
                      borderRadius: 2, border: '1px solid var(--line)', position: 'relative',
                    }}>
                      {v.price > 0 && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, padding: '1px 4px', background: 'var(--sunset)', color: '#fff', fontFamily: 'var(--font-mono)', borderRadius: 2 }}>${v.price}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
