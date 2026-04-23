// pages/live.jsx — map of pilots currently uploading / broadcasting
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Ic } from '../components';
import { LiveChatPanel, SuperChatModal } from './live-chat';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';
import { fetchSidebarSlots } from '../db/picks';
const lvUseState = useState;
const lvUseEffect = useEffect;
const lvUseRef = useRef;

const LIVE = [
  { id: 'lf1', pilot: 'Hyunwoo Park', handle: '@hyunwoo', country: 'KR', place: 'Seoul — Hangang at dusk', lat: 37.53, lon: 126.97, viewers: 284, started: '12m', kind: 'broadcasting', tier: 2 },
  { id: 'lf2', pilot: 'Alex Rivera', handle: '@alex.aerial', country: 'CO', place: 'Cartagena rooftops', lat: 10.42, lon: -75.54, viewers: 117, started: '28m', kind: 'broadcasting', tier: 1 },
  { id: 'lf3', pilot: 'Yuki Tanaka', handle: '@yuki.sky', country: 'JP', place: 'Shibuya scramble', lat: 35.66, lon: 139.70, viewers: 891, started: '6m', kind: 'broadcasting', tier: 2 },
  { id: 'lf4', pilot: 'Lena Voss', handle: '@lena.v', country: 'DE', place: 'Berlin Tempelhof field', lat: 52.47, lon: 13.40, viewers: 0, started: '2m', kind: 'uploading', progress: 38, tier: 1 },
  { id: 'lf5', pilot: 'Kwame A.', handle: '@kwame.air', country: 'GH', place: 'Cape Coast surf', lat: 5.10, lon: -1.24, viewers: 0, started: '9m', kind: 'uploading', progress: 72, tier: 2 },
  { id: 'lf6', pilot: 'Priya Shah', handle: '@priya.aerial', country: 'IN', place: 'Jaipur rooftops — holi', lat: 26.91, lon: 75.78, viewers: 1420, started: '34m', kind: 'broadcasting', tier: 2 },
  { id: 'lf7', pilot: 'Matteo Rossi', handle: '@matt.film', country: 'IT', place: 'Dolomites golden hour', lat: 46.41, lon: 11.84, viewers: 506, started: '18m', kind: 'broadcasting', tier: 1 },
  { id: 'lf8', pilot: 'Nia Obi', handle: '@nia.lens', country: 'KE', place: 'Maasai Mara — long shadows', lat: -1.49, lon: 35.14, viewers: 338, started: '22m', kind: 'broadcasting', tier: 2 },
];

export function LivePage({ onNav }) {
  const [selected, setSelected] = lvUseState(LIVE[2]);
  const [tipOpen, setTipOpen] = lvUseState(false);
  const [goLiveOpen, setGoLiveOpen] = lvUseState(false);
  const auth = useAuth() || {};
  const [tab, setTab] = lvUseState('all');

  // Pulse animation tick
  const [tick, setTick] = lvUseState(0);
  lvUseEffect(() => { const t = setInterval(() => setTick(x => x+1), 1200); return () => clearInterval(t); }, []);

  const broadcasting = LIVE.filter(l => l.kind === 'broadcasting');
  const uploading = LIVE.filter(l => l.kind === 'uploading');
  const list = tab === 'broadcasting' ? broadcasting : tab === 'uploading' ? uploading : LIVE;

  // Leaflet map
  const mapEl = lvUseRef(null);
  const mapInst = lvUseRef(null);
  const markersRef = lvUseRef({});

  lvUseEffect(() => {
    if (!mapEl.current || mapInst.current) return;
    const map = L.map(mapEl.current, {
      center: [30, 15], zoom: 3, minZoom: 2, maxZoom: 18,
      worldCopyJump: false, zoomControl: true, attributionControl: false,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
    });
    // High-resolution satellite imagery with retina
    const dpr = devicePixelRatio || 1;
    const detectRetina = dpr > 1;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 19,
      detectRetina,
      crossOrigin: true,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
    }).addTo(map);
    // Labels overlay
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19, detectRetina, opacity: 0.9, noWrap: true, bounds: [[-85, -180], [85, 180]],
    }).addTo(map);
    mapInst.current = map;

    LIVE.forEach(l => {
      const isLive = l.kind === 'broadcasting';
      const initial = l.pilot[0];
      const viewers = isLive ? (l.viewers >= 1000 ? (l.viewers/1000).toFixed(1) + 'k' : l.viewers) : (l.progress + '%');
      const html = `<div class="live-pin-v2 ${isLive ? 'live' : 'upload'}">
        <span class="ring"></span>
        <span class="pulse"></span>
        <span class="avatar">${initial}</span>
        <span class="badge">${viewers}</span>
      </div>`;
      const icon = L.divIcon({ className: 'live-pin-wrap', html, iconSize: [52, 52], iconAnchor: [26, 26] });
      const m = L.marker([l.lat, l.lon], { icon, zIndexOffset: isLive ? 1000 : 0 }).addTo(map);
      m.on('click', () => setSelected(l));
      markersRef.current[l.id] = m;
    });
    return () => { map.remove(); mapInst.current = null; };
  }, []);

  lvUseEffect(() => {
    if (mapInst.current && selected) {
      mapInst.current.flyTo([selected.lat, selected.lon], 9, { duration: 1.2 });
    }
  }, [selected]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 320px', minHeight: 'calc(100vh - 62px)' }}>
      {/* Sidebar: list */}
      <aside style={{ borderRight: '1px solid var(--line)', background: 'var(--forest-950)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 22px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sunset)', opacity: tick % 2 ? 1 : 0.3, transition: 'opacity 0.6s' }}/>
            <div className="eyebrow" style={{ color: 'var(--sunset)' }}>LIVE NOW · {LIVE.length} PILOTS</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Who's flying right now</h1>
            <button onClick={() => auth.user ? setGoLiveOpen(true) : onNav?.('signin')}
              style={{ padding: '8px 14px', background: 'var(--sunset)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em' }}>
              ● Go Live
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {[['all','All'],['broadcasting','On air · '+broadcasting.length],['uploading','Uploading · '+uploading.length]].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} className={'chip' + (tab === k ? ' active' : '')} style={{ fontSize: 11 }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {list.map(l => (
            <button key={l.id} onClick={() => setSelected(l)} style={{
              display: 'block', width: '100%', padding: '16px 22px', textAlign: 'left',
              borderBottom: '1px solid var(--line)',
              background: selected?.id === l.id ? 'var(--forest-800)' : 'transparent',
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{l.pilot[0]}</div>
                  {l.kind === 'broadcasting' && <span style={{ position: 'absolute', top: -2, right: -2, padding: '1px 5px', background: 'var(--sunset)', color: '#faf6ec', fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', borderRadius: 2, border: '2px solid var(--forest-950)' }}>LIVE</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {l.pilot}
                    {l.tier === 2 && <span style={{ color: 'var(--amber)' }}><Ic.check/></span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--parchment-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{l.place}</div>
                  {l.kind === 'broadcasting' ? (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--sunset)', letterSpacing: '0.08em' }}>● {l.viewers.toLocaleString()} WATCHING · {l.started}</div>
                  ) : (
                    <div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.08em', marginBottom: 3 }}>↑ UPLOADING {l.progress}%</div>
                      <div style={{ height: 3, background: 'var(--forest-800)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: l.progress + '%', height: '100%', background: 'var(--amber)' }}/>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* World map */}
      <main style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 20 }}>Live flight map</h2>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Pulsing dots are pilots broadcasting live · Click to preview</div>
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--lichen)' }}>● 8 / 8 FEEDS HEALTHY</div>
        </div>

        <div ref={mapEl} style={{ flex: 1, minHeight: 500, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}/>
      </main>

      {/* Right rail: preview */}
      <aside style={{ borderLeft: '1px solid var(--line)', background: 'var(--forest-950)', padding: 22, overflow: 'auto' }}>
        {selected && (
          <>
            <div style={{ aspectRatio: '16/9', background: '#0a0d0a', borderRadius: 3, position: 'relative', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--line-strong)' }}>
              {/* Stylized live frame — atmospheric sky backdrop */}
              <svg viewBox="0 0 320 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id={'sky' + selected.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8b04a" stopOpacity="0.35"/>
                    <stop offset="50%" stopColor="#d97045" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#1a2820" stopOpacity="0.9"/>
                  </linearGradient>
                </defs>
                <rect width="320" height="180" fill={'url(#sky' + selected.id + ')'}/>
                {/* city silhouette */}
                <g fill="#0a0d0a" opacity="0.85">
                  <rect x="30" y="110" width="24" height="70"/><rect x="54" y="130" width="18" height="50"/>
                  <rect x="72" y="100" width="30" height="80"/><rect x="102" y="120" width="20" height="60"/>
                  <rect x="122" y="90" width="36" height="90"/><rect x="158" y="115" width="22" height="65"/>
                  <rect x="180" y="105" width="28" height="75"/><rect x="208" y="125" width="24" height="55"/>
                  <rect x="232" y="95" width="32" height="85"/><rect x="264" y="120" width="20" height="60"/>
                  <rect x="284" y="105" width="30" height="75"/>
                </g>
                {/* drone crosshair */}
                <g stroke="#faf6ec" strokeWidth="0.4" opacity="0.25" fill="none">
                  <line x1="0" y1="90" x2="320" y2="90"/>
                  <line x1="160" y1="0" x2="160" y2="180"/>
                  <circle cx="160" cy="90" r="30"/>
                </g>
              </svg>
              {selected.kind === 'broadcasting' ? (
                <>
                  <span style={{ padding: '4px 9px', background: 'var(--sunset)', color: '#faf6ec', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', borderRadius: 2, position: 'absolute', top: 10, left: 10, fontWeight: 700 }}>● LIVE</span>
                  <span style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 7px', background: 'rgba(13,20,16,0.85)', color: '#f5ede0', fontSize: 10, fontFamily: 'var(--font-mono)', borderRadius: 2, backdropFilter: 'blur(4px)' }}>{(selected.viewers || 0).toLocaleString()} watching</span>
                  {selected.yt_video_id ? (
                    <iframe src={`https://www.youtube.com/embed/${selected.yt_video_id}?autoplay=1`} title="YouTube live" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media" allowFullScreen></iframe>
                  ) : (
                    <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(217,112,69,0.95)', border: '2px solid #faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }} data-placeholder="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#faf6ec"><polygon points="8,5 20,12 8,19"/></svg>
                  </button>
                  )}
                </>
              ) : (
                <>
                  <span style={{ padding: '4px 9px', background: 'var(--amber)', color: '#1a2820', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', borderRadius: 2, position: 'absolute', top: 10, left: 10, fontWeight: 700 }}>↑ UPLOADING</span>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(0deg, rgba(13,20,16,0.95), transparent)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', marginBottom: 6 }}>{selected.progress}% · {(selected.progress * 0.65).toFixed(1)} GB / {(100 * 0.65).toFixed(1)} GB</div>
                    <div style={{ height: 4, background: 'rgba(245,237,224,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: selected.progress + '%', height: '100%', background: 'var(--amber)' }}/>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{selected.place}</div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 14 }}>{selected.pilot} · {selected.handle}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              <button className="btn" style={{ fontSize: 12, flex: 1 }} data-placeholder="true">Tune in</button>
              {(selected.id && selected.id.length === 36 && selected.monetization_enabled) && <button className="btn secondary" style={{ fontSize: 12 }} onClick={() => setTipOpen(true)}>Tip $</button>}
            </div>

            {selected.id && selected.id.length === 36 ? (
              <LiveChatPanel streamId={selected.id}/>
            ) : (
              <div style={{ padding: 14, background: 'var(--forest-900)', border: '1px dashed var(--line)', borderRadius: 4, color: 'var(--parchment-dim)', fontSize: 12 }}>
                Realtime chat opens once a real live stream is selected.
              </div>
            )}

            <div className="eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>LIVE FLIGHT DATA</div>
            {[['Altitude', '84 m'], ['Distance', '1.2 km'], ['Battery', '56%'], ['Wind', '12 km/h NW']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderTop: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--parchment-dim)' }}>{k}</span>
                <span className="mono">{v}</span>
              </div>
            ))}
          </>
        )}
      </aside>
      {tipOpen && <SuperChatModal streamId={selected.id && selected.id.length === 36 ? selected.id : '00000000-0000-0000-0000-000000000000'} onClose={() => setTipOpen(false)}/>}
      {goLiveOpen && <GoLiveModal onClose={() => setGoLiveOpen(false)} onCreated={(stream) => { setGoLiveOpen(false); setSelected(stream); }} user={auth.user} profile={auth.profile} onNav={onNav}/>}
    </div>
  );
}

function GoLiveModal({ onClose, onCreated, user, profile, onNav }) {
  const [title, setTitle] = lvUseState('');
  const [description, setDescription] = lvUseState('');
  const [ytUrl, setYtUrl] = lvUseState('');
  const [thumbUrl, setThumbUrl] = lvUseState('');
  const [monetize, setMonetize] = lvUseState(false);
  const [payoutReady, setPayoutReady] = lvUseState(null);  // null = unknown, true/false after fetch
  const [busy, setBusy] = lvUseState(false);
  const [err, setErr] = lvUseState('');

  // Check if pilot has completed payout setup
  lvUseEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('profiles')
        .select('paypal_email, payee_name, payout_country, payout_terms_at')
        .eq('id', user.id).maybeSingle();
      const ready = !!(data && data.paypal_email && data.payee_name && data.payout_country && data.payout_terms_at);
      setPayoutReady(ready);
    })();
  }, [user?.id]);

  const start = async () => {
    if (!title.trim()) { setErr('Title is required'); return; }
    if (monetize && !payoutReady) {
      setErr('Set up your payout profile in Settings first to enable Super Chat.');
      return;
    }
    setErr(''); setBusy(true);
    let yt_video_id = null;
    if (ytUrl) {
      const m = ytUrl.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|embed\/([\w-]{11})/);
      yt_video_id = m && (m[1] || m[2] || m[3]);
    }
    try {
      const { data, error } = await supabase.from('live_streams').insert({
        pilot_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        thumb_url: thumbUrl.trim() || (yt_video_id ? `https://i.ytimg.com/vi/${yt_video_id}/hqdefault.jpg` : null),
        status: 'live',
        started_at: new Date().toISOString(),
        yt_video_id,
        embed_provider: yt_video_id ? 'youtube' : 'site',
        monetization_enabled: !!monetize,
      }).select().single();
      if (error) throw error;
      onCreated(data);
    } catch (e) {
      console.warn('Go Live err:', e);
      setErr(e.message || 'Failed to start stream');
    }
    setBusy(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink)', padding: 26, borderRadius: 8, maxWidth: 460, width: '92%', border: '1px solid var(--line-strong)' }}>
        <div style={{ fontSize: 11, color: 'var(--sunset)', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', marginBottom: 6 }}>● GO LIVE</div>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Start a live broadcast</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 4 }}>Stream title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunset over Hangang"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit' }}/>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 4 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit', fontSize: 13 }}/>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 4 }}>YouTube Live URL (optional — mirror your YT stream here)</label>
          <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
            style={{ width: '100%', padding: '10px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit' }}/>
          <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 4 }}>If set, the YT player embeds. Chat & Super Chat run on droneicarus regardless.</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 4 }}>Custom thumbnail URL (optional)</label>
          <input value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} placeholder="https://..."
            style={{ width: '100%', padding: '10px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit' }}/>
        </div>

        {/* Monetization */}
        <div style={{ marginBottom: 14, padding: 14, background: monetize ? 'rgba(198,136,32,0.06)' : 'var(--forest-900)', border: '1px solid ' + (monetize ? 'var(--amber)' : 'var(--line)'), borderRadius: 4 }}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={monetize} onChange={e => setMonetize(e.target.checked)} style={{ marginTop: 3 }} disabled={payoutReady === false}/>
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>Enable Super Chat tipping (monetization)</span>
              <span style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Viewers can send tips $1–$100. You keep 70%, platform 30%.</span>
              {payoutReady === false && (
                <span style={{ display: 'block', marginTop: 8, padding: '8px 10px', background: 'rgba(217,112,69,0.1)', border: '1px solid var(--sunset)', borderRadius: 3, fontSize: 11 }}>
                  ⚠ Payout profile not set up.
                  <button type="button" onClick={() => { onClose(); onNav?.('settings'); }} style={{ marginLeft: 6, background: 'transparent', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Set it up →
                  </button>
                </span>
              )}
              {payoutReady === null && <span style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'var(--parchment-dim)' }}>Checking your payout setup…</span>}
              {payoutReady === true && <span style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'var(--moss)' }}>✓ Payout profile ready</span>}
            </span>
          </label>
        </div>
        {err && <div style={{ color: 'var(--sunset)', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          <button onClick={start} disabled={busy} style={{ padding: '8px 18px', background: 'var(--sunset)', color: '#fff', border: 'none', borderRadius: 4, cursor: busy ? 'wait' : 'pointer', fontWeight: 700 }}>
            {busy ? 'Starting…' : '● Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

