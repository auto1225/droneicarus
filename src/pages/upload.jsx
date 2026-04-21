// pages/upload.jsx — Upload flow with real metadata, real progress, thumb scrubber.
//
// Flow: drop → form (with real upload happening in the background). Details
// tab opens while the file uploads, and the Publish button stays disabled
// until the actual upload finishes. A thumbnail scrubber lets pilots pick
// exactly which frame to use.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, CAT_ICONS, LOCATIONS, thumbGradient } from '../data';
import { Ic } from '../components';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';
import { uploadVideo, uploadThumb } from '../db/storage';
import { toast } from '../toast';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB
const ACCEPTED_EXT = ['mp4', 'mov', 'mkv', 'webm', 'm4v'];

function humanSize(b) {
  if (!b && b !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = b, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return (i === 0 ? n.toFixed(0) : n.toFixed(n < 10 ? 2 : 1)) + ' ' + units[i];
}
function humanDuration(s) {
  if (!s || !isFinite(s)) return '—';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

// Extract real metadata (duration, resolution, fps hint) from the File.
async function probeMetadata(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const done = (meta) => { URL.revokeObjectURL(url); resolve(meta); };
    v.onloadedmetadata = () => done({
      duration: v.duration,
      width: v.videoWidth,
      height: v.videoHeight,
      resolution: v.videoHeight >= 2000 ? '4K' : v.videoHeight >= 1400 ? '2K' : v.videoHeight >= 1000 ? '1080p' : v.videoHeight >= 700 ? '720p' : 'SD',
    });
    v.onerror = () => done({});
    setTimeout(() => done({}), 10000);
  });
}

// Grab a frame at the specified seconds as a JPEG Blob.
async function grabFrameBlob(file, seconds) {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    await new Promise((ok, bad) => {
      v.onloadeddata = ok;
      v.onerror = () => bad(new Error('decode failed'));
      setTimeout(() => bad(new Error('decode timeout')), 10000);
    });
    await new Promise((ok) => { v.onseeked = ok; v.currentTime = Math.max(0.1, Math.min(seconds, (v.duration || 1) - 0.1)); });
    const c = document.createElement('canvas');
    c.width = Math.min(v.videoWidth || 1280, 1280);
    c.height = Math.round(c.width * ((v.videoHeight || 720) / (v.videoWidth || 1280)));
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function UploadPage({ onNav }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);          // { duration, width, height, resolution }
  const [stage, setStage] = useState('drop');      // drop | form
  const [tab, setTab] = useState('details');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [locationId, setLocationId] = useState('santorini');
  const [locationQuery, setLocationQuery] = useState('');
  const [category, setCategory] = useState('landscape');
  const [price, setPrice] = useState(19.99);
  const [licenseTier, setLicenseTier] = useState('single');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState(['cinematic', '4k']);
  const [tagInput, setTagInput] = useState('');
  const [shotOn, setShotOn] = useState('DJI Mavic 3 Pro Cine');
  const [framerate, setFramerate] = useState('24');
  const [altitude, setAltitude] = useState('215');
  const [allowRemix, setAllowRemix] = useState(true);
  const [commercial, setCommercial] = useState(true);

  // Upload state
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadBytes, setUploadBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes/sec
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const [videoId, setVideoId] = useState(null);     // created row id
  const [storagePath, setStoragePath] = useState(null);
  const uploadTaskRef = useRef(null);

  // Thumbnail scrubber
  const [thumbTime, setThumbTime] = useState(1.0);
  const [thumbBlob, setThumbBlob] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [thumbPath, setThumbPath] = useState(null);

  const [publishing, setPublishing] = useState(false);

  const locationMatches = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return LOCATIONS.slice(0, 6);
    return LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [locationQuery]);

  // ── picking a file ────────────────────────────────────────────────
  const onPick = async (f) => {
    if (!(f instanceof File)) {
      toast?.('No file selected', 'Drop a video file or click browse.', 'error');
      return;
    }
    // validate
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      toast?.('Unsupported format', `Got .${ext}. Use ${ACCEPTED_EXT.join(', ').toUpperCase()}.`, 'error');
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      toast?.('File too large', `${humanSize(f.size)} exceeds 50 GB limit.`, 'error');
      return;
    }
    setFile(f);
    const base = (f.name || '').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
    if (!title) setTitle(base.trim().slice(0, 100) || 'Untitled clip');
    setStage('form');
    setUploadPct(0); setUploadBytes(0); setUploadSpeed(0); setUploadDone(false); setUploadErr(null);

    // probe metadata
    probeMetadata(f).then(m => {
      setMeta(m);
      if (m.resolution) {
        // auto-set resolution display
      }
      // initial thumbnail at 1s or 10% in
      const t = Math.min(1.0, (m.duration || 1) * 0.1);
      setThumbTime(t);
      regenThumb(f, t);
    });

    // start the real upload in parallel (drafts a row first for an id)
    void startUpload(f);
  };

  // ── thumb scrubber ────────────────────────────────────────────────
  const regenThumb = async (f, seconds) => {
    setThumbBusy(true);
    try {
      const blob = await grabFrameBlob(f, seconds);
      if (blob) {
        setThumbBlob(blob);
        if (thumbUrl) URL.revokeObjectURL(thumbUrl);
        setThumbUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.warn('[thumb]', e.message);
    } finally {
      setThumbBusy(false);
    }
  };

  useEffect(() => () => { if (thumbUrl) URL.revokeObjectURL(thumbUrl); }, [thumbUrl]);

  // ── start upload (draft row + file) ───────────────────────────────
  const startUpload = async (f) => {
    if (!user) { toast?.('Sign in first', 'Create an account to upload', 'error'); onNav('signin'); return; }
    try {
      // 1. create a draft row to get an id (we can update later on publish)
      const { data: row, error: insErr } = await supabase.from('videos').insert({
        title: (f.name || 'Untitled clip').replace(/\.[^.]+$/, '').slice(0, 100),
        owner_id: user.id,
        category: 'landscape',
        resolution: '1080p',
        price_usd: 0,
        status: 'draft',
      }).select('id').single();
      if (insErr) throw insErr;
      setVideoId(row.id);

      // 2. stream the file to Storage with real progress
      let lastTs = Date.now(), lastBytes = 0;
      const task = uploadVideo({
        file: f, ownerId: user.id, videoId: row.id,
        onProgress: ({ loaded, total, pct }) => {
          setUploadPct(pct);
          setUploadBytes(loaded);
          const now = Date.now();
          const dt = (now - lastTs) / 1000;
          if (dt >= 0.4) {
            setUploadSpeed((loaded - lastBytes) / dt);
            lastTs = now; lastBytes = loaded;
          }
        }
      });
      uploadTaskRef.current = task;
      const result = await task;
      setStoragePath(result.path);
      setUploadDone(true);
      setUploadPct(100);
      await supabase.from('videos').update({
        storage_path: result.path,
        file_size_bytes: f.size,
      }).eq('id', row.id);
    } catch (e) {
      console.warn('[upload]', e.message);
      setUploadErr(e.message);
    }
  };

  const cancelUpload = () => {
    uploadTaskRef.current?.cancel?.();
    setUploadErr('Cancelled');
  };

  // ── publish ───────────────────────────────────────────────────────
  const publish = async ({ draft = false } = {}) => {
    if (!videoId) { toast?.('No draft row', 'Re-select your file.', 'error'); return; }
    if (!draft && !uploadDone) { toast?.('Upload not done', 'Wait for the file to finish uploading.', 'error'); return; }
    setPublishing(true);
    try {
      // If the user chose a custom thumb frame, upload it now.
      let useThumbPath = thumbPath;
      if (thumbBlob && !useThumbPath) {
        const thumbFile = new File([thumbBlob], `${videoId}.jpg`, { type: 'image/jpeg' });
        try {
          const { path } = await uploadThumb({ file: thumbFile, ownerId: user.id, videoId });
          useThumbPath = path;
          setThumbPath(path);
        } catch (e) { console.warn('[thumb upload]', e.message); }
      }
      const tiers = ['personal'];
      if (commercial) tiers.push('commercial');
      if (licenseTier === 'exclusive') tiers.push('exclusive');
      const visMap = { public: 'published', unlisted: 'published', private: 'draft' };
      const status = draft ? 'draft' : (visMap[visibility] || 'draft');
      const update = {
        title, description: desc, location_id: locationId, category,
        resolution: meta?.resolution || '1080p',
        fps: parseInt(framerate, 10) || 24,
        drone_model: shotOn,
        altitude_m: parseInt(altitude, 10) || null,
        price_usd: price,
        license_tiers: tiers,
        status,
        tags,
        published_at: (status === 'published') ? new Date().toISOString() : null,
      };
      if (useThumbPath) update.thumb_path = useThumbPath;
      const { error } = await supabase.from('videos').update(update).eq('id', videoId);
      if (error) throw error;
      toast?.(draft ? 'Draft saved' : 'Published', draft ? 'Continue editing anytime from My page' : 'Your clip is live on Drone Icarus');
      onNav(draft ? 'mypage' : 'watch', videoId);
    } catch (e) {
      toast?.('Save failed', e.message || 'Try again', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (stage === 'drop') return <UploadDropZone onPick={onPick} onCancel={() => onNav('home')} />;

  const loc = LOCATIONS.find(l => l.id === locationId);
  const canPublish = title.trim().length > 3 && uploadDone && !uploadErr;
  const etaSec = uploadSpeed > 0 ? Math.round((file.size - uploadBytes) / uploadSpeed) : null;

  return (
    <div style={{ background: 'var(--ink)', minHeight: 'calc(100vh - 62px)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 8 }}>NEW UPLOAD · {new Date().toISOString().slice(0,10).replace(/-/g,'.')}</div>
            <h1 style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 6, maxWidth: 720 }}>{title || 'Untitled footage'}</h1>
            <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>
              {file?.name} · {humanSize(file?.size)} · {humanDuration(meta?.duration)} · {meta?.resolution || '—'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" onClick={() => publish({ draft: true })} disabled={publishing} style={{ padding: '10px 16px', fontSize: 13 }}>Save draft</button>
            <button className="btn" disabled={!canPublish || publishing}
              onClick={() => publish({ draft: false })}
              style={{ padding: '10px 18px', fontSize: 13, opacity: (canPublish && !publishing) ? 1 : 0.45 }}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Upload status strip */}
        <div style={{
          padding: '12px 16px', marginBottom: 22, borderRadius: 4,
          border: '1px solid ' + (uploadErr ? 'var(--sunset)' : uploadDone ? 'var(--moss)' : 'var(--amber)'),
          background: 'var(--forest-950)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: uploadErr ? 'var(--sunset)' : uploadDone ? 'var(--moss)' : 'var(--amber)' }}>
            {uploadErr ? `FAILED · ${uploadErr}` : uploadDone ? '● UPLOADED' : `● UPLOADING ${uploadPct.toFixed(1)}%`}
          </span>
          {!uploadDone && !uploadErr && (
            <>
              <div style={{ flex: 1, height: 6, background: 'var(--forest-800)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${uploadPct}%`, height: '100%', background: 'var(--sunset)', transition: 'width 0.15s' }}/>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>
                {humanSize(uploadBytes)} / {humanSize(file?.size)} · {humanSize(uploadSpeed)}/s{etaSec != null ? ` · ETA ${etaSec}s` : ''}
              </span>
              <button onClick={cancelUpload} className="btn secondary" style={{ fontSize: 11, padding: '4px 10px' }}>Cancel</button>
            </>
          )}
          {uploadDone && <span style={{ flex: 1, fontSize: 12, color: 'var(--parchment-dim)' }}>Ready to publish. You can still edit details below.</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
          {['details', 'thumbnail', 'video', 'pricing', 'visibility'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 18px', fontSize: 13, textTransform: 'capitalize',
              color: tab === t ? 'var(--bone)' : 'var(--parchment-dim)',
              borderBottom: tab === t ? '2px solid var(--sunset)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
          <div>
            {tab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="Title" hint={`${title.length}/100`}>
                  <input value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="Add a title that describes your footage" style={fieldStyle} />
                </Field>
                <Field label="Description" hint={`${desc.length}/5000`}>
                  <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 5000))} rows={5}
                    placeholder="Tell buyers where, when, and how it was shot. Lens, lighting, edit approach."
                    style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }} />
                </Field>
                <Field label="Category">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CATEGORIES.map(c => {
                      const Icon = CAT_ICONS[c.id];
                      const on = category === c.id;
                      return (
                        <button key={c.id} onClick={() => setCategory(c.id)} style={{
                          padding: '12px 10px', fontSize: 12, borderRadius: 4,
                          background: on ? 'var(--forest-900)' : 'transparent',
                          border: on ? '1px solid var(--sunset)' : '1px solid var(--line)',
                          color: on ? 'var(--bone)' : 'var(--parchment-dim)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        }}>
                          {Icon && Icon(16)}
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Location">
                  <input value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="Search location…" style={fieldStyle}/>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 180, overflow: 'auto' }}>
                    {locationMatches.map(l => (
                      <button key={l.id} onClick={() => { setLocationId(l.id); setLocationQuery(''); }} style={{
                        padding: '8px 12px', textAlign: 'left', fontSize: 12, borderRadius: 3,
                        background: locationId === l.id ? 'var(--forest-900)' : 'transparent',
                        border: locationId === l.id ? '1px solid var(--sunset)' : '1px solid var(--line)',
                        color: 'var(--bone)',
                      }}>
                        <div style={{ fontSize: 13 }}>{l.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>{l.country}</div>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tags">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {tags.map((t, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 999, fontSize: 12 }}>
                        {t} <button onClick={() => setTags(tags.filter((_, j) => j !== i))} style={{ marginLeft: 4, color: 'var(--parchment-dim)' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    placeholder="Press Enter to add tag" style={fieldStyle}/>
                </Field>
              </div>
            )}

            {tab === 'thumbnail' && (
              <div>
                <Field label="Thumbnail frame" hint={`${thumbTime.toFixed(2)}s`}>
                  <div style={{
                    aspectRatio: '16/9', borderRadius: 4, background: 'var(--forest-900)',
                    border: '1px solid var(--line)', overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : (
                      <span style={{ color: 'var(--parchment-dim)' }}>{thumbBusy ? 'Generating…' : 'Choose a frame below'}</span>
                    )}
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    <input type="range" min="0" max={Math.max(0.1, (meta?.duration || 1) - 0.1)} step="0.1"
                      value={thumbTime}
                      onChange={e => setThumbTime(parseFloat(e.target.value))}
                      onMouseUp={() => file && regenThumb(file, thumbTime)}
                      onTouchEnd={() => file && regenThumb(file, thumbTime)}
                      style={{ width: '100%' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--parchment-dim)' }}>
                      <span>0:00</span>
                      <span>{humanDuration(meta?.duration)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[0.1, 0.25, 0.5, 0.75, 0.9].map(frac => (
                      <button key={frac} className="btn secondary" style={{ fontSize: 11, padding: '6px 10px' }}
                        onClick={() => { const t = (meta?.duration || 1) * frac; setThumbTime(t); if (file) regenThumb(file, t); }}>
                        {Math.round(frac * 100)}%
                      </button>
                    ))}
                    {file && (
                      <button className="btn" style={{ fontSize: 11, padding: '6px 12px' }}
                        onClick={() => file && regenThumb(file, thumbTime)}>
                        Regenerate
                      </button>
                    )}
                  </div>
                </Field>
              </div>
            )}

            {tab === 'video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="Shot with">
                  <input value={shotOn} onChange={e => setShotOn(e.target.value)} placeholder="DJI Mavic 3 Pro Cine" style={fieldStyle}/>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <Field label="Resolution"><input value={meta?.resolution || '1080p'} readOnly style={{ ...fieldStyle, opacity: 0.7 }}/></Field>
                  <Field label="Framerate"><input value={framerate} onChange={e => setFramerate(e.target.value)} style={fieldStyle}/></Field>
                  <Field label="Altitude (m)"><input value={altitude} onChange={e => setAltitude(e.target.value)} style={fieldStyle}/></Field>
                </div>
                <div style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 4 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>DETECTED METADATA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                    <MetaRow k="Duration" v={humanDuration(meta?.duration)} />
                    <MetaRow k="Pixel size" v={meta?.width ? `${meta.width}×${meta.height}` : '—'} />
                    <MetaRow k="File size" v={humanSize(file?.size)} />
                    <MetaRow k="MIME" v={file?.type || '—'} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'pricing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="License model">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      ['single', 'Single price', 'One flat fee, personal + commercial'],
                      ['tiered', 'Tiered', 'Personal / Commercial / Extended'],
                      ['exclusive', 'Exclusive', 'Higher fee, one buyer only'],
                    ].map(([k, label, sub]) => (
                      <button key={k} onClick={() => setLicenseTier(k)} style={{
                        padding: 14, textAlign: 'left', fontSize: 12, borderRadius: 4,
                        background: licenseTier === k ? 'var(--forest-900)' : 'transparent',
                        border: licenseTier === k ? '1px solid var(--sunset)' : '1px solid var(--line)',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Base price (USD)">
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} style={fieldStyle}/>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--parchment-dim)' }}>
                    You earn <strong style={{ color: 'var(--amber)' }}>${(price * 0.7).toFixed(2)}</strong> per sale · platform keeps 30%.
                  </div>
                </Field>
                <div style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>TIER PREVIEW</div>
                  {[
                    ['Personal', price, 0.7],
                    ['Commercial', Math.round(price * 1.8 * 100) / 100, 0.7],
                    ['Extended', Math.round(price * 3.5 * 100) / 100, 0.7],
                  ].map(([t, p, share]) => (
                    <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                      <span>{t}</span>
                      <span style={{ color: 'var(--parchment-dim)' }}>${p.toFixed(2)} → you get ${(p * share).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'visibility' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="Who can see this">
                  {[
                    ['public', 'Public', 'Show in explore, atlas and search results.'],
                    ['unlisted', 'Unlisted', 'Hidden from listings, but anyone with the link can view.'],
                    ['private', 'Private (draft)', 'Only you can see this clip.'],
                  ].map(([k, label, sub]) => (
                    <button key={k} onClick={() => setVisibility(k)} style={{
                      padding: 14, textAlign: 'left', fontSize: 12, borderRadius: 4, marginBottom: 8, display: 'block', width: '100%',
                      background: visibility === k ? 'var(--forest-900)' : 'transparent',
                      border: visibility === k ? '1px solid var(--sunset)' : '1px solid var(--line)',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{sub}</div>
                    </button>
                  ))}
                </Field>
                <Toggle label="Allow commercial licensing" on={commercial} onChange={setCommercial}/>
                <Toggle label="Allow remix / derivative works" on={allowRemix} onChange={setAllowRemix}/>
              </div>
            )}
          </div>

          <aside>
            <div style={{
              aspectRatio: '16/9', borderRadius: 4, background: 'var(--forest-900)',
              border: '1px solid var(--line)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              {thumbUrl ? <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <span style={{ color: 'var(--parchment-dim)', fontSize: 12 }}>No thumbnail yet</span>}
            </div>
            <div style={{ marginBottom: 14, padding: 14, border: '1px solid var(--line)', borderRadius: 4 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>CHECKLIST</div>
              {[
                ['File uploaded', uploadDone, uploadErr ? `✗ ${uploadErr}` : (uploadDone ? `✓ ${humanSize(file?.size)}` : `uploading… ${uploadPct.toFixed(0)}%`)],
                ['Title (4+ chars)', title.trim().length > 3, title.trim()],
                ['Thumbnail chosen', !!thumbBlob, thumbBlob ? `frame @ ${thumbTime.toFixed(2)}s` : 'pick one in Thumbnail tab'],
                ['Location selected', !!loc, loc?.name],
                ['Category selected', !!category, category],
              ].map(([k, ok, v], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: 12 }}>
                  <span style={{ color: ok ? 'var(--moss)' : 'var(--parchment-dim)' }}>{ok ? '✓' : '○'}</span>
                  <div style={{ flex: 1 }}>
                    <div>{k}</div>
                    <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 4 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>DETECTED</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{loc?.name || '—'}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)' }}>
                {loc ? `${loc.lat?.toFixed(4)}°, ${loc.lon?.toFixed(4)}°` : '—'} · {altitude} m AGL
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--parchment-dim)' }}>
                Duration {humanDuration(meta?.duration)} · {meta?.resolution || '—'}{meta?.width ? ` · ${meta.width}×${meta.height}` : ''}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function UploadDropZone({ onPick, onCancel }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 62px)', padding: 40, textAlign: 'center',
    }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--parchment-dim)', marginBottom: 10 }}>NEW UPLOAD</div>
      <h1 style={{ fontSize: 42, marginBottom: 10 }}>Bring your footage home.</h1>
      <p style={{ fontSize: 15, color: 'var(--parchment-dim)', maxWidth: 560, marginBottom: 40 }}>
        Drop a single clip. We'll probe metadata, stream it to our CDN with real progress, and help you pick the perfect thumbnail frame.
      </p>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); onPick(e.dataTransfer.files[0]); }}
        style={{
          width: 620, maxWidth: '100%', aspectRatio: '16/9',
          border: `2px dashed ${dragOver ? 'var(--sunset)' : 'var(--line-strong)'}`,
          background: dragOver ? 'var(--forest-900)' : 'transparent',
          borderRadius: 6,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }}
               onChange={e => { if (e.target.files?.[0]) onPick(e.target.files[0]); e.target.value=''; }} />
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, color: 'var(--sunset)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v14M6 9l6-6 6 6M4 21h16"/></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{dragOver ? 'Drop it!' : 'Drop a file or click to browse'}</div>
        <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>MP4 · MOV · MKV · WebM · up to 50 GB</div>
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 16, fontSize: 12, color: 'var(--parchment-dim)' }}>
        <span>By uploading, you agree to our <span style={{ color: 'var(--sunset)', textDecoration: 'underline' }}>Pilot Terms</span> &amp; <span style={{ color: 'var(--sunset)', textDecoration: 'underline' }}>content policy</span>.</span>
      </div>
      <button onClick={onCancel} style={{ marginTop: 18, fontSize: 12, color: 'var(--parchment-dim)' }}>← Cancel</button>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{label}</label>
        {hint && <span className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const fieldStyle = {
  width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit',
  background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
  color: 'var(--bone)', borderRadius: 4, outline: 'none',
};

function Toggle({ label, on, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', cursor: 'pointer' }}>
      <button type="button" onClick={() => onChange(!on)} style={{
        width: 36, height: 20, borderRadius: 999,
        background: on ? 'var(--sunset)' : 'var(--forest-700)',
        position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#faf6ec', transition: 'left 0.15s',
        }}/>
      </button>
      <span style={{ fontSize: 13, color: 'var(--bone)' }}>{label}</span>
    </label>
  );
}

function MetaRow({ k, v }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{k}</div>
      <div style={{ fontSize: 12 }}>{v}</div>
    </div>
  );
}
