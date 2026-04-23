// pages/static.jsx — guidelines, legal, 404
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useContent } from '../content/ContentContext';

export function GuidelinesPage({ onNav }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 28px 80px' }}>
      <button onClick={() => onNav('home')} style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 18 }}>← Back to map</button>
      <div className="eyebrow" style={{ marginBottom: 10 }}>CODE OF AERIAL CONDUCT · V4.2</div>
      <h1 style={{ fontSize: 52, letterSpacing: '-0.02em', marginBottom: 12, fontFamily: 'var(--font-display)' }}>Fly with care.</h1>
      <p style={{ fontSize: 18, color: 'var(--parchment)', lineHeight: 1.5, marginBottom: 40, maxWidth: 720 }}>
        Drone Icarus exists because the world looks better from above — but only if pilots fly legally, respectfully, and safely. These are the rules every pilot agrees to when verifying.
      </p>

      {[
        ['01', 'Airspace before art.', 'Always check airspace restrictions, NOTAMs, and local permits before flying. If a zone is restricted, don\'t post the clip — even "just the good part". We remove clips found to violate civil aviation law.'],
        ['02', 'Altitude, distance, people.', 'Default max: 120m (400ft) AGL. Stay 30m+ from non-consenting people, 5km from airports. Lower limits may apply — your country\'s rules always supersede ours.'],
        ['03', 'Privacy is not a backdrop.', 'No filming into windows. No identifiable faces without release. No live-tracking individuals. Private property requires the owner\'s written consent.'],
        ['04', 'Protected places.', 'UNESCO sites, national parks, places of worship, military installations: assume no-fly unless you hold an explicit permit. When in doubt, call the ranger.'],
        ['05', 'Wildlife first.', 'Never pursue, startle, or circle animals. If your drone is changing behavior, you\'re too close. Breeding seasons = ground the aircraft.'],
        ['06', 'Weather is not a suggestion.', 'Don\'t fly in conditions the manufacturer doesn\'t rate for. A lost drone in a reservoir is an ecological incident — and a bill.'],
        ['07', 'Disclose everything.', 'License terms, flight metadata, edits, composites, AI-generated or upscaled content: label it honestly. Buyers are paying for provenance.'],
        ['08', 'Zero tolerance.', 'No reckless flight. No unauthorized commercial operation. No deepfake sale. No trafficking another pilot\'s clip. Violations = instant permanent ban and referral to the appropriate authority.'],
      ].map(([n, t, d]) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 30, padding: '26px 0', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 40, fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--amber)', letterSpacing: '-0.02em' }}>{n}</div>
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 8, letterSpacing: '-0.01em' }}>{t}</h3>
            <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.7 }}>{d}</p>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 40, padding: 24, border: '1px solid var(--amber)', borderRadius: 4, background: 'rgba(232,176,74,0.06)' }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--amber)' }}>REPORT A VIOLATION</div>
        <p style={{ fontSize: 14, color: 'var(--parchment)', marginBottom: 14 }}>Saw a clip that breaks these rules? Flagged clips are reviewed within 12 hours by our trust team — a real human, not a classifier.</p>
        <button className="btn" style={{ fontSize: 14 }} data-placeholder="true">Open a report</button>
      </div>
    </div>
  );
}

export function NotFoundPage({ onNav }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 62px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40, position: 'relative', overflow: 'hidden',
    }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <g stroke="var(--parchment)" fill="none" strokeWidth="0.6">
          {[...Array(30)].map((_, i) => (
            <path key={i} d={`M0 ${30*i} Q400 ${30*i-20} 800 ${30*i+20} T1600 ${30*i-10}`}/>
          ))}
        </g>
      </svg>
      <div style={{ textAlign: 'center', maxWidth: 560, position: 'relative' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.24em', color: 'var(--amber)', marginBottom: 18 }}>{useContent('static.404.eyebrow', '● SIGNAL LOST · 404')}</div>
        <h1 style={{ fontSize: 88, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
          {useContent('static.404.title', 'Off the map.')}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--parchment)', lineHeight: 1.6, marginBottom: 28 }}>
          {useContent('static.404.sub', "This page isn't in the flight log. It may have been removed, re-tagged, or it never existed. Let's get you back in range.")}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => onNav('home')} className="btn">{useContent('static.404.btn.home', 'Return to map')}</button>
          <button onClick={() => onNav('explore')} className="btn secondary">{useContent('static.404.btn.shots', 'Browse trending')}</button>
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', letterSpacing: '0.14em', marginTop: 40 }}>
          LAST KNOWN WAYPOINT · 00°00′00″ N · 000°00′00″ E
        </div>
      </div>
    </div>
  );
}

export function LegalPage({ onNav }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '60px 28px 80px' }}>
      <button onClick={() => onNav('home')} style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 18 }}>← Back</button>
      <div className="eyebrow" style={{ marginBottom: 10 }}>LEGAL · LAST UPDATED APR 10, 2026</div>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Terms & Licensing</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32 }}>
        <nav style={{ position: 'sticky', top: 82, alignSelf: 'start' }}>
          {['Overview', 'Licenses explained', 'Revenue split', 'Takedowns', 'Data & privacy', 'Contact'].map((s, i) => (
            <a key={s} style={{ display: 'block', padding: '7px 0', fontSize: 14, color: i === 0 ? 'var(--bone)' : 'var(--parchment-dim)' }}>{s}</a>
          ))}
        </nav>
        <article style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--parchment)' }}>
          <h2 style={{ fontSize: 22, color: 'var(--bone)', marginBottom: 10 }}>Overview</h2>
          <p style={{ marginBottom: 18 }}>Drone Icarus is a marketplace connecting aerial pilots with viewers, editors, and studios. Pilots retain ownership of their footage. We take a platform fee and handle distribution, licensing, and payouts.</p>

          <h2 style={{ fontSize: 22, color: 'var(--bone)', marginBottom: 10, marginTop: 28 }}>Licenses explained</h2>
          <div style={{ border: '1px solid var(--line)', borderRadius: 4, marginBottom: 18 }}>
            {[
              ['Free · CC-BY', 'Stream anywhere. Attribution required for reuse.', '—'],
              ['Personal', 'Non-commercial projects, school, social posts.', '$4–9'],
              ['Commercial · 1yr', 'Ads, brand films, paid social, one territory.', '$18–49'],
              ['Extended', 'Multi-territory, broadcast, OTT, resellable stock.', '$99+'],
              ['Exclusive', 'One buyer. Clip is removed from catalog.', 'By quote'],
            ].map(([n, d, p], i) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: 14, padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
                <strong style={{ fontSize: 14 }}>{n}</strong>
                <span style={{ fontSize: 14, color: 'var(--parchment)' }}>{d}</span>
                <span className="mono" style={{ fontSize: 14, textAlign: 'right', color: 'var(--amber)' }}>{p}</span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 22, color: 'var(--bone)', marginBottom: 10, marginTop: 28 }}>Revenue split</h2>
          <p style={{ marginBottom: 8 }}>Every sale is split the same way: <strong>70%</strong> to the pilot, <strong>30%</strong> to Drone Icarus. No tiered rates, no exclusivity surcharges, no volume discounts.</p>
          <p style={{ marginBottom: 18 }}>The 30% covers payment processing, hosting &amp; CDN bandwidth, DMCA and permit verification, fraud screening, customer support, and ongoing platform development. We absorb payout transfer fees — the 70% is what lands in the pilot's account.</p>

          <h2 style={{ fontSize: 22, color: 'var(--bone)', marginBottom: 10, marginTop: 28 }}>Takedowns</h2>
          <p style={{ marginBottom: 18 }}>If you find your likeness, property, or intellectual property in a clip and did not consent, file a takedown request. We honor valid requests within 24 hours. Repeat offenders are permanently banned.</p>
        </article>
      </div>
    </div>
  );
}

