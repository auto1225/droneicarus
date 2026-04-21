// pages/messages.jsx — DM inbox + thread
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { thumbGradient, COLLECTIONS } from '../data';
const mUseState = useState;

const THREADS = [
  { id: 't1', name: 'Marta L.', handle: '@marta.nomad', role: 'Creative Director, Nomad Co.', last: 'Perfect — sending the invoice tonight.', time: '11:42', unread: 2, online: true },
  { id: 't2', name: 'Kenji R.', handle: '@kenji.cuts', role: 'Documentary editor', last: 'Do you have a vertical crop of this?', time: '09:18', unread: 0, online: true },
  { id: 't3', name: 'Adaeze O.', handle: '@adaeze.motion', role: 'Motion designer', last: 'Sent over the LUT — let me know if it breaks.', time: 'Yesterday', unread: 0 },
  { id: 't4', name: 'Drone Icarus Team', handle: '@icarus.ops', role: 'Support', last: 'Your Tier 2 verification was approved.', time: '2d', unread: 1, system: true },
  { id: 't5', name: 'Ben H.', handle: '@ben.films', role: 'Freelance filmmaker', last: 'Commissioning you for a 4-day shoot in Busan.', time: '4d', unread: 0 },
  { id: 't6', name: 'Ria S.', handle: '@ria.studio', role: 'Agency — Seoul', last: 'Thanks. Will circle back Monday.', time: '1w', unread: 0 },
];

export function MessagesPage({ onNav }) {
  const [active, setActive] = mUseState(THREADS[0]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 320px', minHeight: 'calc(100vh - 62px)' }}>
      {/* Threads list */}
      <aside style={{ borderRight: '1px solid var(--line)', background: 'var(--forest-950)', overflow: 'auto' }}>
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>INBOX · 6</div>
          <input placeholder="Search messages…" style={{ width: '100%', padding: '8px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 13, borderRadius: 3, outline: 'none' }}/>
        </div>
        {THREADS.map(t => (
          <button key={t.id} onClick={() => setActive(t)} style={{
            display: 'block', width: '100%', padding: '14px 22px', textAlign: 'left',
            borderBottom: '1px solid var(--line)',
            background: active.id === t.id ? 'var(--forest-800)' : 'transparent',
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.system ? 'var(--amber)' : 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{t.name[0]}</div>
                {t.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--lichen)', border: '2px solid var(--forest-950)' }}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>{t.time}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.last}</div>
              </div>
              {t.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sunset)', color: '#faf6ec', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>{t.unread}</div>}
            </div>
          </button>
        ))}
      </aside>

      {/* Thread */}
      <main style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{active.name}</div>
            <div style={{ fontSize: 11, color: active.online ? 'var(--lichen)' : 'var(--parchment-dim)' }}>{active.online ? '● Active now' : 'Last seen ' + active.time}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn secondary" style={{ fontSize: 12 }}>View profile</button>
            <button className="btn secondary" style={{ fontSize: 12 }}>Commission brief</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { from: 'them', t: 'Hey — licensing the Namsan sunrise clip for a Nomad Co. spot. Can you confirm commercial use is cleared for Asian broadcast?' },
            { from: 'them', t: "Also: do you shoot 6K ProRes by default, or is that the D-Log M upscale?" },
            { from: 'me', t: 'Confirmed. Commercial is clean across all Asia — KCAA approved the location and it\'s in the permit I have on file.' },
            { from: 'me', t: 'Native is 5.1K ProRes 422 HQ. D-Log M → Rec.709 via my custom LUT. I can send the RAW if you want to grade from scratch.' },
            { from: 'them', t: 'Perfect — sending the invoice tonight.' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '68%', padding: '10px 14px', borderRadius: 10,
                background: m.from === 'me' ? 'var(--sunset)' : 'var(--forest-900)',
                color: m.from === 'me' ? '#faf6ec' : 'var(--bone)',
                fontSize: 14, lineHeight: 1.5,
                border: m.from === 'me' ? 'none' : '1px solid var(--line)',
              }}>{m.t}</div>
            </div>
          ))}
          <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', textAlign: 'center', letterSpacing: '0.1em', marginTop: 8 }}>11:42 · READ</div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea placeholder="Write a reply…" style={{ flex: 1, minHeight: 56, padding: 12, background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 14, borderRadius: 4, resize: 'none', outline: 'none', fontFamily: 'inherit' }}/>
            <button className="btn" style={{ fontSize: 13 }}>Send</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 8 }}>Attach a clip, send a preview link, or start a commission brief.</div>
        </div>
      </main>

      {/* Context rail */}
      <aside style={{ borderLeft: '1px solid var(--line)', padding: 22, background: 'var(--forest-950)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>CLIP REFERENCED</div>
        <div style={{ aspectRatio: '16/9', background: thumbGradient(4), borderRadius: 3, marginBottom: 10 }}/>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Namsan Tower — Dawn Ascent</div>
        <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 16 }}>4K · $24 commercial · 0:42</div>

        <div className="eyebrow" style={{ marginBottom: 10, marginTop: 24 }}>PINNED FILES</div>
        {['Commercial-license-v2.pdf', 'KCAA-permit-namsan.pdf', 'LUT-hyunwoo-rec709.cube'].map(f => (
          <div key={f} style={{ padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
            <button style={{ fontSize: 11, color: 'var(--sunset)' }}>open</button>
          </div>
        ))}

        <div className="eyebrow" style={{ marginBottom: 10, marginTop: 24 }}>SHARED COLLECTIONS</div>
        <div style={{ fontSize: 12, color: 'var(--parchment)', lineHeight: 1.6 }}>3 boards · 42 clips</div>
      </aside>
    </div>
  );
}

