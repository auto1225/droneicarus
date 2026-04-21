// pages/pricing.jsx — credits, subscriptions, enterprise

function PricingPage({ onNav }) {
  const [billing, setBilling] = React.useState('monthly');

  return (
    <div>
      <section style={{ padding: '80px 28px 50px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>PRICING · SIMPLE, BY THE CLIP OR BY THE MONTH</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 76, letterSpacing: '-0.035em', fontWeight: 500, lineHeight: 1, marginBottom: 18 }}>
          Pay only for the shots you actually use.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--parchment)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Every clip is priced by the pilot. Buy individual licenses, save with credits, or subscribe for teams.
        </p>
        <div style={{ display: 'inline-flex', gap: 4, border: '1px solid var(--line-strong)', borderRadius: 3, padding: 3, background: 'var(--forest-900)' }}>
          {['monthly','annual'].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '8px 18px', fontSize: 13, borderRadius: 2,
              background: billing === b ? 'var(--forest-700)' : 'transparent',
              color: billing === b ? 'var(--bone)' : 'var(--parchment-dim)',
            }}>{b === 'monthly' ? 'Monthly' : 'Annual · save 20%'}</button>
          ))}
        </div>
      </section>

      {/* Three tiers */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '50px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            {
              name: 'Pay-as-you-go',
              sub: 'No subscription. Ever.',
              price: '$0',
              unit: '+ per-clip license',
              cta: 'Browse the map',
              action: () => onNav('home'),
              perks: [
                'Buy any clip, any time',
                'All free CC-BY clips included',
                'Cart & wishlist',
                'Orders stored forever',
                'No subscription lock-in',
              ],
              note: 'Best for occasional projects · avg clip $18',
            },
            {
              name: 'Credits',
              sub: 'For regular buyers',
              price: billing === 'monthly' ? '$49' : '$39',
              unit: '/ month · 10 credits',
              cta: 'Start with credits',
              action: () => onNav('signin'),
              perks: [
                '10 credits per month · rollover up to 30',
                '1 credit = any clip up to $29',
                '2 credits = any clip up to $69',
                'Team seats at cost',
                'Priority support · 6h SLA',
              ],
              note: 'Credits never expire while subscribed',
              featured: true,
            },
            {
              name: 'Studio',
              sub: 'Teams & agencies',
              price: billing === 'monthly' ? '$299' : '$239',
              unit: '/ month · unlimited seats',
              cta: 'Talk to us',
              action: () => onNav('signin'),
              perks: [
                'Unlimited standard downloads',
                'Shared team library & approvals',
                'Multi-territory commercial license',
                'SAML SSO + SCIM provisioning',
                'Custom watermarks · white-label API',
                'Dedicated licensing manager',
              ],
              note: 'Exclusive buyouts & broadcast negotiated directly',
            },
          ].map(p => (
            <div key={p.name} style={{
              padding: 28, border: '1px solid ' + (p.featured ? 'var(--amber)' : 'var(--line)'),
              borderRadius: 4, background: p.featured ? 'rgba(232,176,74,0.04)' : 'transparent',
              position: 'relative', display: 'flex', flexDirection: 'column',
            }}>
              {p.featured && <span style={{ position: 'absolute', top: -10, left: 24, padding: '3px 10px', background: 'var(--amber)', color: '#1a2820', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: 2 }}>MOST POPULAR</span>}
              <div className="eyebrow" style={{ marginBottom: 8, color: p.featured ? 'var(--amber)' : 'var(--parchment-dim)' }}>{p.name.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 16 }}>{p.sub}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 46, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em' }}>{p.price}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 22 }}>{p.unit}</div>
              <button onClick={p.action} className={'btn ' + (p.featured ? '' : 'secondary')} style={{ fontSize: 13, marginBottom: 20 }}>{p.cta}</button>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {p.perks.map(per => (
                  <li key={per} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--parchment)' }}>
                    <span style={{ color: 'var(--lichen)', marginTop: 2, flexShrink: 0 }}><Ic.check/></span>
                    <span>{per}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--parchment-dim)', fontStyle: 'italic' }}>{p.note}</div>
            </div>
          ))}
        </div>

        {/* License tier comparison */}
        <div style={{ marginTop: 60 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>LICENSE TIERS · WHAT THEY COVER</div>
          <h2 style={{ fontSize: 30, marginBottom: 24 }}>Every clip, five ways to license.</h2>
          <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', background: 'var(--forest-900)', borderBottom: '1px solid var(--line-strong)' }}>
              {['', 'Free · CC-BY', 'Personal', 'Commercial 1yr', 'Extended', 'Exclusive'].map((h, i) => (
                <div key={i} className="mono" style={{ padding: '14px 12px', fontSize: 10, letterSpacing: '0.14em', color: i === 0 ? 'transparent' : (i === 5 ? 'var(--amber)' : 'var(--parchment-dim)'), fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {[
              ['Use in personal projects', true, true, true, true, true],
              ['Social media (organic)', true, true, true, true, true],
              ['Paid social / ads', false, false, true, true, true],
              ['Broadcast / OTT', false, false, false, true, true],
              ['Resale as stock footage', false, false, false, false, true],
              ['Remove from catalog', false, false, false, false, true],
              ['Attribution required', true, false, false, false, false],
              ['Typical price', '—', '$4–9', '$18–49', '$99+', 'By quote'],
              ['Max territories', '—', '1', '1', 'Worldwide', 'Worldwide'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                {row.map((cell, j) => (
                  <div key={j} style={{ padding: '14px 12px', fontSize: 13, color: j === 0 ? 'var(--parchment)' : 'var(--bone)', fontWeight: j === 0 ? 400 : 500 }}>
                    {cell === true ? <span style={{ color: 'var(--lichen)' }}><Ic.check/></span>
                     : cell === false ? <span style={{ color: 'var(--parchment-dim)' }}>—</span>
                     : <span className={typeof cell === 'string' && (cell.startsWith('$') || cell.includes('quote')) ? 'mono' : ''} style={{ fontSize: typeof cell === 'string' && cell.startsWith('$') ? 12 : 13 }}>{cell}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise */}
        <div style={{ marginTop: 50, padding: 40, border: '1px solid var(--line-strong)', borderRadius: 4, background: 'var(--forest-900)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>ENTERPRISE & BROADCASTERS</div>
            <h2 style={{ fontSize: 32, marginBottom: 12 }}>Have a blanket license need?</h2>
            <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.6, marginBottom: 18 }}>
              Netflix, National Geographic, and Orange-scale studios license in volume with custom indemnification, source file delivery, and guaranteed pilot response times. We handle the paperwork.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn">Contact licensing</button>
              <button className="btn secondary">Download rate card (PDF)</button>
            </div>
          </div>
          <div>
            {[
              ['Volume licensing', '10-clip, 50-clip, 250-clip bundles'],
              ['Source delivery', 'ProRes 422 HQ · RAW · LUTs'],
              ['Indemnification', 'Full legal coverage up to $5M'],
              ['SLA', 'Dedicated manager · 2h response'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: 12, gap: 14 }}>
                <span className="mono" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>{k}</span>
                <span style={{ color: 'var(--parchment)', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 28, marginBottom: 22 }}>Common questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            {[
              ['What do I actually download?', 'The pilot\'s delivery tier: up to ProRes 422 HQ master, plus a graded mp4 in Rec.709. 4K standard, 5.1K+ on verified clips. Preview is watermarked 1280p; original removes watermark within seconds of purchase.'],
              ['Does "royalty free" mean free?', 'No. It means you pay once and then reuse the clip as many times as your license covers — without paying per play. Commercial and broadcast tiers exist for different distribution scopes.'],
              ['Can I commission a specific shot?', 'Yes. Send a brief with location, time, mood, and deliverables. Any verified pilot can accept. Funds held in escrow, released after you approve the delivery.'],
              ['What if my clip is flagged after purchase?', 'Full refund, and we remove the clip from the catalog. Chain-of-custody metadata on every clip makes this extremely rare — but it\'s a real promise.'],
            ].map(([q, a]) => (
              <div key={q}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{q}</h3>
                <p style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.65 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { PricingPage });
