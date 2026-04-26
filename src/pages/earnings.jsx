// pages/earnings.jsx — Creator earnings dashboard
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS, thumbGradient, CURRENT_USER, PAYOUTS } from '../data';
import { Ic } from '../components';
import { fetchPayouts } from '../db/commerce';
import { useAuth } from '../auth/AuthContext';
const eUseState = useState;

export function EarningsPage({ onNav }) {
  const [period, setPeriod] = eUseState('30d');
  const [payouts, setPayouts] = eUseState(PAYOUTS || []);
  useEffect(() => {
    fetchPayouts().then(rows => { if (rows && rows.length) setPayouts(rows); });
  }, []);
  const myVids = VIDEOS.filter(v => v.price > 0).slice(0, 6);
  const lifetime = 0;
  const pending = 0;
  const thisMonth = 0;
  const avgPerClip = 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 62px)' }}>
      <SidebarPilot active="Earnings" onNav={onNav}/>

      <main style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>EARNINGS</div>
            <h1 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>You've earned ${lifetime.toLocaleString()} flying.</h1>
            <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginTop: 6 }}>Payouts run on the 28th. Next deposit in 11 days · routing to <span className="mono" style={{ color: 'var(--bone)' }}>KEB Hana •• 4821</span></p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d', '30d', '90d', '1y', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={'chip' + (period === p ? ' active' : '')} style={{ fontSize: 12, padding: '5px 10px', textTransform: 'uppercase' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginBottom: 30, border: '1px solid var(--line)', borderRadius: 4 }}>
          {[
            ['This period', `$${thisMonth.toLocaleString()}`, '+23% vs prev', 'var(--lichen)'],
            ['Pending payout', `$${pending.toLocaleString()}`, 'Locked 48h', 'var(--amber)'],
            ['Avg / clip', `$${avgPerClip.toFixed(2)}`, '142 licenses', 'var(--parchment-dim)'],
            ['Lifetime', `$${lifetime.toLocaleString()}`, 'Since 2023', 'var(--parchment-dim)'],
          ].map(([k, v, note, color], i) => (
            <div key={k} style={{ padding: 22, borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 10 }}>{k}</div>
              <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: 12, color, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{note}</div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div style={{ padding: 24, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18 }}>Revenue · by tier</h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--sunset)' }}/>COMMERCIAL</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--amber)' }}/>PERSONAL</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--moss)' }}/>EXTENDED</span>
            </div>
          </div>
          <svg viewBox="0 0 800 220" style={{ width: '100%', height: 220 }}>
            {[40, 80, 120, 160, 200].map(y => <line key={y} x1="40" y1={y} x2="800" y2={y} stroke="var(--line)" strokeDasharray="2 3"/>)}
            {[0, 1, 2, 3, 4].map(i => <text key={i} x="8" y={44 + i*40} fill="var(--parchment-dim)" fontSize="10" fontFamily="var(--font-mono)">${(4 - i) * 250}</text>)}
            {/* Stacked bars */}
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 60 + i * 52;
              const c = 40 + Math.sin(i * 0.8) * 30 + Math.random() * 20;
              const p = 30 + Math.cos(i * 0.6) * 20 + Math.random() * 14;
              const ex = 14 + Math.sin(i * 1.2) * 8 + Math.random() * 8;
              let y = 200;
              return (
                <g key={i}>
                  <rect x={x} y={y - c} width="30" height={c} fill="var(--sunset)"/>
                  <rect x={x} y={y - c - p} width="30" height={p} fill="var(--amber)"/>
                  <rect x={x} y={y - c - p - ex} width="30" height={ex} fill="var(--moss)"/>
                </g>
              );
            })}
            {Array.from({ length: 14 }).map((_, i) => (
              <text key={i} x={75 + i*52} y="216" fill="var(--parchment-dim)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">{i*2 + 1}</text>
            ))}
          </svg>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
          {/* Top earners */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16 }}>Top earning clips</h3>
              <button style={{ fontSize: 14, color: 'var(--sunset)' }} data-placeholder="true">View all →</button>
            </div>
            {myVids.map((v, i) => (
              <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '30px 56px 1fr 90px 90px', gap: 12, padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>#{i+1}</span>
                <div style={{ aspectRatio: '16/9', background: thumbGradient(parseInt(v.id.slice(1))), borderRadius: 2 }}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{(v.views / 1000 | 0)} views · {Math.floor(v.likes / v.price * 0.3)} licenses</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber)' }}>${(v.price * 47 * 0.7).toFixed(0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>take-home</div>
                </div>
                <div style={{ width: 80, height: 24 }}>
                  <svg viewBox="0 0 80 24" style={{ width: '100%', height: '100%' }}>
                    <polyline points={Array.from({length:8}).map((_,k) => `${k*11},${20 - Math.sin(i + k) * 8 - k}`).join(' ')} fill="none" stroke="var(--lichen)" strokeWidth="1.5"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Payouts */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16 }}>Payout history</h3>
              <span className="mono" style={{ fontSize: 12, color: 'var(--lichen)', letterSpacing: '0.14em' }}>● STRIPE CONNECT</span>
            </div>
            {payouts.map((p, i) => (
              <div key={p.id || i} style={{ padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.period}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{p.method} · deposited {p.eta}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>${(p.net || 0).toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: p.status === 'paid' ? 'var(--lichen)' : 'var(--amber)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>● {p.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
              <button className="btn secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }} data-placeholder="true">Download 1099 / tax reports</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function SidebarPilot({ active, onNav }) {
  const { profile: _p } = useAuth(); const u = _p ? { id: _p.id, name: _p.display_name || _p.handle || 'Pilot', handle: _p.handle || '@you', initials: ((_p.display_name || _p.handle || 'P').split(/\s+/).map(s=>s[0]).join('').slice(0,2)).toUpperCase() } : { id: '', name: 'New pilot', handle: '@you', initials: 'NP' };
  return (
    <aside style={{ borderRight: '1px solid var(--line)', background: 'var(--forest-950)', padding: '30px 0' }}>
      <div style={{ padding: '0 24px', marginBottom: 30 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>PILOT CONSOLE</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--line-strong)' }}>{u.initials}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{u.name} <span style={{ color: 'var(--amber)' }}><Ic.check/></span></div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{u.handle}{u.id ? ' · Verified' : ''}</div>
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          ['Dashboard', 'creator'],
          ['My footage', 'creator'],
          ['Earnings', 'earnings'],
          ['Analytics', 'creator'],
          ['Licensing', 'creator'],
          ['Payouts', 'earnings'],
          ['Settings', 'settings'],
        ].map(([label, route]) => (
          <button key={label} onClick={() => onNav(route)} style={{
            padding: '11px 24px', textAlign: 'left',
            color: active === label ? 'var(--bone)' : 'var(--parchment-dim)',
            background: active === label ? 'var(--forest-800)' : 'transparent',
            borderLeft: active === label ? '3px solid var(--amber)' : '3px solid transparent',
            fontSize: 14,
          }}>{label}</button>
        ))}
      </nav>
    </aside>
  );
}

