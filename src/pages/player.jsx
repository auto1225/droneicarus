// pages/player.jsx — Video player with 3s preview paywall
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, CAT_ICONS, LOCATIONS, VIDEOS, thumbGradient } from '../data';
import { Ic, formatViews, formatDays, FollowButton } from '../components';
import { hasLiked, toggleLike } from '../db/social';
import { toast } from '../toast';
import { signedUrl } from '../db/storage';
import { fetchReviews, postReview } from '../db/commerce';
import { useAuth } from '../auth/AuthContext';
import { CommentThread } from '../comments';
import { useContent } from '../content/ContentContext';

// Parse a YouTube description into compact structured sections.
// Strategy: strip URLs into a separate links array, split on divider lines
// (---- or - - - - or ====), then within each block detect inline headers
// (lines ending with ':' or wrapped in dashes like -Production Team-) and
// group following lines as items under that header.
function parseDescription(raw) {
  if (!raw) return { items: [], links: [] };
  const txt = String(raw).replace(/\r/g, '');

  // 1) Pull out URLs (dedup by host+first-2-path-segments)
  const urlRe = /https?:\/\/[^\s)\]]+/g;
  const allUrls = txt.match(urlRe) || [];
  const seenLinks = new Set(); const links = [];
  for (const u of allUrls) {
    try {
      const o = new URL(u);
      const key = o.host.replace(/^www\./, '') + o.pathname.split('/').slice(0, 3).join('/');
      if (!seenLinks.has(key)) { seenLinks.add(key); links.push({ host: o.host.replace(/^www\./, ''), path: o.pathname || '/', url: u }); }
    } catch {}
  }

  // 2) Strip URLs from body and normalize dividers
  let body = txt.replace(urlRe, '').replace(/\s+\)/g, ')');
  // Lines that are 3+ dashes/equals/underscores OR runs of " - " (3+) → divider
  body = body.replace(/^[ \t]*[\-=_*]{3,}[ \t]*$/gm, '@@SPLIT@@');
  body = body.replace(/(?:[ \t]*-[ \t]*){3,}/g, '@@SPLIT@@');
  body = body.replace(/\n{3,}/g, '\n\n');
  const blocks = body.split(/@@SPLIT@@/).map(s => s.trim()).filter(Boolean);

  // 3) Within each block, split into (header, items) groups.
  // A header is: a line ending with ':' OR wrapped in dashes (-Foo-) OR ALL CAPS short line.
  const items = []; // { header: string|null, lines: string[], variant: 'text'|'list' }
  for (const b of blocks) {
    const lines = b.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    let currentHeader = null; let currentLines = [];
    const flush = () => {
      if (currentLines.length === 0 && !currentHeader) return;
      // Decide variant: if items look like single short labels, render as grid; else paragraph
      const allShort = currentLines.every(l => l.length < 80);
      const looksList = currentLines.length >= 2 && allShort;
      items.push({ header: currentHeader, lines: currentLines, variant: looksList ? 'list' : 'text' });
      currentHeader = null; currentLines = [];
    };
    for (const ln of lines) {
      const isHeader =
        /^-[^-].*[^-]-$/.test(ln) ||                    // -Production Team-
        (/[A-Z]/.test(ln) && ln.endsWith(':') && ln.length < 60) || // MUSIC:
        (/^[A-Z][A-Z\s/]{4,}$/.test(ln) && ln.length < 50);          // ALL CAPS HEADER
      if (isHeader) {
        flush();
        currentHeader = ln.replace(/^-|-$/g, '').replace(/:$/, '').trim();
      } else {
        currentLines.push(ln);
      }
    }
    flush();
  }

  return { items, links };
}

// Compact rendering: header (small caps) + grid of items, OR a paragraph.
function NoteSection({ section }) {
  const { header, lines, variant } = section;
  return (
    <div style={{ marginBottom: 12 }}>
      {header && (
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4, textTransform: 'uppercase' }}>
          {header}
        </div>
      )}
      {variant === 'list' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '4px 16px',
          fontSize: 14, color: 'var(--parchment)', lineHeight: 1.45,
        }}>
          {lines.map((l, i) => <div key={i} style={{ minWidth: 0 }}>{l}</div>)}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
          {lines.join('\n')}
        </p>
      )}
    </div>
  );
}

// Inline chip-style link list, max 10 visible + overflow count
function NoteLinks({ links }) {
  if (!links || links.length === 0) return null;
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? links : links.slice(0, 10);
  const hidden = links.length - visible.length;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>LINKS</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {visible.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', padding: '3px 10px',
            background: 'var(--forest-800)', border: '1px solid var(--line)',
            borderRadius: 999, fontSize: 12, color: 'var(--parchment)',
            textDecoration: 'none', lineHeight: 1.4,
          }}>
            <span style={{ color: 'var(--amber)' }}>{l.host}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{l.path.length > 28 ? l.path.slice(0, 28) + '…' : l.path}</span>
          </a>
        ))}
        {hidden > 0 && (
          <button onClick={() => setExpanded(true)} style={{
            padding: '3px 10px', fontSize: 12, color: 'var(--parchment-dim)',
            border: '1px dashed var(--line)', borderRadius: 999, background: 'transparent',
          }}>+{hidden} more</button>
        )}
      </div>
    </div>
  );
}



// Lightweight sidebar with the same category tree as the Map page.
// Click a group/child -> save filter to sessionStorage + navigate home.
function PlayerSidebar({ onNav }) {
  const hierarchyRaw = useContent('explore.hierarchy', null);
  const hierarchy = useMemo(() => {
    try {
      if (typeof hierarchyRaw === 'object' && hierarchyRaw?.groups) return hierarchyRaw;
      const p = JSON.parse(hierarchyRaw || '{}');
      return (p && p.groups) ? p : null;
    } catch { return null; }
  }, [hierarchyRaw]);
  const [expanded, setExpanded] = useState(() => new Set());
  const toggle = (id) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const goToCategory = (selection) => {
    try { sessionStorage.setItem('mapSelectedFilter', JSON.stringify(selection)); } catch {}
    onNav?.('home');
  };
  if (!hierarchy) {
    return (
      <aside style={{ background: 'var(--ink)', borderRight: '1px solid var(--line)', padding: '20px 14px', overflowY: 'auto' }}>
        <button onClick={() => onNav?.('home')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'var(--bone)', color: 'var(--ink)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <Ic.pin/> Back to map
        </button>
      </aside>
    );
  }
  return (
    <aside style={{ background: 'var(--ink)', borderRight: '1px solid var(--line)', padding: '16px 14px', overflowY: 'auto' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 10, textTransform: 'uppercase' }}>Browse by theme</div>
      <button onClick={() => goToCategory(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', marginBottom: 8, background: 'transparent', color: 'var(--parchment)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left' }}>
        <span><Ic.pin/> Back to map (all clips)</span>
      </button>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hierarchy.groups.map(group => {
          const open = expanded.has(group.id);
          return (
            <div key={group.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                <button onClick={() => toggle(group.id)} style={{ flex: '0 0 auto', width: 22, height: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--parchment-dim)', fontSize: 12 }}>{open ? '\u25BE' : '\u25B8'}</button>
                <button onClick={() => goToCategory({ type: 'group', id: group.id, fine: group.children.flatMap(c => c.fine || []) })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, fontSize: 14, fontWeight: 700, background: 'transparent', color: 'var(--parchment)', border: 'none', cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Ic[group.icon] && <span style={{ display: 'inline-flex' }}>{Ic[group.icon]()}</span>}
                    <span>{group.label}</span>
                  </span>
                </button>
              </div>
              {open && (
                <ul style={{ listStyle: 'none', padding: '0 0 0 24px', margin: '2px 0 0', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.children.map(child => (
                    <li key={child.id}>
                      <button onClick={() => goToCategory({ type: 'child', id: child.id, groupId: group.id, fine: child.fine || [] })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '5px 10px', borderRadius: 6, fontSize: 14, background: 'transparent', color: 'var(--parchment)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function PlayerPage({ video, onNav, onOpenVideo }) {
  if (!video) return <div style={{ padding: 80, textAlign: 'center' }}>No video selected.</div>;
  const [previewRemaining, setPreviewRemaining] = React.useState(video.price > 0 ? 3 : null);
  const [locked, setLocked] = React.useState(video.price > 0);
  const [playing, setPlaying] = React.useState(true);
  const [liked, setLiked] = React.useState(false);
  const [likeBusy, setLikeBusy] = React.useState(false);
  const [signedSrc, setSignedSrc] = React.useState(null);

  // If the video has a Storage path, generate a signed URL for native playback.
  React.useEffect(() => {
    let alive = true;
    if (video.storagePath) {
      signedUrl('videos', video.storagePath, 3600).then(u => {
        if (alive) setSignedSrc(u);
      });
    } else {
      setSignedSrc(null);
    }
    return () => { alive = false; };
  }, [video.id, video.storagePath]);
  const loc = LOCATIONS.find(l => l.id === video.locationId);
  const related = VIDEOS.filter(v => v.locationId === video.locationId && v.id !== video.id).slice(0, 8);

  // Load like state when video is a real DB row (UUID id)
  React.useEffect(() => {
    if (!/^[0-9a-f]{8}-/.test(String(video.id))) return;
    hasLiked(video.id).then(setLiked).catch(() => {});
  }, [video.id]);

  const onToggleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      if (/^[0-9a-f]{8}-/.test(String(video.id))) {
        const now = await toggleLike(video.id);
        setLiked(now);
      } else {
        setLiked(v => !v);
      }
    } catch (e) {
      toast?.('Sign in to like', e.message, 'error');
      onNav?.('signin');
    } finally { setLikeBusy(false); }
  };

  React.useEffect(() => {
    if (previewRemaining === null || previewRemaining <= 0) return;
    const t = setTimeout(() => setPreviewRemaining(previewRemaining - 1), 1000);
    return () => clearTimeout(t);
  }, [previewRemaining]);

  React.useEffect(() => {
    if (previewRemaining === 0 && video.price > 0) {
      setLocked(true);
      setPlaying(false);
    }
  }, [previewRemaining]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 380px', gap: 28, padding: '28px 28px 28px 0', maxWidth: 1900, margin: '0 auto' }}>
      <PlayerSidebar onNav={onNav} />
      <div>
        {/* Video */}
        <div style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}>
          {playing && !locked && signedSrc && (
            <video
              key={signedSrc}
              src={signedSrc}
              title={video.title}
              autoPlay
              controls
              controlsList="nodownload"
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
            />
          )}
          {playing && !locked && !signedSrc && video.ytId && (
            <iframe
              src={`https://www.youtube.com/embed/${video.ytId}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          )}
          {locked && (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                background: thumbGradient(parseInt(video.id.slice(1))),
              }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }} viewBox="0 0 400 225" preserveAspectRatio="none">
                  <g stroke="rgba(245,237,224,0.4)" fill="none" strokeWidth="0.5">
                    {[...Array(10)].map((_, i) => (
                      <path key={i} d={`M0 ${20 + i*20} Q100 ${i*20} 200 ${30 + i*20} T400 ${10 + i*20}`}/>
                    ))}
                  </g>
                </svg>
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(13,20,16,0.82)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 40, textAlign: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2px solid var(--sunset)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, color: 'var(--sunset)',
                }}><Ic.lock/></div>
                <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 10 }}>PREVIEW ENDED · 3 SECONDS</div>
                <h2 style={{ fontSize: 32, marginBottom: 12 }}>Unlock the full cut</h2>
                <p style={{ fontSize: 14, color: 'var(--parchment)', maxWidth: 460, marginBottom: 24 }}>
                  The creator has set a licensing fee on this clip. Unlock for HD streaming, a 4K download, and a commercial-use license.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn primary" style={{ padding: '12px 24px', fontSize: 14 }} data-placeholder="true">
                    Unlock for ${video.price}
                  </button>
                  <button className="btn secondary" style={{ padding: '12px 24px', fontSize: 14 }}
                    onClick={() => { setPreviewRemaining(3); setLocked(false); setPlaying(true); }}>
                    Watch preview again
                  </button>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 20, letterSpacing: '0.14em' }}>
                  ONE-TIME · NO SUBSCRIPTION · REFUND WITHIN 24H
                </div>
              </div>
            </>
          )}
          {playing && !locked && previewRemaining !== null && previewRemaining > 0 && (
            <div style={{
              position: 'absolute', top: 16, left: 16, zIndex: 10,
              background: 'rgba(13,20,16,0.9)', border: '1px solid var(--sunset)',
              padding: '8px 14px', borderRadius: 2,
              display: 'flex', alignItems: 'center', gap: 10,
              color: 'var(--sunset)', fontFamily: 'var(--font-mono)', fontSize: 14,
              letterSpacing: '0.12em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sunset)', animation: 'pin-pulse 1s infinite' }}/>
              PREVIEW · {previewRemaining}s
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="chip" style={{ padding: '4px 10px', fontSize: 14 }}>
              <span className="chip-icon" style={{ display: 'inline-flex' }}>{CAT_ICONS[video.category] && CAT_ICONS[video.category](12)}</span>
              {CATEGORIES.find(c => c.id === video.category)?.label}
            </span>
            <span className="mono" style={{ fontSize: 12, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>{video.resolution}</span>
            <span className="mono" style={{ fontSize: 12, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>24 FPS</span>
            <span className="mono" style={{ fontSize: 12, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>D-LOG</span>
            {video.price === 0 ? <span className="tag-free" style={{ padding: '4px 10px' }}>FREE · CC-BY</span> : <span className="tag-paid" style={{ padding: '4px 10px' }}>LICENSED · ${video.price}</span>}
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 12, letterSpacing: '-0.02em' }}>{video.title}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--moss)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: 'var(--bone)', border: '1px solid var(--line-strong)',
              }}>{(video.creator?.name || video.title || 'P')[0]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {video.creator?.name || video.channel || 'Drone Icarus pilot'}
                  {video.creator?.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                </div>
                <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{video.creator?.handle || video.channel || (video.source === 'original' ? 'Pilot upload' : '')} {video.creator?.handle ? ' · ' + formatViews(128000) + ' followers' : ''}</div>
              </div>
              <FollowButton creatorId={video.creator?.id || video.creator?.handle} creatorHandle={video.creator?.handle} className="btn" style={{ marginLeft: 12, padding: '8px 18px', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onToggleLike} className="btn secondary" style={{ fontSize: 14, color: liked ? 'var(--sunset)' : undefined }}><Ic.heart/> {formatViews(video.likes + (liked ? 1 : 0))}</button>
              <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">↗ Share</button>
              <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">⎙ Save</button>
            </div>
          </div>

          {/* Stats strip — only show columns we actually have data for */}
          {(() => {
            const vLat = Number.isFinite(video.lat) ? video.lat : (Number.isFinite(loc?.lat) ? loc.lat : null);
            const vLon = Number.isFinite(video.lon) ? video.lon : (Number.isFinite(loc?.lon) ? loc.lon : null);
            const placeName = loc?.name || video.inferredLocationRaw?.name || video.inferredLocationRaw?.value || video.country || null;
            const uploaded = (video.uploadedDaysAgo === 0 || video.uploadedDaysAgo == null) ? 'Today' : formatDays(video.uploadedDaysAgo);
            const cells = [
              ['Views', video.views != null ? formatViews(video.views) : null],
              ['Uploaded', uploaded],
              ['Duration', video.duration || null],
              ['Location', placeName],
              (vLat != null && vLon != null) ? ['Coords', `${vLat.toFixed(3)}°, ${vLon.toFixed(3)}°`] : null,
            ].filter(c => c && c[1]);
            if (cells.length === 0) return null;
            return (
              <div style={{ display: 'flex', gap: 0, marginTop: 20, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                {cells.map(([k, v], i) => (
                  <div key={k} style={{ flex: 1, padding: '14px 18px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none', minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Flight notes — only render when there's actual content */}
          {(() => {
            const _p = parseDescription(video.description);
            const _hasContent = _p.items.length > 0 || _p.links.length > 0 || (video.tags && video.tags.length > 0);
            if (!_hasContent) return null;
            return (
              <div style={{ marginTop: 24, padding: 20, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>FLIGHT NOTES</div>
                {_p.items.map((s, i) => <NoteSection key={i} section={s} />)}
                <NoteLinks links={_p.links} />
                {video.tags && video.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    {video.tags.map(t => (
                      <span key={t} className="mono" style={{ fontSize: 12, padding: '3px 8px', background: 'var(--forest-800)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--parchment)' }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {video.source !== 'youtube' && video.price > 0 && (<>
          {/* What you download — delivery transparency */}
          <div style={{ marginTop: 24, padding: 0, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'var(--forest-900)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--amber)' }}>WHAT YOU ACTUALLY DOWNLOAD</div>
                <div style={{ fontSize: 14, color: 'var(--parchment-dim)', marginTop: 2 }}>Preview is watermarked 1280p · original is delivered the instant you license.</div>
              </div>
              <span className="mono" style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--lichen)', color: 'var(--lichen)', borderRadius: 2, letterSpacing: '0.1em' }}>VERIFIED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                ['Resolution', '5.1K · 5120×2700'],
                ['Codec', 'ProRes 422 HQ'],
                ['Bit rate', '735 Mb/s'],
                ['Color space', 'Rec.709 + D-LOG'],
                ['Frame rate', '30 fps (also 60 fps)'],
                ['Aspect', '16:9 · native'],
                ['File size', '2.4 GB · 9s clip'],
                ['Audio', 'None (silent)'],
              ].map(([k, v], i) => (
                <div key={k} style={{
                  padding: '14px 16px',
                  borderTop: i >= 4 ? '1px solid var(--line)' : 'none',
                  borderLeft: i % 4 !== 0 ? '1px solid var(--line)' : 'none',
                }}>
                  <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* License tiers — comparison */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="eyebrow">CHOOSE A LICENSE TIER</div>
              <button style={{ fontSize: 14, color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 3 }} onClick={() => onNav('pricing')}>See full comparison →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                {
                  name: 'Personal', price: video.price === 0 ? 'Free' : '$' + Math.round(video.price * 0.4),
                  cover: 'One project · social · non-commercial', restrict: 'No ads, no broadcast', popular: false,
                  items: ['Social organic', 'Student films', 'Portfolio use', 'Unlimited edits'],
                },
                {
                  name: 'Commercial 1yr', price: video.price === 0 ? 'Free' : '$' + video.price,
                  cover: 'Full commercial · 12 months', restrict: 'Worldwide · 1 brand', popular: true,
                  items: ['Paid social & ads', 'Websites & apps', 'Events & trade shows', 'Client billed work'],
                },
                {
                  name: 'Extended', price: video.price === 0 ? 'Free' : '$' + (video.price + 99),
                  cover: 'Broadcast & streaming', restrict: 'Worldwide · 1 production', popular: false,
                  items: ['TV · OTT · theatrical', 'Unlimited territories', 'Reframe & edit', 'E&O insurance docs'],
                },
                {
                  name: 'Exclusive', price: 'By quote',
                  cover: 'Buyout · removed from catalog', restrict: 'Perpetual · all media', popular: false,
                  items: ['Remove from catalog', 'Source RAW + LUT', 'Indemnification', 'Direct pilot contact'],
                },
              ].map(t => (
                <div key={t.name} style={{
                  padding: 16, border: '1px solid ' + (t.popular ? 'var(--amber)' : 'var(--line)'),
                  borderRadius: 4, background: t.popular ? 'rgba(232,176,74,0.04)' : 'var(--forest-900)',
                  position: 'relative', display: 'flex', flexDirection: 'column',
                }}>
                  {t.popular && <span style={{ position: 'absolute', top: -8, right: 12, padding: '2px 8px', background: 'var(--amber)', color: '#1a2820', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: 2 }}>POPULAR</span>}
                  <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: t.popular ? 'var(--amber)' : 'var(--parchment-dim)', marginBottom: 6 }}>{t.name.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{t.price}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 12, minHeight: 28, lineHeight: 1.35 }}>{t.cover}<br/>{t.restrict}</div>
                  <ul style={{ listStyle: 'none', fontSize: 14, color: 'var(--parchment)', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    {t.items.map(i => <li key={i} style={{ display: 'flex', gap: 6 }}><span style={{ color: t.popular ? 'var(--amber)' : 'var(--lichen)', flexShrink: 0, marginTop: 1 }}><Ic.check/></span>{i}</li>)}
                  </ul>
                  <button className={'btn ' + (t.popular ? '' : 'secondary')} style={{ fontSize: 12, marginTop: 'auto', padding: '8px 12px' }} onClick={() => onNav('checkout', video.id)}>
                    {t.price === 'Free' ? 'Download free' : (t.price === 'By quote' ? 'Request quote' : 'License ' + t.price)}
                  </button>
                </div>
              ))}
            </div>
          </div>
          </>)}

          {/* Free YouTube clip — polished credit + watch CTA */}
          {video.source === 'youtube' && (
            <div className="di-license-card">
              <div className="badge"><Ic.check/> Free to use · Creative Commons BY 4.0</div>
              <p>
                This clip is published on YouTube under a Creative Commons Attribution license. You may embed, share, and reuse it &mdash; including for commercial work &mdash; provided you credit the original creator.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <a href={`https://www.youtube.com/watch?v=${video.youtubeId || video.ytId}`} target="_blank" rel="noopener noreferrer"
                   className="btn" style={{ fontSize: 14, padding: '10px 18px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Ic.play size={14}/> Watch on YouTube
                </a>
                <span className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>
                  CREDIT — {video.creator?.name || video.channel || 'YouTube creator'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <ReviewsSection video={video} onNav={onNav} />

        {/* Comments */}
        <CommentThread video={video}/>
      </div>

      {/* Right rail: related at this landmark */}
      <aside>
        <div className="eyebrow" style={{ marginBottom: 10 }}>MORE FROM {(loc?.name || video.inferredLocationRaw?.name || 'THIS LOCATION').toString().toUpperCase()}</div>
        <button onClick={() => { onNav('home'); }} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4,
          marginBottom: 16, textAlign: 'left',
        }}>
          <span style={{ color: 'var(--amber)' }}><Ic.pin/></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{loc?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{loc?.country} · Back to map</div>
          </div>
          <span style={{ color: 'var(--parchment-dim)' }}><Ic.chevron/></span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {related.map(v => (
            <div key={v.id} onClick={() => onOpenVideo(v)} style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 160, aspectRatio: '16/9', flexShrink: 0,
                background: thumbGradient(parseInt(v.id.slice(1))),
                borderRadius: 3, position: 'relative', border: '1px solid var(--line)',
              }}>
                <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 12, fontFamily: 'var(--font-mono)', padding: '1px 5px', background: 'rgba(13,20,16,0.85)', borderRadius: 2 }}>{v.duration}</div>
                {v.price > 0 && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, padding: '1px 5px', background: 'var(--sunset)', color: 'var(--bone)', fontFamily: 'var(--font-mono)', borderRadius: 2 }}>${v.price}</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{v.creator?.handle || v.channel || 'pilot'}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{formatViews(v.views)} views · {formatDays(v.uploadedDaysAgo)}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}


function ReviewsSection({ video, onNav }) {
  const { user } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const [rating, setRating] = React.useState(5);
  const [role, setRole] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetchReviews(video.id).then(r => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [video.id]);

  const submit = async () => {
    if (!user) { toast?.('Sign in to review', '', 'error'); onNav?.('signin'); return; }
    if (!draft.trim()) return;
    setSaving(true);
    try {
      if (/^[0-9a-f]{8}-/.test(String(video.id))) {
        await postReview({ videoId: video.id, rating, body: draft.trim(), role });
      }
      setRows([{ author: 'You', role, rating, date: 'just now', text: draft.trim() }, ...rows]);
      setDraft(''); setRole('');
      toast?.('Review posted');
    } catch (e) {
      toast?.('Could not save review', e.message, 'error');
    } finally { setSaving(false); }
  };

  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : null;

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: 0 }}>
          Reviews {avg && <span style={{ color: 'var(--amber)', fontSize: 14, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic.star/>{avg}</span>}
        </h3>
        <span className="eyebrow" style={{ color: 'var(--parchment-dim)' }}>
          Verified buyers · editorial feedback
        </span>
      </div>

      {/* Compose */}
      <div style={{ background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} style={{
              color: n <= rating ? 'var(--amber)' : 'var(--parchment-dim)', padding: '2px 4px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center',
            }}><Ic.star/></button>
          ))}
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Your role (e.g. Freelance filmmaker)"
            className="di-input"
            style={{ flex: 1, marginLeft: 12, padding: '8px 12px' }}
          />
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Did this clip deliver what the preview promised?"
          rows={3}
          className="di-textarea"
        />
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button onClick={submit} disabled={saving || !draft.trim()} className="btn" style={{ fontSize: 14, padding: '8px 14px', opacity: (saving || !draft.trim()) ? 0.5 : 1 }}>
            {saving ? 'Posting…' : 'Post review'}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.length === 0 && (
          <div className="di-empty">
            <div className="di-empty-icon"><Ic.star/></div>
            <div className="di-empty-title">No reviews yet</div>
            Be the first to share how this clip performed in your edit.
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} style={{ padding: '16px 20px', border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.author} <span style={{ color: 'var(--parchment-dim)', fontWeight: 400, fontSize: 14 }}>· {r.role}</span></div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{r.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} style={{ color: idx < r.rating ? 'var(--amber)' : 'var(--parchment-dim)', display: 'inline-flex' }}><Ic.star/></span>
              ))}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
