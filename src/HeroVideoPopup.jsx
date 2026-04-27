import React, { useState, useEffect } from 'react';
import { useContent } from './content/ContentContext';

// Hero video popup — auto-rotates 5 K-pop concert videos on home page entry.
// CMS-controlled video list via site_content key 'home.featured.videos' (JSON array of YouTube IDs).
// Falls back to top 5 K-pop concert videos by views if list is empty.
// User can dismiss for session (X) or for 24 hours (button).
export function HeroVideoPopup({ onOpenVideo }) {
  const cmsList = useContent('home.featured.videos', null); const popupEnabled = useContent('home.featured.popup_enabled', 'true');
  const [videos, setVideos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (popupEnabled === 'false' || popupEnabled === false || popupEnabled === '0') return; if (sessionStorage.getItem('heroPopupDismissed') === '1') return;
    const until = Number(localStorage.getItem('heroPopupDismissedUntil') || 0);
    if (until > Date.now()) return;
    setOpen(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const SUPA = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://eotsbncgkgewgbemaarp.supabase.co';
      const KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || '';
      const headers = { apikey: KEY, Authorization: 'Bearer ' + KEY };
      let list = [];
      let ids = [];
      try {
        const arr = typeof cmsList === 'string' ? JSON.parse(cmsList) : cmsList;
        if (Array.isArray(arr)) {
          ids = arr.map(it => typeof it === 'string' ? it : (it && (it.youtube_id || it.id))).filter(Boolean);
        }
      } catch {}
      if (ids.length > 0) {
        const url = SUPA + '/rest/v1/videos?select=id,youtube_id,title,views,thumb_url,youtube_channel&youtube_id=in.(' + ids.map(i => '"' + i + '"').join(',') + ')';
        try {
          const r = await fetch(url, { headers });
          if (r.ok) {
            const rows = await r.json();
            list = ids.map(id => rows.find(rr => rr.youtube_id === id)).filter(Boolean);
          }
        } catch {}
      }
      if (list.length === 0) {
        const url = SUPA + '/rest/v1/videos?select=id,youtube_id,title,views,thumb_url,youtube_channel&category=eq.concert&youtube_id=not.is.null&order=views.desc.nullslast&limit=5';
        try {
          const r = await fetch(url, { headers });
          if (r.ok) list = await r.json();
        } catch {}
      }
      if (!cancelled) setVideos(list);
    })();
    return () => { cancelled = true; };
  }, [cmsList]);

  useEffect(() => {
    if (!open || videos.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % videos.length), 75000);
    return () => clearInterval(t);
  }, [open, videos.length]);

  if (!open || videos.length === 0) return null;

  const v = videos[idx] || videos[0];
  const ytId = v.youtube_id;
  const closeSession = () => {
    setOpen(false);
    sessionStorage.setItem('heroPopupDismissed', '1');
  };
  const close24h = () => {
    setOpen(false);
    localStorage.setItem('heroPopupDismissedUntil', String(Date.now() + 24 * 3600 * 1000));
    sessionStorage.setItem('heroPopupDismissed', '1');
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '3vh 3vw',
    }}>
      <div style={{
        width: 'min(94vw, 1700px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, color: '#fff', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.18em',
            color: '#ffb84a', padding: '4px 8px', border: '1px solid #ffb84a', borderRadius: 2,
            flexShrink: 0,
          }}>● FEATURED · K-POP DRONE</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>{v.title}</span>
        </div>
        <button onClick={closeSession} aria-label="Close" style={{
          width: 40, height: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          fontSize: 22, lineHeight: 1, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>×</button>
      </div>

      <div style={{
        position: 'relative',
        width: 'min(94vw, calc((84vh - 110px) * 16 / 9))',
        aspectRatio: '16 / 9',
        background: '#000',
        boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <iframe
          key={ytId}
          src={'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1'}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        {videos.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={'Video ' + (i + 1)} style={{
            width: i === idx ? 32 : 12, height: 6, borderRadius: 3,
            background: i === idx ? '#ffb84a' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'width 0.2s, background 0.2s',
          }} />
        ))}
        <span style={{
          marginLeft: 12, color: 'rgba(255,255,255,0.6)',
          fontFamily: 'var(--font-mono)', fontSize: 12,
        }}>{idx + 1} / {videos.length}</span>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => { closeSession(); onOpenVideo && onOpenVideo(v); }} style={{
          padding: '10px 22px',
          background: '#ffb84a', color: '#1a1a1a',
          border: 'none', borderRadius: 999,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Watch full →</button>
        <button onClick={close24h} style={{
          padding: '10px 22px',
          background: 'transparent', color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999,
          fontSize: 14, cursor: 'pointer',
        }}>24시간 보지 않기</button>
      </div>
    </div>
  );
}
