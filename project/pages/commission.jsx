// pages/commission.jsx — brief a pilot for a custom shoot

const { useState: cmUseState } = React;

function CommissionPage({ onNav }) {
  const [step, setStep] = cmUseState(1);
  const [budget, setBudget] = cmUseState(3500);
  const creator = window.CREATORS?.[0] || { name: 'Hyunwoo Park', handle: '@hyunwoo', country: 'Seoul, KR' };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 28px 80px' }}>
      <button onClick={() => onNav('home')} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 18 }}>← Cancel</button>

      <div className="eyebrow" style={{ marginBottom: 10 }}>COMMISSION A SHOOT · STEP {step}/3</div>
      <h1 style={{ fontSize: 40, letterSpacing: '-0.02em', marginBottom: 8 }}>Brief a pilot directly.</h1>
      <p style={{ fontSize: 14, color: 'var(--parchment)', marginBottom: 30, maxWidth: 620 }}>
        Need a specific shot — a place, a time, a mood — that isn't in the catalog? Send a brief. {creator.name} usually responds within 6 hours.
      </p>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 30, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
        {['The shot', 'Where & when', 'Budget & rights'].map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: '14px 20px',
            background: step === i+1 ? 'var(--forest-800)' : 'var(--forest-950)',
            borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
          }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>{String(i+1).padStart(2,'0')}</div>
            <div style={{ fontSize: 14, fontWeight: step === i+1 ? 600 : 400, color: step >= i+1 ? 'var(--bone)' : 'var(--parchment-dim)' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 30 }}>
        <div>
          {step === 1 && (
            <>
              <CF label="Project title"><input defaultValue="Nomad Co. — Spring SS26 brand film" style={ciS}/></CF>
              <CF label="What's the shot?" hint="Be specific: mood, subject, camera move, reference frames.">
                <textarea defaultValue="A single 30–45s slow push-in over Namsan Tower at first light. Fog layer below the tower, Seoul still asleep. Feels lonely and hopeful at the same time — like the city hasn't decided yet what kind of day it'll be." style={{ ...ciS, minHeight: 140, resize: 'vertical', fontFamily: 'inherit' }}/>
              </CF>
              <CF label="References (links or upload)">
                <div style={{ padding: 22, border: '2px dashed var(--line-strong)', borderRadius: 3, textAlign: 'center', background: 'var(--forest-950)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>3 references pinned</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.12em', marginTop: 4 }}>2 Vimeo links · 1 still frame</div>
                </div>
              </CF>
              <CF label="Deliverables">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['5.1K ProRes 422 HQ master', 'Graded mp4 (Rec.709)', 'RAW D-Log M source', 'Vertical 9:16 social crop'].map((o, i) => (
                    <label key={o} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, border: '1px solid var(--line)', borderRadius: 3, fontSize: 13 }}>
                      <input type="checkbox" defaultChecked={i < 2}/>
                      {o}
                    </label>
                  ))}
                </div>
              </CF>
            </>
          )}

          {step === 2 && (
            <>
              <CF label="Location" hint="Exact GPS pin or nearest landmark.">
                <div style={{ padding: 14, border: '1px solid var(--line-strong)', borderRadius: 3, background: 'var(--forest-900)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--sunset)' }}><Ic.pin/></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Namsan Tower, Seoul</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>37.5512° N · 126.9882° E</div>
                  </div>
                  <button className="btn secondary" style={{ fontSize: 12 }}>Adjust on map</button>
                </div>
              </CF>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <CF label="Shoot date"><input defaultValue="Apr 28 – May 02, 2026" style={ciS}/></CF>
                <CF label="Time of day">
                  <select style={ciS} defaultValue="dawn">
                    {['Dawn (05:40)', 'Sunrise (06:12)', 'Golden hour AM', 'Midday', 'Golden hour PM', 'Sunset', 'Blue hour', 'Night', 'Flexible'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </CF>
              </div>
              <CF label="Weather requirement" hint="We'll watch the forecast and reschedule if needed.">
                <select style={ciS} defaultValue="fog">
                  <option>Any clear conditions</option>
                  <option>Must have fog / mist layer below 300ft</option>
                  <option>Golden hour light only</option>
                  <option>Overcast / even lighting</option>
                </select>
              </CF>
              <CF label="Permits needed" hint="Pilot handles city/airspace permits — included in fee.">
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, border: '1px solid var(--moss)', background: 'rgba(107,142,78,0.08)', borderRadius: 3 }}>
                  <span style={{ color: 'var(--moss)' }}><Ic.check/></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Pilot arranges all permits</div>
                    <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>KCAA operational approval, Yongsan district permit, Namsan park ranger sign-off.</div>
                  </div>
                </label>
              </CF>
            </>
          )}

          {step === 3 && (
            <>
              <CF label="Budget range (USD)" hint={`Drag to set. ${creator.name} typically quotes $2,800–$5,400 for this brief.`}>
                <div style={{ padding: 18, border: '1px solid var(--line)', borderRadius: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 38, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)' }}>${budget.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>+ 15% platform fee at settlement</span>
                  </div>
                  <input type="range" min="500" max="12000" step="100" value={budget} onChange={e => setBudget(+e.target.value)} style={{ width: '100%' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.1em', marginTop: 6 }}>
                    <span>$500</span><span>$3K</span><span>$6K</span><span>$9K</span><span>$12K+</span>
                  </div>
                </div>
              </CF>
              <CF label="Usage rights">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Web & social · 1 year', 'Included'],
                    ['Broadcast / OTT · 1 year', '+$1,200'],
                    ['Perpetual global · all media', '+$2,800'],
                    ['Buyout · exclusive', '+$6,500'],
                  ].map(([t, px], i) => (
                    <label key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, border: '1px solid ' + (i === 0 ? 'var(--amber)' : 'var(--line)'), borderRadius: 3, fontSize: 13 }}>
                      <input type="radio" name="rights" defaultChecked={i === 0}/>
                      <span style={{ flex: 1 }}>{t}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--amber)' }}>{px}</span>
                    </label>
                  ))}
                </div>
              </CF>
              <CF label="Timeline">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 3 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.14em' }}>SHOOT BY</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>May 02, 2026</div>
                  </div>
                  <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 3 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.14em' }}>FINAL DELIVERY</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>May 09, 2026</div>
                  </div>
                </div>
              </CF>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {step > 1 ? <button onClick={() => setStep(step-1)} className="btn secondary">← Back</button> : <span/>}
            {step < 3 ? <button onClick={() => setStep(step+1)} className="btn">Continue →</button> : <button onClick={() => onNav('messages')} className="btn">Send brief to pilot</button>}
          </div>
        </div>

        {/* Right rail — pilot card + summary */}
        <div>
          <div style={{ padding: 22, border: '1px solid var(--line)', borderRadius: 4, marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>BRIEFING</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--sunset)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>{creator.name[0]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{creator.name} <span style={{ color: 'var(--amber)' }}><Ic.check/></span></div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{creator.handle} · {creator.country}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--parchment)', lineHeight: 1.6 }}>
              <strong>98%</strong> response rate · avg <strong>6h</strong> first reply · <strong>214</strong> commissions completed · never cancelled.
            </div>
          </div>

          <div style={{ padding: 22, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--forest-900)' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>ESTIMATE</div>
            {[
              ['Base shoot fee', '$' + budget.toLocaleString()],
              ['Usage: web & social · 1yr', 'incl.'],
              ['Deliverables: 2 formats', 'incl.'],
              ['Permits & insurance', 'incl.'],
              ['Platform fee (15%)', '$' + Math.round(budget * 0.15).toLocaleString()],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none', fontSize: 12 }}>
                <span style={{ color: 'var(--parchment-dim)' }}>{k}</span>
                <span className="mono">{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 6, borderTop: '1px solid var(--line-strong)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Estimated total</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>${Math.round(budget * 1.15).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--parchment-dim)', marginTop: 10, lineHeight: 1.5 }}>
              Funds held in escrow. Released after delivery approval. 100% refund if pilot cancels.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CF({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

const ciS = { width: '100%', padding: '10px 13px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 14, borderRadius: 3, outline: 'none', fontFamily: 'inherit' };

Object.assign(window, { CommissionPage });
