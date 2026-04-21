// pages/pilot-onboarding.jsx — Become a verified pilot (multi-step)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Ic } from '../components';
const poUseState = useState;

export function PilotOnboardingPage({ onNav }) {
  const [step, setStep] = poUseState(0);
  const steps = ['Welcome', 'About you', 'Register drone', 'Upload certification', 'Liability', 'Review'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 'calc(100vh - 62px)' }}>
      {/* Left panel — narrative */}
      <aside style={{
        background: 'var(--forest-950)',
        padding: '56px 44px',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 380 800" preserveAspectRatio="xMidYMid slice">
          <g stroke="var(--parchment)" fill="none" strokeWidth="0.6">
            {[...Array(22)].map((_, i) => (
              <path key={i} d={`M0 ${50 + i*36} Q90 ${30 + i*36} 190 ${55 + i*36} T380 ${40 + i*36}`}/>
            ))}
          </g>
        </svg>
        <div style={{ position: 'relative' }}>
          <button onClick={() => onNav('home')} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 36 }}>← Back</button>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--amber)', marginBottom: 18 }}>BECOME A VERIFIED PILOT</div>
          <h1 style={{ fontSize: 38, lineHeight: 1.05, marginBottom: 18, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Fly legally.<br/>
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--parchment)' }}>Get paid directly.</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--parchment)' }}>
            Every pilot keeps <strong style={{ color: 'var(--amber)' }}>70% of each sale</strong>. Verified pilots additionally appear in the Rankings, get priority placement on the global map, and can accept paid commission requests.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 14 }}>{String(step+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', gap: 14, alignItems: 'center', opacity: i > step ? 0.4 : 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i < step ? 'var(--moss)' : i === step ? 'var(--amber)' : 'transparent',
                  border: '1px solid ' + (i < step ? 'var(--moss)' : i === step ? 'var(--amber)' : 'var(--line-strong)'),
                  color: i <= step ? '#faf6ec' : 'var(--parchment-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                }}>{i < step ? '✓' : i + 1}</div>
                <div style={{ fontSize: 14, fontWeight: i === step ? 600 : 400, color: i === step ? 'var(--bone)' : 'var(--parchment)' }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: 14, background: 'rgba(232, 176, 74, 0.08)', border: '1px solid rgba(232, 176, 74, 0.2)', borderRadius: 3, fontSize: 11, color: 'var(--parchment)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--amber)' }}>TAKES ~8 MIN.</strong> Typical review: 24h. We verify with KCAA, FAA, CAA, EASA and DGAC registries directly.
          </div>
        </div>
      </aside>

      {/* Right panel — form content */}
      <main style={{ padding: '56px 64px 80px', maxWidth: 780 }}>
        {step === 0 && <PWelcome go={() => setStep(1)}/>}
        {step === 1 && <PAbout go={() => setStep(2)}/>}
        {step === 2 && <PDrone go={() => setStep(3)}/>}
        {step === 3 && <PCert go={() => setStep(4)}/>}
        {step === 4 && <PLiab go={() => setStep(5)}/>}
        {step === 5 && <PReview go={() => onNav('settings')}/>}

        {step > 0 && step < 5 && (
          <button onClick={() => setStep(step - 1)} style={{ marginTop: 20, fontSize: 12, color: 'var(--parchment-dim)' }}>← Previous step</button>
        )}
      </main>
    </div>
  );
}

function PWelcome({ go }) {
  return (
    <>
      <h2 style={{ fontSize: 28, marginBottom: 10 }}>Welcome, future verified pilot.</h2>
      <p style={{ color: 'var(--parchment)', marginBottom: 30, fontSize: 15, lineHeight: 1.6 }}>
        You're about to unlock higher payouts and broader reach. Here's what you'll need on hand before we start:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['📋', 'Drone registration number', 'From the civil aviation authority in your country — KCAA, FAA, CAA, EASA, DGAC, etc.'],
          ['🪪', 'Government-issued ID', 'Passport, driver\'s license, or national ID card. We OCR it, then delete the image after 30 days.'],
          ['🎓', 'Commercial certification (recommended)', 'FAA Part 107, KCAA Commercial, EASA A2, or your regional equivalent.'],
          ['🛡️', 'Liability insurance (optional, tier 3)', 'Required only for Extended licenses over $1K. We partner with SkyWatch.AI if you need coverage.'],
        ].map(([emoji, t, d]) => (
          <div key={t} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 16, padding: 18, border: '1px solid var(--line)', borderRadius: 3 }}>
            <div style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.6 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={go} className="btn" style={{ marginTop: 28, padding: '12px 22px', fontSize: 14 }}>Let's go →</button>
    </>
  );
}

function PAbout({ go }) {
  return (
    <>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Tell us about yourself</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <OField label="Legal first name"><input defaultValue="Hyunwoo" style={iStyle}/></OField>
        <OField label="Legal last name"><input defaultValue="Park" style={iStyle}/></OField>
      </div>
      <OField label="Date of birth" hint="Must be 18+ to operate commercially">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <input defaultValue="1994" style={iStyle} placeholder="YYYY"/>
          <input defaultValue="08" style={iStyle} placeholder="MM"/>
          <input defaultValue="21" style={iStyle} placeholder="DD"/>
        </div>
      </OField>
      <OField label="Primary country of operation">
        <select defaultValue="South Korea" style={iStyle}>
          {['South Korea', 'United States', 'Japan', 'United Kingdom', 'Germany', 'France', 'Australia', 'Brazil', 'Canada'].map(c => <option key={c}>{c}</option>)}
        </select>
      </OField>
      <OField label="Upload government-issued ID" hint="Passport or national ID card. Encrypted at rest, auto-deleted after verification.">
        <div style={{
          padding: 28, border: '2px dashed var(--line-strong)', borderRadius: 4, textAlign: 'center',
          background: 'var(--forest-950)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🪪</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>passport_hp.pdf</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--lichen)', letterSpacing: '0.14em' }}>● ENCRYPTED · 2.1 MB · OCR PASSED</div>
        </div>
      </OField>
      <button onClick={go} className="btn" style={{ marginTop: 20, padding: '12px 22px', fontSize: 14 }}>Continue →</button>
    </>
  );
}

function PDrone({ go }) {
  const [n, setN] = poUseState(1);
  const drones = [
    ['DJI Mavic 3 Pro Cine', 'FA3X4MK219', 958],
  ];
  return (
    <>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>Register your aircraft</h2>
      <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 24 }}>Every drone you fly commercially. You can add more later in settings.</p>

      {drones.slice(0, n).map((_, i) => (
        <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 22, marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>DRONE {String(i+1).padStart(2,'0')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <OField label="Manufacturer"><select defaultValue="DJI" style={iStyle}><option>DJI</option><option>Autel</option><option>Skydio</option><option>Parrot</option><option>Freefly</option></select></OField>
            <OField label="Model"><select defaultValue="Mavic 3 Pro Cine" style={iStyle}><option>Mavic 3 Pro Cine</option><option>Air 3S</option><option>Inspire 3</option><option>Mini 4 Pro</option></select></OField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <OField label="Registration number" hint="Issued by your civil aviation authority">
              <input defaultValue="FA3X4MK219" style={{ ...iStyle, fontFamily: 'var(--font-mono)' }}/>
            </OField>
            <OField label="Takeoff weight">
              <div style={{ display: 'flex', gap: 6 }}>
                <input defaultValue="958" style={iStyle}/>
                <select style={{ ...iStyle, width: 74 }}><option>g</option><option>kg</option></select>
              </div>
            </OField>
          </div>
          <div style={{ padding: 12, background: 'rgba(107, 142, 78, 0.1)', border: '1px solid var(--moss)', borderRadius: 3, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--moss)' }}><Ic.check/></span>
            <div style={{ fontSize: 12, color: 'var(--parchment)' }}>Verified with <span className="mono">KCAA.go.kr</span> · operator: Hyunwoo Park · in good standing.</div>
          </div>
        </div>
      ))}

      <button onClick={() => setN(n + 1)} style={{ display: 'block', width: '100%', padding: 14, border: '1px dashed var(--line-strong)', borderRadius: 3, color: 'var(--parchment-dim)', fontSize: 13 }}>+ Register another drone</button>

      <button onClick={go} className="btn" style={{ marginTop: 20, padding: '12px 22px', fontSize: 14 }}>Continue →</button>
    </>
  );
}

function PCert({ go }) {
  return (
    <>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>Certifications <span style={{ fontSize: 14, color: 'var(--parchment-dim)', fontWeight: 400 }}>(recommended)</span></h2>
      <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 24 }}>Verified pilots with commercial certification get the <span style={{ color: 'var(--amber)' }}>VERIFIED badge</span>, which earns buyer trust and unlocks paid commission invites.</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {[
          ['KCAA Commercial UAV License', 'Korea', '확인됨', 'var(--lichen)'],
          ['FAA Part 107 Remote Pilot', 'United States', 'Verified', 'var(--lichen)'],
          ['CAA A2 Certificate of Competency', 'United Kingdom', 'Not added', 'var(--parchment-dim)'],
          ['EASA Open A2', 'European Union', 'Not added', 'var(--parchment-dim)'],
          ['Transport Canada Advanced', 'Canada', 'Not added', 'var(--parchment-dim)'],
        ].map(([name, reg, status, color]) => {
          const added = color === 'var(--lichen)';
          return (
            <div key={name} style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 3, display: 'grid', gridTemplateColumns: '1fr 1fr 120px', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{reg}</div>
              </div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color }}>{added && '● '}{status.toUpperCase()}</div>
              <button style={{
                fontSize: 12, padding: '6px 12px', borderRadius: 3,
                background: added ? 'transparent' : 'var(--forest-900)',
                border: '1px solid ' + (added ? 'var(--line)' : 'var(--line-strong)'),
                color: added ? 'var(--parchment-dim)' : 'var(--bone)',
              }}>{added ? 'Replace' : '+ Upload PDF'}</button>
            </div>
          );
        })}
      </div>

      <button onClick={go} className="btn" style={{ marginTop: 24, padding: '12px 22px', fontSize: 14 }}>Continue →</button>
      <button onClick={go} style={{ marginTop: 12, marginLeft: 14, fontSize: 13, color: 'var(--parchment-dim)' }}>Skip — I'll add these later</button>
    </>
  );
}

function PLiab({ go }) {
  const [has, setHas] = poUseState('yes');
  return (
    <>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>Liability insurance</h2>
      <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 24 }}>Required only if you plan to sell <strong style={{ color: 'var(--amber)' }}>Extended licenses</strong> — broadcast, agency, resale ($500+ per clip).</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          ['yes', 'I have coverage', 'I\'ll upload my certificate of insurance.'],
          ['quote', 'Get me a quote', 'SkyWatch.AI $1M liability from $12/mo.'],
          ['later', 'Skip for now', 'I won\'t sell Extended licenses yet.'],
        ].map(([k, t, d]) => {
          const on = has === k;
          return (
            <button key={k} onClick={() => setHas(k)} style={{
              padding: 18, textAlign: 'left',
              border: '1px solid ' + (on ? 'var(--amber)' : 'var(--line)'),
              background: on ? 'var(--forest-900)' : 'transparent',
              borderRadius: 3, gridColumn: k === 'later' ? 'span 2' : 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (on ? 'var(--amber)' : 'var(--line-strong)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }}/>}
                </div>
                <strong style={{ fontSize: 14 }}>{t}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', paddingLeft: 24, lineHeight: 1.5 }}>{d}</div>
            </button>
          );
        })}
      </div>

      {has === 'yes' && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 3, padding: 22 }}>
          <OField label="Insurer"><input defaultValue="Lloyd's of London · Verifly" style={iStyle}/></OField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <OField label="Coverage amount"><input defaultValue="$1,000,000" style={iStyle}/></OField>
            <OField label="Expires"><input defaultValue="2027.02.14" style={iStyle}/></OField>
          </div>
          <OField label="Certificate of insurance (PDF)">
            <div style={{ padding: 18, border: '2px dashed var(--line-strong)', borderRadius: 3, textAlign: 'center', background: 'var(--forest-950)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>certificate_2026.pdf</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--lichen)', letterSpacing: '0.14em', marginTop: 4 }}>● 412 KB · VERIFIED</div>
            </div>
          </OField>
        </div>
      )}

      <button onClick={go} className="btn" style={{ marginTop: 24, padding: '12px 22px', fontSize: 14 }}>Continue to review →</button>
    </>
  );
}

function PReview({ go }) {
  return (
    <>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>Review & submit</h2>
      <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 24 }}>Double-check, then we'll begin verification. Typical review: under 24h. You'll get an email when you're approved.</p>

      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        {[
          ['Identity', 'Hyunwoo Park · 1994.08.21 · 🇰🇷 South Korea'],
          ['Drones', '1 registered · DJI Mavic 3 Pro Cine (FA3X4MK219)'],
          ['Certifications', 'KCAA Commercial · FAA Part 107'],
          ['Insurance', 'Lloyd\'s of London · $1M · expires 2027.02'],
          ['Payout', 'Stripe Connect · KEB Hana Bank •• 4821'],
        ].map(([k, v], i) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px', gap: 14, padding: '16px 22px', borderTop: i > 0 ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: 13 }}>{v}</div>
            <button style={{ fontSize: 11, color: 'var(--sunset)', textAlign: 'right' }}>Edit</button>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', gap: 12, marginTop: 22, alignItems: 'flex-start' }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
        <div style={{ fontSize: 12, color: 'var(--parchment)', lineHeight: 1.6 }}>
          I confirm all information above is accurate and I have read the <span style={{ color: 'var(--sunset)' }}>Pilot Agreement v4.2</span> and the <span style={{ color: 'var(--sunset)' }}>Code of Aerial Conduct</span>. False information may result in immediate permanent ban and legal notice to the issuing authority.
        </div>
      </label>

      <button onClick={go} className="btn" style={{ marginTop: 24, padding: '14px 26px', fontSize: 14 }}>Submit for verification</button>
    </>
  );
}

function OField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const iStyle = { width: '100%', padding: '10px 13px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 14, borderRadius: 3, outline: 'none', fontFamily: 'inherit' };

