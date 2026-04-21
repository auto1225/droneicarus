// pages/upload.jsx — YouTube-style multi-step upload flow
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, CAT_ICONS, LOCATIONS, thumbGradient } from '../data';
import { Ic } from '../components';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';
import { uploadVideo } from '../db/storage';
import { toast } from '../toast';
const uUseState = useState;
const uUseEffect = useEffect;
const uUseMemo = useMemo;
const uUseRef = useRef;

export function UploadPage({ onNav }) {
  const { user, profile } = useAuth();
  const [file, setFile] = uUseState(null);
  const [stage, setStage] = uUseState('drop'); // drop | processing | form
  const [tab, setTab] = uUseState('details');
  const [title, setTitle] = uUseState('');
  const [desc, setDesc] = uUseState('');
  const [locationId, setLocationId] = uUseState('santorini');
  const [category, setCategory] = uUseState('landscape');
  const [price, setPrice] = uUseState(19.99);
  const [licenseTier, setLicenseTier] = uUseState('single');
  const [visibility, setVisibility] = uUseState('public');
  const [tags, setTags] = uUseState(['cinematic', '4k', '24fps']);
  const [tagInput, setTagInput] = uUseState('');
  const [progress, setProgress] = uUseState(0);
  const [shotOn, setShotOn] = uUseState('DJI Mavic 3 Pro Cine');
  const [resolution, setResolution] = uUseState('4K');
  const [framerate, setFramerate] = uUseState('24');
  const [altitude, setAltitude] = uUseState('215');
  const [coords, setCoords] = uUseState('36.3932°N, 25.4615°E');
  const [allowRemix, setAllowRemix] = uUseState(true);
  const [commercial, setCommercial] = uUseState(true);
  const [publishing, setPublishing] = uUseState(false);

  const publish = async () => {
    if (!user) { toast?.('Sign in first', 'Create an account to upload', 'error'); onNav('signin'); return; }
    setPublishing(true);
    try {
      // 1. Insert row first (so we get an id)
      const visMap = { public: 'published', unlisted: 'published', private: 'draft' };
      const tiers = ['personal'];
      if (commercial) tiers.push('commercial');
      if (licenseTier === 'exclusive') tiers.push('exclusive');
      const { data: row, error: insErr } = await supabase.from('videos').insert({
        title, description: desc,
        owner_id: user.id,
        location_id: locationId,
        category,
        resolution,
        fps: parseInt(framerate, 10) || 24,
        drone_model: shotOn,
        altitude_m: parseInt(altitude, 10) || null,
        price_usd: price,
        license_tiers: tiers,
        status: visMap[visibility] || 'draft',
        tags,
        published_at: visibility === 'public' ? new Date().toISOString() : null,
      }).select('id').single();
      if (insErr) throw insErr;

      // 2. Upload the actual file (if a real File was picked).
      if (file instanceof File) {
        const { path } = await uploadVideo({ file, ownerId: user.id, videoId: row.id });
        await supabase.from('videos').update({ storage_path: path, file_size_bytes: file.size }).eq('id', row.id);
      }

      toast?.('Published', 'Your clip is now live on Drone Icarus');
      onNav('watch', row.id);
    } catch (e) {
      toast?.('Upload failed', e.message || 'Try again', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // fake upload progress
  uUseEffect(() => {
    if (stage !== 'processing') return;
    const id = setInterval(() => {
      setProgress(p => {
        const next = p + (Math.random() * 6 + 2);
        if (next >= 100) {
          clearInterval(id);
          setTimeout(() => setStage('form'), 400);
          return 100;
        }
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, [stage]);

  const onPick = (f) => {
    setFile(f || { name: 'DJI_0318_MasterCut.mp4', size: 4.2, duration: '6:48', resolution: '4K', codec: 'H.264' });
    setTitle('Santorini — Caldera at First Light');
    setStage('processing');
    setProgress(0);
  };

  if (stage === 'drop') return <UploadDropZone onPick={onPick} onCancel={() => onNav('home')} />;

  const loc = LOCATIONS.find(l => l.id === locationId);
  const canPublish = title.trim().length > 3 && progress >= 100;

  return (
    <div style={{ background: 'var(--ink)', minHeight: 'calc(100vh - 62px)' }}>
      {/* Modal-style shell — like YT */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 8 }}>NEW UPLOAD · DRAFT {new Date().toISOString().slice(0,10).replace(/-/g,'.')}</div>
            <h1 style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 6, maxWidth: 720 }}>{title || 'Untitled footage'}</h1>
            <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>{file?.name} · {file?.size || 4.2} GB · {file?.duration || '6:48'} · {resolution}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" onClick={() => onNav('home')} style={{ padding: '10px 16px', fontSize: 13 }}>Save draft</button>
            <button className="btn" disabled={!canPublish || publishing}
              onClick={publish}
              style={{ padding: '10px 18px', fontSize: 13, opacity: (canPublish && !publishing) ? 1 : 0.45 }}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
          {['details', 'video', 'pricing', 'visibility', 'checks'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 18px', fontSize: 13, textTransform: 'capitalize',
              color: tab === t ? 'var(--bone)' : 'var(--parchment-dim)',
              borderBottom: tab === t ? '2px solid var(--sunset)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40 }}>
          <div>
            {tab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="Title" hint={`${title.length}/100`}>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                    placeholder="Add a title that describes your footage"
                    style={fieldStyle} />
                </Field>
                <Field label="Description" hint={`${desc.length}/5000`}>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5}
                    placeholder="Tell buyers where, when, and how it was shot. Lens, lighting, edit approach."
                    style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }} />
                </Field>

                <Field label="Thumbnail">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {['0:12', '2:34', '5:08'].map((ts, i) => (
                      <div key={i} style={{
                        aspectRatio: '16/9', borderRadius: 4,
                        background: thumbGradient(i + 3),
                        border: i === 0 ? '2px solid var(--sunset)' : '1px solid var(--line-strong)',
                        position: 'relative', cursor: 'pointer',
                      }}>
                        <span className="mono" style={{
                          position: 'absolute', top: 6, left: 8, fontSize: 10, color: '#f5ede0',
                          background: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: 2,
                        }}>{ts}</span>
                        {i === 0 && <span className="mono" style={{
                          position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: 'var(--bone)',
                          background: 'var(--amber)', padding: '2px 6px', borderRadius: 2, fontWeight: 700,
                        }}>SELECTED</span>}
                      </div>
                    ))}
                  </div>
                </Field>

                <Field label="Location">
                  <select value={locationId} onChange={e => setLocationId(e.target.value)} style={fieldStyle}>
                    {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name} · {l.country}</option>)}
                  </select>
                </Field>

                <Field label="Category">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => {
                      const Icon = CAT_ICONS[c.id];
                      const on = category === c.id;
                      return (
                        <button key={c.id} onClick={() => setCategory(c.id)} className={'chip' + (on ? ' active' : '')}>
                          <span className="chip-icon">{Icon && Icon(13)}</span>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Tags" hint={`${tags.length}/15`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6, border: '1px solid var(--line-strong)', borderRadius: 4, background: 'var(--forest-900)' }}>
                    {tags.map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'var(--forest-800)', borderRadius: 2, fontSize: 12 }}>
                        #{t}
                        <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ color: 'var(--parchment-dim)' }}>×</button>
                      </span>
                    ))}
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          setTags([...new Set([...tags, tagInput.trim()])].slice(0, 15));
                          setTagInput('');
                        }
                      }}
                      placeholder="Add tag + Enter"
                      style={{ flex: 1, minWidth: 120, background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', fontSize: 12, padding: '3px 6px' }} />
                  </div>
                </Field>
              </div>
            )}

            {tab === 'video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Shot on"><input value={shotOn} onChange={e => setShotOn(e.target.value)} style={fieldStyle}/></Field>
                  <Field label="Resolution">
                    <select value={resolution} onChange={e => setResolution(e.target.value)} style={fieldStyle}>
                      {['4K','5.7K','6K','8K','1080p'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Framerate">
                    <select value={framerate} onChange={e => setFramerate(e.target.value)} style={fieldStyle}>
                      {['24','25','30','48','50','60','120'].map(r => <option key={r}>{r} fps</option>)}
                    </select>
                  </Field>
                  <Field label="Codec / Container">
                    <select style={fieldStyle} defaultValue="H.264">
                      {['H.264','H.265 (HEVC)','ProRes 422 HQ','ProRes 4444','DNxHR HQ'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>

                <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, padding: 18 }}>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>EXIF · FLIGHT METADATA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Coordinates"><input value={coords} onChange={e => setCoords(e.target.value)} style={fieldStyle}/></Field>
                    <Field label="Altitude (AGL)">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <input value={altitude} onChange={e => setAltitude(e.target.value)} style={{ ...fieldStyle, borderRight: 'none', borderRadius: '4px 0 0 4px' }}/>
                        <span style={{ padding: '10px 12px', background: 'var(--forest-800)', border: '1px solid var(--line-strong)', borderRadius: '0 4px 4px 0', fontSize: 13 }}>m</span>
                      </div>
                    </Field>
                    <Field label="Flight date"><input defaultValue="2026-03-14" type="date" style={fieldStyle}/></Field>
                    <Field label="Local time"><input defaultValue="06:24" type="time" style={fieldStyle}/></Field>
                    <Field label="Weather / Wind"><input defaultValue="Clear, 4 m/s SSW" style={fieldStyle}/></Field>
                    <Field label="Airspace"><input defaultValue="Class G · Uncontrolled" style={fieldStyle}/></Field>
                  </div>
                </div>

                <Field label="Subtitles & captions">
                  <div style={{ border: '1px dashed var(--line-strong)', padding: '22px 16px', textAlign: 'center', borderRadius: 4, color: 'var(--parchment-dim)', fontSize: 13 }}>
                    Drop .srt / .vtt or <span style={{ color: 'var(--sunset)', cursor: 'pointer' }}>auto-generate</span>
                  </div>
                </Field>
              </div>
            )}

            {tab === 'pricing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="License model">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      ['single', 'Single price', 'One flat fee, personal + commercial use'],
                      ['tiered', 'Tiered (recommended)', 'Personal · Commercial · Extended'],
                      ['free', 'Free download', 'Credit-only, no payment'],
                    ].map(([k, label, note]) => {
                      const on = licenseTier === k;
                      return (
                        <button key={k} onClick={() => setLicenseTier(k)} style={{
                          textAlign: 'left', padding: 14,
                          border: on ? '2px solid var(--sunset)' : '1px solid var(--line-strong)',
                          background: on ? 'var(--forest-900)' : 'transparent',
                          borderRadius: 4,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{note}</div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {licenseTier === 'single' && (
                  <Field label="Price (USD)" hint="You keep 70%. Platform fee is a flat 30% — same rate for every pilot and every license tier.">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <span style={{ padding: '10px 14px', background: 'var(--forest-800)', border: '1px solid var(--line-strong)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: 15, fontFamily: 'var(--font-display)' }}>$</span>
                      <input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                        style={{ ...fieldStyle, borderRadius: '0 4px 4px 0', fontSize: 18, fontFamily: 'var(--font-display)' }}/>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 6 }}>
                      You earn <strong style={{ color: 'var(--bone)' }}>${(price * 0.85).toFixed(2)}</strong> per sale.
                    </div>
                  </Field>
                )}

                {licenseTier === 'tiered' && (
                  <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4 }}>
                    {[
                      ['Personal', 'Non-commercial edits & reels', price, 0.85],
                      ['Commercial', 'Ads, client deliverables, online spots', Math.round(price * 1.8 * 100) / 100, 0.85],
                      ['Extended', 'Broadcast, exclusive-window, resale', Math.round(price * 3.5 * 100) / 100, 0.80],
                    ].map(([name, note, p, rev], i) => (
                      <div key={name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 140px 100px', alignItems: 'center', gap: 16, padding: '14px 18px', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{note}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Non-exclusive · Worldwide · Perpetual</div>
                        <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}>${p}</div>
                        <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>You earn <strong style={{ color: 'var(--bone)' }}>${(p * rev).toFixed(2)}</strong></div>
                      </div>
                    ))}
                  </div>
                )}

                <Field label="Terms">
                  <Toggle label="Allow remix & educational use" on={allowRemix} onChange={setAllowRemix}/>
                  <Toggle label="Permit use in for-profit client projects" on={commercial} onChange={setCommercial}/>
                  <Toggle label="Exclusive — only buyer can use this footage" on={false} onChange={() => {}}/>
                </Field>
              </div>
            )}

            {tab === 'visibility' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <Field label="Who can see this">
                  {[
                    ['public', 'Public', 'Anyone can find and purchase'],
                    ['unlisted', 'Unlisted', 'Only people with the link'],
                    ['private', 'Private', 'Only you · good for client reviews'],
                    ['schedule', 'Schedule release', 'Goes live at a future date'],
                  ].map(([k, label, note]) => (
                    <label key={k} style={{ display: 'flex', gap: 12, padding: 14, border: visibility === k ? '1px solid var(--sunset)' : '1px solid var(--line)', borderRadius: 4, marginBottom: 8, cursor: 'pointer' }}>
                      <input type="radio" checked={visibility === k} onChange={() => setVisibility(k)} style={{ marginTop: 2 }}/>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{note}</div>
                      </div>
                    </label>
                  ))}
                </Field>
                <Field label="Embed & sharing">
                  <Toggle label="Allow embed on external sites" on={true} onChange={() => {}}/>
                  <Toggle label="Feature on my public profile" on={true} onChange={() => {}}/>
                  <Toggle label="Include in Drone Icarus weekly picks" on={false} onChange={() => {}}/>
                </Field>
              </div>
            )}

            {tab === 'checks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['4K master uploaded', true, 'H.264 · 4.2 GB · 06:48'],
                  ['Copyright scan', true, 'No matches · cleared'],
                  ['Stabilization check', true, '97/100 — minor vibration at 3:12'],
                  ['Audio track', false, 'No audio track (will be marked silent)'],
                  ['Airspace compliance', true, 'Santorini, GR · Class G · legal altitude'],
                  ['Pilot certification', true, 'Verified · EASA A2 open category'],
                  ['Metadata complete', progress === 100 && title.length > 3, 'Title, location, category, tags'],
                ].map(([label, ok, note]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: ok ? 'var(--moss)' : 'var(--amber)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#faf6ec',
                    }}>
                      {ok ? <Ic.check/> : <span style={{ fontWeight: 700 }}>!</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: sticky preview */}
          <aside>
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ border: '1px solid var(--line-strong)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/9', background: thumbGradient(3), position: 'relative' }}>
                  {/* Upload progress overlay */}
                  {stage === 'processing' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,20,16,0.75)', color: '#f5ede0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', marginBottom: 8 }}>UPLOADING · {Math.floor(progress)}%</div>
                      <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--sunset)', borderRadius: 999, transition: 'width 0.2s' }}/>
                      </div>
                      <div style={{ fontSize: 11, marginTop: 10, opacity: 0.7 }}>2.4 MB/s · ETA {Math.max(0, Math.round((100 - progress) / 6))}s</div>
                    </div>
                  )}
                  {stage !== 'processing' && (
                    <>
                      <div style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: 'rgba(13,20,16,0.85)', padding: '3px 7px',
                        fontSize: 11, fontFamily: 'var(--font-mono)', color: '#f5ede0', borderRadius: 2,
                      }}>{file?.duration || '6:48'}</div>
                      <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f5ede0', background: 'rgba(13,20,16,0.75)', padding: '3px 6px', borderRadius: 2, letterSpacing: '0.1em' }}>
                        {resolution}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', marginBottom: 8, wordBreak: 'break-all' }}>
                    https://icarus.fly/watch/{file?.name?.split('.')[0] || 'draft'}
                  </div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>FILENAME</div>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>{file?.name || 'DJI_0318.mp4'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <MetaRow k="Size" v={`${file?.size || 4.2} GB`}/>
                    <MetaRow k="Duration" v={file?.duration || '6:48'}/>
                    <MetaRow k="Codec" v={file?.codec || 'H.264'}/>
                    <MetaRow k="Res" v={resolution}/>
                    <MetaRow k="FPS" v={`${framerate} fps`}/>
                    <MetaRow k="Bit rate" v="120 Mbps"/>
                  </div>
                </div>
              </div>
              {/* EXIF map */}
              <div style={{ marginTop: 14, border: '1px solid var(--line)', borderRadius: 4, padding: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>EXIF PREVIEW</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{loc?.name}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)' }}>{coords} · {altitude} m AGL</div>
                <MiniExifMap lat={loc?.lat} lon={loc?.lon}/>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function UploadDropZone({ onPick, onCancel }) {
  const [dragOver, setDragOver] = uUseState(false);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 62px)', padding: 40, textAlign: 'center',
    }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--parchment-dim)', marginBottom: 10 }}>NEW UPLOAD</div>
      <h1 style={{ fontSize: 42, marginBottom: 10 }}>Bring your footage home.</h1>
      <p style={{ fontSize: 15, color: 'var(--parchment-dim)', maxWidth: 560, marginBottom: 40 }}>
        Drop a single clip or a ProRes master. We'll pull EXIF, generate a thumbnail set, and run a copyright scan while you fill in the details.
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
        onClick={() => onPick()}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, color: 'var(--sunset)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v14M6 9l6-6 6 6M4 21h16"/></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Drop a file or click to browse</div>
        <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>MP4 · MOV · ProRes · DNxHR · up to 50 GB · 8K max</div>
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

function MiniExifMap({ lat, lon }) {
  // Simple static fake-map SVG with crosshair
  return (
    <div style={{
      marginTop: 10, aspectRatio: '4/3', borderRadius: 3,
      background: 'linear-gradient(135deg, #e8dec4 0%, #d5c9b0 100%)',
      position: 'relative', overflow: 'hidden',
      border: '1px solid var(--line)',
    }}>
      <svg viewBox="0 0 300 225" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g stroke="rgba(26,40,32,0.15)" fill="none" strokeWidth="0.5">
          {[...Array(8)].map((_, i) => <path key={i} d={`M0 ${28 * i + 10} Q75 ${28*i} 150 ${28*i+12} T300 ${28*i-4}`}/>)}
        </g>
        <circle cx="150" cy="112" r="6" fill="var(--sunset)"/>
        <circle cx="150" cy="112" r="14" fill="none" stroke="var(--sunset)" opacity="0.4"/>
        <line x1="150" y1="0" x2="150" y2="225" stroke="var(--sunset)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5"/>
        <line x1="0" y1="112" x2="300" y2="112" stroke="var(--sunset)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5"/>
      </svg>
    </div>
  );
}

