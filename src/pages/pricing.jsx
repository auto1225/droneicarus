// pages/pricing.jsx — comprehensive pricing: marketplace clip licensing + Live Super Chat
import React, { useState, useMemo } from 'react';
import { Ic } from '../components';
import { useSiteSetting } from '../db/useSettings';

const PLATFORM_CUT = 0.30;
const PILOT_SHARE = 1 - PLATFORM_CUT;
const fmt = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const SUPER_TIERS = [
  { color: '#1565c0', text: '#fff', label: 'Blue',   amount: 1,   pin: '—'      },
  { color: '#00b8d4', text: '#000', label: 'Lblue',  amount: 2,   pin: '—'      },
  { color: '#00bfa5', text: '#000', label: 'Green',  amount: 5,   pin: '1 min'  },
  { color: '#ffca28', text: '#000', label: 'Yellow', amount: 10,  pin: '2 min'  },
  { color: '#ff8f00', text: '#000', label: 'Orange', amount: 20,  pin: '5 min'  },
  { color: '#e91e63', text: '#fff', label: 'Pink',   amount: 50,  pin: '15 min' },
  { color: '#d50000', text: '#fff', label: 'Red',    amount: 100, pin: '30 min' },
];

export function PricingPage({ onNav }) {
  const cms = useSiteSetting('pricing', null);
  const [price, setPrice] = useState(29);
  const [licensesPerMonth, setLicensesPerMonth] = useState(20);
  const [scAvg, setScAvg] = useState(8);
  const [scPerStream, setScPerStream] = useState(15);
  const [streamsPerMonth, setStreamsPerMonth] = useState(4);

  const marketplaceMonthlyGross = price * licensesPerMonth;
  const marketplaceMonthlyEarn  = marketplaceMonthlyGross * PILOT_SHARE;
  const marketplaceMonthlyFee   = marketplaceMonthlyGross * PLATFORM_CUT;
  const marketplaceAnnualEarn   = marketplaceMonthlyEarn * 12;

  const liveMonthlyGross = scAvg * scPerStream * streamsPerMonth;
  const liveMonthlyEarn  = liveMonthlyGross * PILOT_SHARE;
  const liveMonthlyFee   = liveMonthlyGross * PLATFORM_CUT;
  const liveAnnualEarn   = liveMonthlyEarn * 12;

  return (
    <div>
      {/* ───────────── Hero ───────────── */}
      <section style={{ padding: '80px 28px 50px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>{cms?.eyebrow || "PRICING · TWO REVENUE STREAMS · ONE SPLIT"}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 76, letterSpacing: '-0.035em', fontWeight: 500, lineHeight: 1, marginBottom: 18 }}>
          You set the price.<br/>You keep <span style={{ color: 'var(--amber)' }}>85%</span>.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--parchment)', maxWidth: 720, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {cms?.sub || "No subscriptions. No credits. Two ways to earn — sell your aerial clips one license at a time, or stream live and accept Super Chat tips. The same flat 70 / 30 pilot/platform split applies to everything. That's the whole pricing."}
        </p>
        <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => onNav('home')} className="btn">Browse the map</button>
          <button onClick={() => onNav('pilot-onboarding')} className="btn secondary">Become a pilot</button>
          <button onClick={() => onNav('livehelp')} className="btn secondary">Live broadcasting →</button>
        </div>
      </section>

      {/* ───────────── Three audiences ───────────── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 28px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            {
              eyebrow: 'FOR BUYERS', accent: 'var(--moss)',
              title: 'Pay once. Use forever (within license).',
              steps: [
                ['Browse', 'Pan the world map or filter by category, resolution, location, license tier.'],
                ['License', 'Pick the license tier you need. Pilots have already set a price for each tier.'],
                ['Download', 'Watermark removed seconds after purchase. Master files (ProRes / RAW where offered) included.'],
              ],
              cta: { label: 'Browse the map →', action: () => onNav('home') },
            },
            {
              eyebrow: 'FOR PILOTS · MARKETPLACE', accent: 'var(--amber)',
              title: 'Sell clips. 85% per license.',
              steps: [
                ['Upload', 'Drag in your master file or paste an external host link. Auto-extract resolution, codec, location, EXIF.'],
                ['Set price', 'You decide what each license tier costs. Free CC-BY is fine too — visibility booster.'],
                ['Earn', '85% of every sale, paid out monthly via Wise / PayPal once you cross $20.'],
              ],
              cta: { label: 'Become a pilot →', action: () => onNav('pilot-onboarding') },
            },
            {
              eyebrow: 'FOR PILOTS · LIVE', accent: 'var(--sunset)',
              title: 'Go live. Keep 85% of every Super Chat.',
              steps: [
                ['Stream on YouTube', 'Use OBS / mobile / Studio — anything that broadcasts to YouTube. We mirror it.'],
                ['Click Go Live', 'Paste your YouTube URL into droneicarus. Toggle Super Chat tipping if your payout is set up.'],
                ['Chat & earn', 'Viewers tip $1–$100 in tier colors (blue → red). 85% lands in your monthly payout.'],
              ],
              cta: { label: 'Live guide →', action: () => onNav('livehelp') },
            },
          ].map(card => (
            <div key={card.eyebrow} style={{
              padding: 30, border: '1px solid var(--line-strong)', borderRadius: 6,
              background: 'var(--forest-900)', display: 'flex', flexDirection: 'column',
            }}>
              <div className="eyebrow" style={{ color: card.accent, marginBottom: 10 }}>{card.eyebrow}</div>
              <h2 style={{ fontSize: 22, marginBottom: 22, letterSpacing: '-0.01em' }}>{card.title}</h2>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16, padding: 0, marginBottom: 22, flex: 1 }}>
                {card.steps.map(([k, v], i) => (
                  <li key={k} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12 }}>
                    <span className="mono" style={{
                      width: 28, height: 28, borderRadius: 14,
                      border: '1px solid ' + card.accent, color: card.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: 'var(--bone)' }}>{k}</div>
                      <div style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.55 }}>{v}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <button onClick={card.cta.action} className="btn secondary" style={{ alignSelf: 'flex-start', fontSize: 14 }}>{card.cta.label}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Revenue split visual ───────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10, textAlign: 'center' }}>HOW EVERY DOLLAR IS SPLIT</div>
        <h2 style={{ fontSize: 30, textAlign: 'center', marginBottom: 30 }}>Same split for clips and live tips.</h2>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line-strong)', height: 96, marginBottom: 14 }}>
          <div style={{ flex: 70, background: 'var(--amber)', color: '#1a2820', padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', opacity: 0.8 }}>PILOT EARNS</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)' }}>85%</div>
          </div>
          <div style={{ flex: 30, background: 'var(--forest-700)', padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>PLATFORM FEE</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--bone)' }}>15%</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          The 30% covers payment processing (~3%), storage &amp; CDN bandwidth, DMCA &amp; permit verification, fraud screening, customer support, and platform development. No hidden tiers, no volume cliffs, no "exclusive" carve-outs. Live broadcasts use the same split for Super Chat tips.
        </p>
      </section>

      {/* ───────────── Marketplace earnings calculator ───────────── */}
      <section style={{ background: 'var(--forest-900)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>MARKETPLACE CALCULATOR</div>
          <h2 style={{ fontSize: 30, marginBottom: 24 }}>What could you earn from clip licensing?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, alignItems: 'start' }}>
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, color: 'var(--parchment)' }}>Average license price</label>
                  <span className="mono" style={{ color: 'var(--amber)' }}>{fmt(price)}</span>
                </div>
                <input type="range" min={1} max={199} step={1} value={price}
                  onChange={e => setPrice(Number(e.target.value))} style={{ width: '100%', accentColor: '#e8b04a' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }} className="mono">
                  <span>$1 (Personal)</span><span>$199 (Extended)</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, color: 'var(--parchment)' }}>Licenses sold per month</label>
                  <span className="mono" style={{ color: 'var(--amber)' }}>{licensesPerMonth}</span>
                </div>
                <input type="range" min={1} max={200} step={1} value={licensesPerMonth}
                  onChange={e => setLicensesPerMonth(Number(e.target.value))} style={{ width: '100%', accentColor: '#e8b04a' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }} className="mono">
                  <span>1</span><span>200</span>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--forest-800)', border: '1px solid var(--line-strong)', borderRadius: 6, padding: 26 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>EVERY MONTH YOU EARN</div>
              <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(marketplaceMonthlyEarn)}</div>
              <div style={{ height: 1, background: 'var(--line)', margin: '20px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <Mini label="GROSS / MO"     value={fmt(marketplaceMonthlyGross)}/>
                <Mini label="PLATFORM FEE"   value={fmt(marketplaceMonthlyFee)}/>
                <Mini label="YEARLY EARNINGS" value={fmt(marketplaceAnnualEarn)}/>
                <Mini label="PAYOUT THRESHOLD" value="$20"/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 16, lineHeight: 1.5 }}>
                Estimates pre-tax. Actual earnings depend on demand, license-tier mix, and currency conversion.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Live Super Chat tiers ───────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--sunset)' }}>● LIVE BROADCASTING · SUPER CHAT</div>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>Tip tiers — viewer-set, color-coded, pinned.</h2>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 24, maxWidth: 720 }}>
          During your live broadcast, viewers can send tips of $1–$100. Each tier is colored and pinned for a duration — same UX as YouTube Super Chat, with the same 70 / 30 split. You must complete payout setup once to enable monetization.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 18 }}>
          {SUPER_TIERS.map(t => (
            <div key={t.label} style={{ background: t.color, color: t.text, padding: '14px 10px', borderRadius: 4, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', opacity: 0.85, marginBottom: 4 }}>{t.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(t.amount)}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>pin {t.pin}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--parchment-dim)' }}>
          <div>Pilot keeps <strong style={{ color: 'var(--amber)' }}>70%</strong> · platform fee <strong>30%</strong> · payout monthly to PayPal once balance ≥ $50.</div>
          <button onClick={() => onNav('livehelp')} className="btn secondary" style={{ fontSize: 14 }}>How live works →</button>
        </div>
      </section>

      {/* ───────────── Live earnings calculator ───────────── */}
      <section style={{ background: 'var(--forest-900)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--sunset)' }}>LIVE CALCULATOR</div>
          <h2 style={{ fontSize: 30, marginBottom: 24 }}>What could you earn from streaming?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, alignItems: 'start' }}>
            <div>
              <Range label="Average Super Chat amount" value={scAvg} suffix=" USD" min={1} max={100} onChange={setScAvg}/>
              <Range label="Super Chats per stream"     value={scPerStream}    min={1} max={100} onChange={setScPerStream}/>
              <Range label="Streams per month"          value={streamsPerMonth} min={1} max={30}  onChange={setStreamsPerMonth}/>
            </div>
            <div style={{ background: 'var(--forest-800)', border: '1px solid var(--line-strong)', borderRadius: 6, padding: 26 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>EVERY MONTH YOU EARN</div>
              <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sunset)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(liveMonthlyEarn)}</div>
              <div style={{ height: 1, background: 'var(--line)', margin: '20px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <Mini label="GROSS / MO"      value={fmt(liveMonthlyGross)}/>
                <Mini label="PLATFORM FEE"    value={fmt(liveMonthlyFee)}/>
                <Mini label="YEARLY EARNINGS" value={fmt(liveAnnualEarn)}/>
                <Mini label="PAYOUT THRESHOLD" value="$50"/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 16, lineHeight: 1.5 }}>
                Live and marketplace earnings combine into one monthly payout. Big streams with multiple Red ($100) tippers can clear the threshold in a single broadcast.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── License tiers ───────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>LICENSE TIERS · PER CLIP</div>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>Every clip, five ways to license.</h2>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 24, maxWidth: 720 }}>
          Pilots toggle which tiers their clip is sold under, and set a price for each. Buyers pick the tier that matches their use case. The 70 / 30 split applies to every tier — no preferential rates, no exclusivity surcharges.
        </p>
        <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', background: 'var(--forest-900)', borderBottom: '1px solid var(--line-strong)' }}>
            {['', 'Free · CC-BY', 'Personal', 'Commercial', 'Extended', 'Exclusive'].map((h, i) => (
              <div key={i} className="mono" style={{ padding: '14px 12px', fontSize: 12, letterSpacing: '0.14em', color: i === 0 ? 'transparent' : (i === 5 ? 'var(--amber)' : 'var(--parchment-dim)'), fontWeight: 600 }}>{h}</div>
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
                <div key={j} style={{ padding: '14px 12px', fontSize: 14, color: j === 0 ? 'var(--parchment)' : 'var(--bone)', fontWeight: j === 0 ? 400 : 500 }}>
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
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>Predictable. Monthly. Combined.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['When', 'Monthly', 'Marketplace: 1st of every month. Live Super Chat: 28th of every month.'],
              ['Threshold', '$20 · $50', 'Marketplace clears at $20, Super Chat at $50. Below threshold rolls forward.'],
              ['Methods', 'Wise · PayPal', 'Stripe Connect for US/EU, Wise multi-currency, PayPal worldwide. Live tips → PayPal email on file.'],
              ['Fees we absorb', '0%', 'Payout transfer fees come out of our 15% — never the pilot\u2019s 70%.'],
            ].map(([k, big, sub]) => (
              <div key={k} className="di-card" style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 6 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--amber)', marginBottom: 8 }}>{big}</div>
                <div style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.55 }}>{sub}</div>
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
             'No. Drone Icarus is purely transactional. Buyers pay only when they license a clip; viewers tip only when they want to. Pilots pay nothing to upload, store, list, or stream. Our 30% commission is the entire business model.'],
            ['Do verified pilots get a better split?',
             'No. Verification gets you a badge, priority placement on the map and in search, and access to commission requests — but the 70 / 30 split is identical for every pilot, every clip, every Super Chat.'],
            ['Who sets the clip price?',
             'You do. When you upload, you toggle which license tiers your clip is sold under and set a price for each. Suggested ranges are shown but you have full control. You can change prices anytime; existing licenses keep the price they were sold at.'],
            ['Who sets the Super Chat amount?',
             'The viewer chooses from 7 fixed tiers ($1, $2, $5, $10, $20, $50, $100). Each tier has a color and pin duration so the bigger tips stand out. You don\u2019t set tip amounts — but you keep 70% of every tier.'],
            ['What does "royalty free" mean here?',
             'Once a buyer licenses a clip under a tier, they can use it for the scope that tier covers (organic social, paid ads, broadcast, etc.) without paying per play or per impression. They paid you once; they reuse within scope.'],
            ['Can I sell exclusively to one buyer?',
             'Yes. Toggle the Exclusive tier on your clip and set the price. Once sold, the clip is removed from the catalog and the buyer owns sole license. You still keep 70%.'],
            ['Do I need a paid plan to go live?',
             'No. Anyone signed in can broadcast for free. Super Chat tipping is opt-in and only available after you complete the one-time payout profile (PayPal email + legal name + country + accept terms).'],
            ['Why does droneicarus mirror YouTube instead of streaming directly?',
             'YouTube\u2019s infrastructure handles transcoding, CDN, and adaptive bitrate at no cost. Building this ourselves would add $50–300 per active streamer per month — you\u2019d eventually pay for it. We focus on what makes droneicarus unique: drone-pilot community, location-aware discovery, and direct viewer-to-pilot tipping.'],
            ['Are Super Chat tips refundable?',
             'Yes — viewers can request a refund within 24 hours via PayPal. Refunded tips are deducted from your pending balance.'],
            ['What if a clip is taken down after sale?',
             'Buyer is fully refunded. The pilot is not charged the 15% — only paid out on completed sales. Chain-of-custody metadata makes this rare; repeat takedown offenders are removed from the platform.'],
            ['Can I combine marketplace clips and live broadcasting?',
             'Absolutely — same account, same payout profile. Many pilots do live exploratory flights to find shots, then sell the master cuts as licensed clips.'],
            ['What about taxes?',
             'You\u2019re responsible for declaring your earnings in your jurisdiction. We provide a monthly statement (CSV + PDF) showing every sale, tip, and the 70% you received. Local VAT/GST is collected from buyers where applicable and remitted by us.'],
          ].map(([q, a]) => (
            <div key={q}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{q}</h3>
              <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.65 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div>
      <div className="mono" style={{ color: 'var(--parchment-dim)', fontSize: 12, letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Range({ label, value, suffix = '', min, max, onChange }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 14, color: 'var(--parchment)' }}>{label}</label>
        <span className="mono" style={{ color: 'var(--sunset)' }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#d97045' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }} className="mono">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}
