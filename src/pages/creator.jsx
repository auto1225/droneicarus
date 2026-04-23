// pages/creator.jsx — Creator upload dashboard
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES, LOCATIONS, VIDEOS, thumbGradient } from '../data';
import { Ic, formatViews } from '../components';

export function CreatorDashboard({ onNav }) {
  const [step, setStep] = React.useState('dashboard'); // dashboard | upload
  const myVids = VIDEOS.slice(0, 8);

  if (step === 'upload') return <UploadFlow onDone={() => setStep('dashboard')} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 62px)' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid var(--line)', background: 'var(--forest-950)', padding: '30px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: 30 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>PILOT CONSOLE</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--line-strong)' }}>H</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Hyunwoo Park <span style={{ color: 'var(--amber)' }}><Ic.check/></span></div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>@hyunwoo · Verified</div>
            </div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['Dashboard', true],
            ['My footage', false],
            ['Earnings', false],
            ['Analytics', false],
            ['Licensing', false],
            ['Payouts', false],
            ['Settings', false],
          ].map(([label, active]) => (
            <button key={label} style={{
              padding: '11px 24px', textAlign: 'left',
              color: active ? 'var(--bone)' : 'var(--parchment-dim)',
              background: active ? 'var(--forest-800)' : 'transparent',
              borderLeft: active ? '3px solid var(--amber)' : '3px solid transparent',
              fontSize: 14,
            }} data-placeholder="true">{label}</button>
          ))}
        </nav>
      </aside>

      <main style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>GOOD MORNING</div>
            <h1 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Here's how your flight log is doing.</h1>
          </div>
          <button className="btn primary" onClick={() => setStep('upload')} style={{ fontSize: 14 }}>
            <Ic.upload/> Upload new clip
          </button>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 30 }}>
          {[
            ['Views (30d)', '487K', '▲ 12%', 'var(--lichen)'],
            ['Earnings (30d)', '$3,284', '▲ 23%', 'var(--amber)'],
            ['New followers', '1,847', '▲ 8%', 'var(--lichen)'],
            ['Pending payout', '$1,120', 'Next: Apr 28', 'var(--parchment-dim)'],
          ].map(([k, v, delta, color]) => (
            <div key={k} style={{ padding: 20, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 10 }}>{k}</div>
              <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: 14, color }}>{delta}</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div style={{ padding: 24, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18 }}>Views over time</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7d', '30d', '90d', '1y'].map((p, i) => (
                <button key={p} className={'chip' + (i === 1 ? ' active' : '')} style={{ padding: '4px 10px', fontSize: 12 }} data-placeholder="true">{p}</button>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 800 180" style={{ width: '100%', height: 180 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="var(--amber)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[30, 60, 90, 120, 150].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--line)" strokeDasharray="2 4"/>)}
            <path d="M0 140 L60 125 L120 130 L180 105 L240 115 L300 85 L360 95 L420 70 L480 60 L540 80 L600 45 L660 55 L720 35 L800 40 L800 180 L0 180 Z" fill="url(#g)"/>
            <path d="M0 140 L60 125 L120 130 L180 105 L240 115 L300 85 L360 95 L420 70 L480 60 L540 80 L600 45 L660 55 L720 35 L800 40" stroke="var(--amber)" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        {/* Videos table */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18 }}>Recent uploads</h3>
            <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>Sorted by: Newest</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1fr 90px 90px 120px 100px', padding: '10px 20px', background: 'var(--forest-950)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>
            <span></span><span>CLIP</span><span>STATUS</span><span style={{ textAlign: 'right' }}>VIEWS</span><span style={{ textAlign: 'right' }}>LIKES</span><span style={{ textAlign: 'right' }}>EARNINGS</span><span style={{ textAlign: 'right' }}>PRICE</span>
          </div>
          {myVids.map(v => {
            const loc = LOCATIONS.find(l => l.id === v.locationId);
            return (
              <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1fr 90px 90px 120px 100px', padding: '12px 20px', borderTop: '1px solid var(--line)', alignItems: 'center' }}>
                <div style={{ width: 44, aspectRatio: '16/9', background: thumbGradient(parseInt(v.id.slice(1))), borderRadius: 2, border: '1px solid var(--line)' }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{loc?.name}</div>
                </div>
                <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--moss)', color: 'var(--bone)', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', justifySelf: 'start' }}>LIVE</span>
                <span className="mono" style={{ textAlign: 'right', fontSize: 14 }}>{formatViews(v.views)}</span>
                <span className="mono" style={{ textAlign: 'right', fontSize: 14 }}>{formatViews(v.likes)}</span>
                <span className="mono" style={{ textAlign: 'right', fontSize: 14, color: v.price > 0 ? 'var(--amber)' : 'var(--parchment-dim)' }}>
                  ${v.price > 0 ? (v.price * 47).toFixed(0) : '—'}
                </span>
                <span style={{ textAlign: 'right', fontSize: 14 }}>
                  {v.price > 0
                    ? <span className="tag-paid">${v.price}</span>
                    : <span className="tag-free">FREE</span>}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function UploadFlow({ onDone }) {
  const [pricing, setPricing] = React.useState('free');
  const [price, setPrice] = React.useState(9.99);
  const [cat, setCat] = React.useState('landscape');
  const [file, setFile] = React.useState(null);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 80px' }}>
      <button onClick={onDone} style={{ color: 'var(--parchment-dim)', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ transform: 'rotate(180deg)' }}><Ic.chevron/></span> Back to console
      </button>
      <div className="eyebrow" style={{ marginBottom: 10 }}>STEP 2 OF 3 — LICENSING & DETAILS</div>
      <h1 style={{ fontSize: 40, letterSpacing: '-0.02em', marginBottom: 8 }}>Prep your flight.</h1>
      <p style={{ color: 'var(--parchment)', marginBottom: 32 }}>Tag the location, choose a category, and decide how pilots can license this clip.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 30 }}>
        <div>
          {/* Dropzone */}
          <div style={{
            aspectRatio: '16/9',
            background: 'var(--forest-900)',
            border: '2px dashed var(--line-strong)',
            borderRadius: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, marginBottom: 20,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1.5px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}><Ic.upload/></div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>ocean_sunrise_v3.mp4</div>
            <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>4K · H.265 · 2.4 GB · 6:21 duration</div>
            <div style={{ width: '60%', height: 4, background: 'var(--forest-700)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '73%', height: '100%', background: 'var(--amber)' }}/>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', letterSpacing: '0.12em' }}>73% UPLOADED · 2 MIN REMAINING</div>
          </div>

          {/* Title */}
          <FormGroup label="Title">
            <input defaultValue="Golden Hour Ascent — Director's Edit" style={inputStyle}/>
          </FormGroup>

          <FormGroup label="Description">
            <textarea defaultValue="Shot on DJI Mavic 3 Pro Cine at golden hour. ND8 filter, 24fps, D-Log M color." style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}/>
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Category">
              <select value={cat} onChange={e => setCat(e.target.value)} style={inputStyle}>
                {CATEGORIES.slice(1).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Location (tag on map)">
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ color: 'var(--amber)' }}><Ic.pin/></span>
                Namsan Tower, Seoul
              </div>
            </FormGroup>
          </div>
        </div>

        {/* Right: licensing */}
        <div>
          <div style={{ padding: 24, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
            <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--amber)' }}>LICENSING MODEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { id: 'free', title: 'Free · CC-BY', desc: 'Anyone can stream. Attribution required for reuse.' },
                { id: 'paid', title: 'Paid License', desc: '3-second preview, then gated. You set the price.' },
                { id: 'exclusive', title: 'Exclusive Single-Buyer', desc: 'One buyer takes the entire clip. Removed from catalog.' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setPricing(opt.id)} style={{
                  display: 'block', textAlign: 'left',
                  padding: 14,
                  background: pricing === opt.id ? 'var(--forest-800)' : 'transparent',
                  border: '1px solid ' + (pricing === opt.id ? 'var(--amber)' : 'var(--line)'),
                  borderRadius: 3,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '1.5px solid ' + (pricing === opt.id ? 'var(--amber)' : 'var(--line-strong)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pricing === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }}/>}
                    </div>
                    <strong style={{ fontSize: 14 }}>{opt.title}</strong>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--parchment-dim)', paddingLeft: 26 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {pricing === 'paid' && (
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>PRICE (USD)</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <input type="range" min="1" max="99" step="1" value={Math.floor(price)} onChange={e => setPrice(+e.target.value)} style={{ flex: 1 }}/>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', minWidth: 80, textAlign: 'right' }}>${price.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>You earn: ${(price * 0.7).toFixed(2)} per license</span>
                  <span>Icarus fee: 30%</span>
                </div>
                <div style={{ marginTop: 14, padding: 10, background: 'var(--forest-950)', borderRadius: 2, fontSize: 14, color: 'var(--parchment)' }}>
                  <strong>Projected monthly earnings:</strong> ${(price * 0.7 * 42).toFixed(0)} — based on similar clips in this category.
                </div>
              </div>
            )}
          </div>

          <button className="btn primary" style={{ width: '100%', padding: 14, fontSize: 14, marginTop: 16, justifyContent: 'center' }} data-placeholder="true">
            Continue to review →
          </button>
          <button className="btn secondary" style={{ width: '100%', padding: 12, fontSize: 14, marginTop: 8, justifyContent: 'center' }}
            onClick={onDone}>Save as draft</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: 'var(--forest-900)',
  border: '1px solid var(--line-strong)',
  borderRadius: 3,
  color: 'var(--bone)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

