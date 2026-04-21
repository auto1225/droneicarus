// comments.jsx — Comments thread + timestamp annotations
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from './toast';
import { fetchComments, postComment } from './db/comments';
import { useAuth } from './auth/AuthContext';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

const COMMENT_SEED = [
  {
    id: 'c1', user: 'Maya Chen', handle: '@maya.aerial', avatar: 'MC',
    role: 'Creator', verified: true,
    time: '2d ago', likes: 47, ts: '0:12',
    body: 'The way you caught the golden hour bouncing off the limestone at 0:12 — chef\'s kiss 👨‍🍳 What ND filter were you running?',
    replies: [
      { id: 'r1', user: 'Amira Haddad', handle: '@amira.skies', avatar: 'AH', verified: true, time: '2d ago', likes: 12, body: 'ND64. Sun was brutal, had to pull back ISO to 100.' }
    ]
  },
  {
    id: 'c2', user: 'Diego Navarro', handle: '@diego.films', avatar: 'DN',
    role: 'Studio', verified: false,
    time: '5d ago', likes: 23, ts: '1:48',
    body: 'Licensed the 4K extended for a Netflix pitch deck — cleared review in 20 min. Fastest turnaround I\'ve had on this platform.',
    replies: []
  },
  {
    id: 'c3', user: 'Kenji Watanabe', handle: '@kenji.dji', avatar: 'KW',
    role: 'Pilot', verified: false,
    time: '1w ago', likes: 8, ts: null,
    body: 'How did you get clearance this close to the complex? I tried last March and CAA denied me three times.',
    replies: []
  }
];

export function CommentThread({ video }) {
  const { profile, user } = useAuth();
  const [comments, setComments] = React.useState(COMMENT_SEED);
  const [draft, setDraft] = React.useState('');
  const [sort, setSort] = React.useState('top'); // top | new
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyDraft, setReplyDraft] = React.useState('');
  const [liked, setLiked] = React.useState({});

  // Load from Supabase when backing data is enabled and the video has a UUID id.
  useEffect(() => {
    if (!USE_SUPABASE || !video?.id) return;
    // prototype videos use 'v0','v1'… ids — those aren't valid UUIDs
    if (!/^[0-9a-f]{8}-/.test(String(video.id))) return;
    let alive = true;
    fetchComments(video.id).then(rows => {
      if (!alive) return;
      setComments(rows.map(adaptDbComment));
    });
    return () => { alive = false; };
  }, [video?.id]);

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    const me = profile ? {
      user: profile.display_name || 'You',
      handle: profile.handle,
      avatar: (profile.display_name || 'U').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
      role: profile.role === 'pilot' ? 'Pilot' : profile.role === 'studio' ? 'Studio' : 'Viewer',
      verified: profile.pilot_verified,
    } : { user: 'You', handle: '@you', avatar: 'YU', role: 'Viewer', verified: false };
    const optimistic = {
      id: 'c' + Date.now(), ...me, time: 'just now', likes: 0, ts: null, body, replies: [],
    };
    setComments([optimistic, ...comments]);
    setDraft('');
    toast?.('Comment posted');
    if (USE_SUPABASE && user && /^[0-9a-f]{8}-/.test(String(video?.id))) {
      try {
        const row = await postComment({ videoId: video.id, body });
        setComments((cur) => cur.map(c => c.id === optimistic.id ? adaptDbComment({ ...row, replies: [] }) : c));
      } catch (e) {
        toast?.('Could not save', e.message, 'error');
      }
    }
  }

  async function submitReply(cid) {
    const body = replyDraft.trim();
    if (!body) return;
    const me = profile ? {
      user: profile.display_name || 'You',
      handle: profile.handle,
      avatar: (profile.display_name || 'U').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
      verified: profile.pilot_verified,
    } : { user: 'You', handle: '@you', avatar: 'YU', verified: false };
    const optimistic = { id: 'r' + Date.now(), ...me, time: 'just now', likes: 0, body };
    setComments(comments.map(c => c.id === cid ? { ...c, replies: [...c.replies, optimistic] } : c));
    setReplyDraft(''); setReplyTo(null);
    toast?.('Reply posted');
    if (USE_SUPABASE && user && /^[0-9a-f]{8}-/.test(String(cid))) {
      try { await postComment({ videoId: video.id, body, parentId: cid }); } catch (e) {
        toast?.('Could not save reply', e.message, 'error');
      }
    }
  }

  function adaptDbComment(r) {
    const a = r.author || {};
    return {
      id: r.id,
      user: a.display_name || 'Anonymous',
      handle: a.handle || '@?',
      avatar: (a.display_name || '?').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
      role: a.role === 'pilot' ? 'Pilot' : a.role === 'studio' ? 'Studio' : 'Viewer',
      verified: a.pilot_verified || false,
      time: r.created_at ? relTime(r.created_at) : 'just now',
      likes: r.likes_count || 0,
      ts: null,
      body: r.body,
      replies: (r.replies || []).map(adaptDbComment),
    };
  }

  function relTime(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d <= 0) return 'today';
    if (d === 1) return '1d ago';
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.round(d / 7)}w ago`;
    return `${Math.round(d / 30)}mo ago`;
  }

  function toggleLike(id) {
    setLiked({ ...liked, [id]: !liked[id] });
  }

  const sorted = [...comments].sort((a, b) => sort === 'top' ? b.likes - a.likes : 0);

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, margin: 0 }}>
            {comments.length + comments.reduce((n, c) => n + c.replies.length, 0)} Comments
          </h3>
          <span className="eyebrow" style={{ color: 'var(--ink-3)' }}>Field notes from the community</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', padding: 3, borderRadius: 8, border: '1px solid var(--line)' }}>
          {['top', 'new'].map(k => (
            <button key={k} onClick={() => setSort(k)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                background: sort === k ? 'var(--paper)' : 'transparent',
                color: sort === k ? 'var(--ink-1)' : 'var(--ink-3)',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                boxShadow: sort === k ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}>
              {k === 'top' ? 'Top' : 'Newest'}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14,
        padding: 18, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 28
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--sunset), var(--ember))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 13
        }}>YU</div>
        <div>
          <textarea
            value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Share your take — ask about gear, licensing, or the pilot's approach…"
            style={{
              width: '100%', minHeight: 70, padding: 12, resize: 'vertical',
              border: '1px solid var(--line)', borderRadius: 8, background: 'var(--paper)',
              fontFamily: 'inherit', fontSize: 14, color: 'var(--ink-1)', outline: 'none'
            }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--ink-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                Emoji
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                @ Timestamp
              </span>
              <span style={{ color: draft.length > 800 ? 'var(--ember)' : 'var(--ink-3)' }}>
                {draft.length}/1000
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDraft('')} disabled={!draft}
                style={{
                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  background: 'transparent', color: 'var(--ink-3)',
                  border: 'none', cursor: draft ? 'pointer' : 'not-allowed', borderRadius: 6
                }}>Cancel</button>
              <button onClick={submit} disabled={!draft.trim()}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  background: draft.trim() ? 'var(--sunset)' : 'var(--line)',
                  color: draft.trim() ? 'white' : 'var(--ink-3)',
                  border: 'none', borderRadius: 6, cursor: draft.trim() ? 'pointer' : 'not-allowed'
                }}>Post</button>
            </div>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sorted.map(c => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #8a6a4a, #5d3f27)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14
            }}>{c.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 4, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-1)', whiteSpace: 'nowrap' }}>{c.user}</span>
                {c.verified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--sunset)"><path d="M12 2l2.4 2.8L18 4l.4 3.6L22 10l-2 3 2 3-3.6 2.4L18 22l-3.6-.4L12 24l-2.4-2.4L6 22l-.4-3.6L2 16l2-3-2-3 3.6-2.4L6 4l3.6.4L12 2z"/><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/></svg>
                )}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 3,
                  background: c.role === 'Creator' ? 'rgba(197,90,55,0.12)' : c.role === 'Studio' ? 'rgba(60,90,70,0.12)' : 'var(--paper-2)',
                  color: c.role === 'Creator' ? 'var(--sunset)' : c.role === 'Studio' ? 'var(--moss)' : 'var(--ink-3)'
                }}>{c.role}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{c.handle} · {c.time}</span>
                {c.ts && (
                  <button style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                    background: 'var(--ink-1)', color: 'var(--paper)', border: 'none', cursor: 'pointer',
                    fontVariantNumeric: 'tabular-nums'
                  }} data-placeholder="true">▸ {c.ts}</button>
                )}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-1)', margin: '0 0 10px 0' }}>{c.body}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: 'var(--ink-3)' }}>
                <button onClick={() => toggleLike(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: liked[c.id] ? 'var(--sunset)' : 'var(--ink-3)', fontWeight: liked[c.id] ? 700 : 500
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={liked[c.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L15 2a3.13 3.13 0 0 1 3 3.88z"/>
                  </svg>
                  {c.likes + (liked[c.id] ? 1 : 0)}
                </button>
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  style={{ padding: 0, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontWeight: 500 }}>
                  Reply
                </button>
                <button style={{ padding: 0, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer' }} data-placeholder="true">Report</button>
              </div>

              {/* Reply composer */}
              {replyTo === c.id && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--sunset), var(--ember))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 11
                  }}>YU</div>
                  <div>
                    <textarea
                      value={replyDraft} onChange={e => setReplyDraft(e.target.value)}
                      placeholder={`Reply to ${c.user}…`} autoFocus
                      style={{
                        width: '100%', minHeight: 50, padding: 10, resize: 'vertical',
                        border: '1px solid var(--line)', borderRadius: 6, background: 'var(--paper)',
                        fontFamily: 'inherit', fontSize: 13, color: 'var(--ink-1)', outline: 'none'
                      }}/>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setReplyTo(null); setReplyDraft(''); }}
                        style={{ padding: '6px 12px', fontSize: 12, background: 'transparent', color: 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={() => submitReply(c.id)} disabled={!replyDraft.trim()}
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 700,
                          background: replyDraft.trim() ? 'var(--sunset)' : 'var(--line)',
                          color: replyDraft.trim() ? 'white' : 'var(--ink-3)',
                          border: 'none', borderRadius: 5, cursor: replyDraft.trim() ? 'pointer' : 'not-allowed'
                        }}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {c.replies.length > 0 && (
                <div style={{ marginTop: 16, paddingLeft: 18, borderLeft: '2px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {c.replies.map(r => (
                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #5d7f6a, #3c5a46)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 11
                      }}>{r.avatar}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 3, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-1)', whiteSpace: 'nowrap' }}>{r.user}</span>
                          {r.verified && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--sunset)"><path d="M12 2l2.4 2.8L18 4l.4 3.6L22 10l-2 3 2 3-3.6 2.4L18 22l-3.6-.4L12 24l-2.4-2.4L6 22l-.4-3.6L2 16l2-3-2-3 3.6-2.4L6 4l3.6.4L12 2z"/></svg>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{r.handle} · {r.time}</span>
                        </div>
                        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-1)', margin: '0 0 6px 0' }}>{r.body}</p>
                        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-3)' }}>
                          <button onClick={() => toggleLike(r.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: liked[r.id] ? 'var(--sunset)' : 'var(--ink-3)', fontWeight: liked[r.id] ? 700 : 500
                            }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={liked[r.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                              <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L15 2a3.13 3.13 0 0 1 3 3.88z"/>
                            </svg>
                            {r.likes + (liked[r.id] ? 1 : 0)}
                          </button>
                          <button style={{ padding: 0, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer' }} data-placeholder="true">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button style={{
        marginTop: 24, width: '100%', padding: 14,
        background: 'transparent', border: '1px dashed var(--line)', borderRadius: 10,
        color: 'var(--ink-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        letterSpacing: '0.03em'
      }} data-placeholder="true">
        Load more comments
      </button>
    </div>
  );
}

