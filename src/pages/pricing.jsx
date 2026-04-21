// pages/pricing.jsx — marketplace model: pilots set the price, platform takes 30%
import React, { useState, useMemo } from 'react';
import { Ic } from '../components';

const PLATFORM_CUT = 0.30;       // 30% platform fee
const PILOT_SHARE = 1 - PLATFORM_CUT; // 70% to the pilot

function fmt(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function PricingPage({ onNav }) {
  const [price, setPrice] = useState(29);
  const [licensesPerMonth, setLicensesPerMonth] = useState(20);

  const monthlyGross   = useMemo(() => price * licensesPerMonth, [price, licensesPerMonth]);
  const monthlyEarn    = useMemo(() => monthlyGross * PILOT_SHARE, [monthlyGross]);
  const monthlyFee     = useMemo(() => monthlyGross * PLATFORM_CUT, [monthlyGross]);
  const annualEarn     = monthlyEarn * 12;

  return (
    <div>
      {/* ───────────── Hero ───────────── */}
      <section style={{ padding: '80px 28px 50px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>PRICING · CLIP-BY-CLIP MARKETPLACE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 76, letterSpacing: '-0.035em', fontWeight: 500, lineHeight: 1, marginBottom: 18 }}>
          Pilots set the price.<br/>You keep <span style={{ color: 'var(--amber)' }}>70%</span>.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--parchment)', maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.6 }}>
          No subscriptions. No credits. Buyers pay each pilot directly for the clip they want. Drone Icarus takes a flat <strong style={{ color: 'var(--bone)' }}>30%</strong> per sale to cover hosting, payments, licensing paperwork, and trust &amp; safety — that's it.
        </p>
        <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => onNav('home')} className="btn">Browse the map</button>
          <button onClick={() => onNav('pilot-onboarding')} className="btn secondary">Become a pilot</button>
        </div>
      </section>

      {/* ───────────── For buyers / For pilots ───────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {[
            {
              eyebrow: 'FOR BUYERS', accent: 'var(--moss)',
              title: 'Pay once. Use forever (within license).',
              steps: [
                ['Browse', 'Pan the world map or filter by category, resolution, location, license tier.'],
                ['License', 'Pick the license tier you need. Pilot already set the price for each tier.'],
                ['Download', 'Watermark removed seconds after purchase. Master files (ProRes / RAW where offered) included.'],
              ],
              cta: { label: 'Browse the map →', action: () => onNav('home') },
            },
            {
              eyebrow: 'FOR PILOTS', accent: 'var(--amber)',
              title: 'Set your own price. Earn 70% per sale.',
              steps: [
                ['Upload', 'Drag in your master file. Auto-extract resolution, codec, location, EXIF.'],
                ['Set price', 'You decide what each license tier costs. Free CC-BY is fine too — visibility booster.'],
                ['Earn', 'You get 70% of every sale, paid out monthly via Wise / PayPal once you cross $20.'],
              ],
              cta: { label: 'Become a pilot →', action: () => onNav('pilot-onboarding') },
            },
          ].map(card => (
            <div key={card.eyebrow} style={{
              padding: 32, border: '1px solid var(--line-strong)', borderRadius: 6,
              background: 'var(--forest-900)', display: 'flex', flexDirection: 'column',
            }}>
              <div className="eyebrow" style={{ color: card.accent, marginBottom: 10 }}>{card.eyebrow}</div>
              <h2 style={{ fontSize: 26, marginBottom: 22, letterSpacing: '-0.01em' }}>{card.title}</h2>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18, padding: 0, marginBottom: 24, flex: 1 }}>
                {card.steps.map(([k, v], i) => (
                  <li key={k} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14 }}>
                    <span className="mono" style={{
                      width: 30, height: 30, borderRadius: 15,
                      border: '1px solid ' + card.accent, color: card.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: 'var(--bone)' }}>{k}</div>
                      <div style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.55 }}>{v}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <button onClick={card.cta.action} className="btn secondary" style={{ alignSelf: 'flex-start' }}>{card.cta.label}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Revenue split visual ───────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10, textAlign: 'center' }}>HOW EVERY DOLLAR IS SPLIT</div>
        <h2 style={{ fontSize: 30, textAlign: 'center', marginBottom: 30 }}>Same split for every clip, every license tier.</h2>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line-strong)', height: 96, marginBottom: 14 }}>
          <div style={{ flex: 70, background: 'var(--amber)', color: '#1a2820', padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', opacity: 0.8 }}>PILOT EARNS</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)' }}>70%</div>
          </div>
          <div style={{ flex: 30, background: 'var(--forest-700)', padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>PLATFORM FEE</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--bone)' }}>30%</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--parchment-dim)', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          The 30% covers payment processing (~3%), storage &amp; CDN bandwidth, DMCA &amp; permit verification, fraud screening, customer support, and platform development. No hidden tiers, no volume cliffs, no "exclusive" carve-outs.
        </p>
      </section>

      {/* ───────────── Earnings calculator ───────────── */}
      <section style={{ background: 'var(--forest-900)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>EARNINGS CALCULATOR</div>
          <h2 style={{ fontSize: 30, marginBottom: 24 }}>What could you earn?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, alignItems: 'start' }}>
            {/* inputs */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, color: 'var(--parchment)' }}>Average license price</label>
                  <span className="mono" style={{ color: 'var(--amber)' }}>{fmt(price)}</span>
                </div>
                <input type="range" min={1} max={199} step={1} value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#e8b04a' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--parchment-dim)', marginTop: 4 }} className="mono">
                  <span>$1 (Personal)</span><span>$199 (Extended)</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, color: 'var(--parchment)' }}>Licenses sold per month</label>
                  <span className="mono" style={{ color: 'var(--amber)' }}>{licensesPerMonth}</span>
                </div>
                <input type="range" min={1} max={200} step={1} value={licensesPerMonth}
                  onChange={e => setLicensesPerMonth(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#e8b04a' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--parchment-dim)', marginTop: 4 }} className="mono">
                  <span>1</span><span>200</span>
                </div>
              </div>
            </div>

            {/* outputs */}
            <div style={{ background: 'var(--forest-800)', border: '1px solid var(--line-strong)', borderRadius: 6, padding: 26 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>EVERY MONTH YOU EARN</div>
              <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(monthlyEarn)}</div>
              <div style={{ height: 1, background: 'var(--line)', margin: '20px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div>
                  <div className="mono" style={{ color: 'var(--parchment-dim)', fontSize: 10, letterSpacing: '0.1em' }}>GROSS / MO</div>
                  <div style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 600 }}>{fmt(monthlyGross)}</div>
                </div>
                <div>
                  <div className="mono" style={{ color: 'var(--parchment-dim)', fontSize: 10, letterSpacing: '0.1em' }}>PLATFORM FEE</div>
                  <div style={{ fontSize: 16, color: 'var(--parchment)', fontWeight: 600 }}>{fmt(monthlyFee)}</div>
                </div>
                <div>
                  <div className="mono" style={{ color: 'var(--parchment-dim)', fontSize: 10, letterSpacing: '0.1em' }}>YEARLY EARNINGS</div>
                  <div style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 600 }}>{fmt(annualEarn)}</div>
                </div>
                <div>
                  <div className="mono" style={{ color: 'var(--parchment-dim)', fontSize: 10, letterSpacing: '0.1em' }}>PAYOUT THRESHOLD</div>
                  <div style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 600 }}>$20</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 16, lineHeight: 1.5 }}>
                Estimates are pre-tax. Actual earnings depend on demand at your locations, license tier mix, and currency conversion. Top-decile pilots clear several thousand dollars per month.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── License tiers ───────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>LICENSE TIERS · CHOOSE PER CLIP</div>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>Every clip, five ways to license.</h2>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 24, maxWidth: 720 }}>
          Pilots toggle which tiers their clip is sold under, and set a price for each. Buyers pick the tier that matches their use case. The 70 / 30 split applies to every tier — no preferential rates, no exclusivity surcharges.
        </p>
        <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', background: 'var(--forest-900)', borderBottom: '1px solid var(--line-strong)' }}>
            {['', 'Free · CC-BY', 'Personal', 'Commercial 1yr', 'Extended', 'Exclusive'].map((h, i) => (
              <div key={i} className="mono" style={{ padding: '14px 12px', fontSize: 10, letterSpacing: '0.14em', color: i === 0 ? 'transparent' : (i === 5 ? 'var(--amber)' : 'var(--parchment-dim)'), fontWeight: 600 }}>{h}</div>
            ))}
          </div>
          {[
            ['Personal projects',         true,  true,  true,  true,  true],
            ['Social media (organic)',    true,  true,  true,  true,  true],
            ['Paid social / ads',         false, false, true,  true,  true],
            ['Broadcast / OTT',           false, false, false, true,  true],
            ['Resale as stock footage',   false, false, false, false, true],
            ['Removed from catalog',      false, false, false, false, true],
            ['Attribution required',      true,  false, false, false, false],
            ['Suggested price (USD)',     '—',   '$4–9','$18–49','$99+','Pilot sets'],
            ['Max territories',           '—',   '1',   '1',   'Worldwide','Worldwide'],
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
              {row.map((cell, j) => (
                <div key={j} style={{ padding: '14px 12px', fontSize: 13, color: j === 0 ? 'var(--parchment)' : 'var(--bone)', fontWeight: j === 0 ? 400 : 500 }}>
                  {cell === true ? <span style={{ color: 'var(--lichen)' }}><Ic.check/></span>
                    : cell === false ? <span style={{ color: 'var(--parchment-dim)' }}>—</span>
                    : <span className={typeof cell === 'string' && cell.startsWith('$') ? 'mono' : ''} style={{ fontSize: typeof cell === 'string' && cell.startsWith('$') ? 12 : 13 }}>{cell}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Payouts strip ───────────── */}
      <section style={{ background: 'var(--forest-900)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '50px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>PAYOUTS</div>
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>Predictable. Monthly. No fine print.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['When', 'Monthly', '1st of every month, covering the prior calendar month.'],
              ['Threshold', '$20', 'Below threshold rolls over to the next cycle. No expiry.'],
              ['Methods', 'Wise · PayPal', 'Stripe Connect for US/EU, Wise multi-currency, PayPal worldwide.'],
              ['Fees we absorb', '0%', 'Payout transfer fees come out of our 30% — never the pilot\u2019s 70%.'],
            ].map(([k, big, sub]) => (
              <div key={k} style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--forest-800)' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', marginBottom: 8 }}>{big}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment)', lineHeight: 1.55 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px 100px' }}>
        <h2 style={{ fontSize: 28, marginBottom: 22 }}>Common questions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          {[
            ['Is there a subscription or monthly fee?',
             'No. Drone Icarus is purely transactional. Buyers pay only when they license a clip. Pilots pay nothing to upload, store, or list. Our 30% commission is the entire business model.'],
            ['Do verified pilots get a better split?',
             'No. Verification gets you a badge, priority placement on the map and in search, and access to commission requests — but the 70 / 30 split is identical for every pilot, every clip, every tier.'],
            ['Who sets the clip price?',
             'You do. When you upload, you toggle which license tiers your clip is sold under and set a price for each. Suggested ranges are shown but you have full control. You can change prices anytime; existing licenses keep the price they were sold at.'],
            ['What does "royalty free" mean here?',
             'Once a buyer licenses a clip under a tier, they can use it for the scope that tier covers (organic social, paid ads, broadcast, etc.) without paying per play or per impression. They paid you once; they reuse within scope.'],
            ['Can I sell exclusively to one buyer?',
             'Yes. Toggle the Exclusive tier on your clip and set the price. Once sold, the clip is removed from the catalog and the buyer owns sole license. You still keep 70%.'],
            ['What if a clip is taken down after sale?',
             'Buyer is fully refunded. The pilot is not charged the 30% — only paid out on completed sales. Chain-of-custody metadata makes this rare; repeat takedown offenders are removed from the platform.'],
          ].map(([q, a]) => (
            <div key={q}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{q}</h3>
              <p style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.65 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
