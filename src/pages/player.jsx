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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, padding: '28px', maxWidth: 1760, margin: '0 auto' }}>
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
                <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', marginTop: 20, letterSpacing: '0.14em' }}>
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
              color: 'var(--sunset)', fontFamily: 'var(--font-mono)', fontSize: 12,
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
            <span className="chip" style={{ padding: '4px 10px', fontSize: 12 }}>
              <span className="chip-icon" style={{ display: 'inline-flex' }}>{CAT_ICONS[video.category] && CAT_ICONS[video.category](12)}</span>
              {CATEGORIES.find(c => c.id === video.category)?.label}
            </span>
            <span className="mono" style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>{video.resolution}</span>
            <span className="mono" style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>24 FPS</span>
            <span className="mono" style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--line-strong)', borderRadius: 999, letterSpacing: '0.1em' }}>D-LOG</span>
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
              }}>{video.creator.name[0]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {video.creator.name}
                  {video.creator.verified && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{video.creator.handle} · {formatViews(128000)} followers</div>
              </div>
              <FollowButton creatorId={video.creator?.id || video.creator?.handle} creatorHandle={video.creator?.handle} className="btn" style={{ marginLeft: 12, padding: '8px 18px', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onToggleLike} className="btn secondary" style={{ fontSize: 13, color: liked ? 'var(--sunset)' : undefined }}><Ic.heart/> {formatViews(video.likes + (liked ? 1 : 0))}</button>
              <button className="btn secondary" style={{ fontSize: 13 }} data-placeholder="true">↗ Share</button>
              <button className="btn secondary" style={{ fontSize: 13 }} data-placeholder="true">⎙ Save</button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 0, marginTop: 20, border: '1px solid var(--line)', borderRadius: 4 }}>
            {[
              ['Views', formatViews(video.views)],
              ['Uploaded', formatDays(video.uploadedDaysAgo)],
              ['Duration', video.duration],
              ['Location', loc?.name],
              ['Coords', `${loc?.lat.toFixed(3)}°, ${loc?.lon.toFixed(3)}°`],
            ].map(([k, v], i) => (
              <div key={k} style={{ flex: 1, padding: '14px 18px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginTop: 24, padding: 20, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>FLIGHT NOTES</div>
            <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.65, marginBottom: 14 }}>{video.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {video.tags.map(t => (
                <span key={t} className="mono" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--forest-800)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--parchment)' }}>#{t}</span>
              ))}
            </div>
          </div>

          {/* What you download — delivery transparency */}
          <div style={{ marginTop: 24, padding: 0, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'var(--forest-900)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--amber)' }}>WHAT YOU ACTUALLY DOWNLOAD</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 2 }}>Preview is watermarked 1280p · original is delivered the instant you license.</div>
              </div>
              <span className="mono" style={{ fontSize: 10, padding: '4px 8px', border: '1px solid var(--lichen)', color: 'var(--lichen)', borderRadius: 2, letterSpacing: '0.1em' }}>VERIFIED</span>
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
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* License tiers — comparison */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="eyebrow">CHOOSE A LICENSE TIER</div>
              <button style={{ fontSize: 12, color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 3 }} onClick={() => onNav('pricing')}>See full comparison →</button>
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
                  {t.popular && <span style={{ position: 'absolute', top: -8, right: 12, padding: '2px 8px', background: 'var(--amber)', color: '#1a2820', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: 2 }}>POPULAR</span>}
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: t.popular ? 'var(--amber)' : 'var(--parchment-dim)', marginBottom: 6 }}>{t.name.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{t.price}</div>
                  <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 12, minHeight: 28, lineHeight: 1.35 }}>{t.cover}<br/>{t.restrict}</div>
                  <ul style={{ listStyle: 'none', fontSize: 12, color: 'var(--parchment)', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    {t.items.map(i => <li key={i} style={{ display: 'flex', gap: 6 }}><span style={{ color: t.popular ? 'var(--amber)' : 'var(--lichen)', flexShrink: 0, marginTop: 1 }}><Ic.check/></span>{i}</li>)}
                  </ul>
                  <button className={'btn ' + (t.popular ? '' : 'secondary')} style={{ fontSize: 11, marginTop: 'auto', padding: '8px 12px' }} onClick={() => onNav('checkout', video.id)}>
                    {t.price === 'Free' ? 'Download free' : (t.price === 'By quote' ? 'Request quote' : 'License ' + t.price)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection video={video} onNav={onNav} />

        {/* Comments */}
        <CommentThread video={video}/>
      </div>

      {/* Right rail: related at this landmark */}
      <aside>
        <div className="eyebrow" style={{ marginBottom: 10 }}>MORE FROM {loc?.name.toUpperCase()}</div>
        <button onClick={() => { onNav('home'); }} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4,
          marginBottom: 16, textAlign: 'left',
        }}>
          <span style={{ color: 'var(--amber)' }}><Ic.pin/></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{loc?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{loc?.country} · Back to map</div>
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
                <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 5px', background: 'rgba(13,20,16,0.85)', borderRadius: 2 }}>{v.duration}</div>
                {v.price > 0 && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 10, padding: '1px 5px', background: 'var(--sunset)', color: 'var(--bone)', fontFamily: 'var(--font-mono)', borderRadius: 2 }}>${v.price}</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v.creator.handle}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{formatViews(v.views)} views · {formatDays(v.uploadedDaysAgo)}</div>
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
          Reviews {avg && <span style={{ color: 'var(--amber)', fontSize: 16, marginLeft: 6 }}>★ {avg}</span>}
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
              fontSize: 18, color: n <= rating ? 'var(--amber)' : 'var(--parchment-dim)', padding: 0,
            }}>★</button>
          ))}
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Your role (e.g. Freelance filmmaker)"
            style={{ flex: 1, marginLeft: 12, background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 3, padding: '6px 10px', fontSize: 12, color: 'var(--bone)' }}
          />
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Did this clip deliver what the preview promised?"
          rows={3}
          style={{ width: '100%', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 3, padding: 10, fontSize: 13, color: 'var(--bone)', resize: 'vertical' }}
        />
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button onClick={submit} disabled={saving || !draft.trim()} className="btn" style={{ fontSize: 12, padding: '8px 14px', opacity: (saving || !draft.trim()) ? 0.5 : 1 }}>
            {saving ? 'Posting…' : 'Post review'}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ padding: '16px 20px', border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.author} <span style={{ color: 'var(--parchment-dim)', fontWeight: 400, fontSize: 12 }}>· {r.role}</span></div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{r.date}</div>
            </div>
            <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 6 }}>{'★'.repeat(r.rating)}<span style={{ color: 'var(--parchment-dim)' }}>{'★'.repeat(5 - r.rating)}</span></div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
