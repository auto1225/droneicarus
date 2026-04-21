// pages/notifications.jsx — notifications inbox
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchNotifications, markAllRead, markRead, subscribeNotifications } from '../db/notifications';
import { toast } from '../toast';
const nUseState = useState;

const NOTIFS = [
  { id: 'n1', kind: 'license', title: 'Marta L. licensed your clip', body: 'Namsan Tower — Dawn Ascent · Commercial · +$16.80', time: '12 min ago', unread: true, icon: '$' },
  { id: 'n2', kind: 'rank', title: 'You charted #3 in Rankings', body: 'Your clip "Han River — Blue Hour" climbed to #3 this week.', time: '2h ago', unread: true, icon: '↑' },
  { id: 'n3', kind: 'comment', title: 'Kenji R. commented', body: '"Stable, clean highlights, plenty of handles at the head & tail."', time: '5h ago', unread: false, icon: '"' },
  { id: 'n4', kind: 'follow', title: '14 new followers this week', body: 'Including Ria S., Ben H., and 12 others.', time: '1d ago', unread: false, icon: '+' },
  { id: 'n5', kind: 'system', title: 'Tier 2 verification approved', body: 'You now earn 85% per license and appear in priority search.', time: '2d ago', unread: false, icon: '✓' },
  { id: 'n6', kind: 'payout', title: 'Payout scheduled · $3,852.00', body: 'Depositing Apr 05, 2026 to Wise · USD.', time: '3d ago', unread: false, icon: '$' },
  { id: 'n7', kind: 'flight', title: 'New flight restriction near Gyeongbokgung', body: 'Temporary no-fly zone through Apr 22 for state visit.', time: '4d ago', unread: false, icon: '!' },
  { id: 'n8', kind: 'system', title: 'New reviewer badge: "Trusted voice"', body: '12 of your reviews were marked helpful by buyers.', time: '1w ago', unread: false, icon: '★' },
];

const KIND_COLOR = {
  license: 'var(--amber)', rank: 'var(--sunset)', comment: 'var(--moss)',
  follow: 'var(--lichen)', system: 'var(--sunset)', payout: 'var(--amber)', flight: '#c73e3e',
};

export function NotificationsPage({ onNav }) {
  const [filter, setFilter] = nUseState('all');
  const [rows, setRows] = nUseState(NOTIFS);

  // Load real notifications if Supabase data mode is on.
  useEffect(() => {
    let alive = true;
    fetchNotifications().then(data => {
      if (!alive || !data?.length) return;
      setRows(data.map(n => ({
        id: n.id,
        kind: n.kind || 'system',
        title: n.title,
        body: n.body || '',
        time: n.created_at ? humanAgo(n.created_at) : 'just now',
        unread: !n.read_at,
        icon: iconFor(n.kind),
        targetUrl: n.target_url,
      })));
    });
    const unsub = subscribeNotifications((fresh) => {
      setRows(cur => [{
        id: fresh.id, kind: fresh.kind, title: fresh.title, body: fresh.body || '',
        time: 'just now', unread: true, icon: iconFor(fresh.kind), targetUrl: fresh.target_url,
      }, ...cur]);
      toast?.(fresh.title, fresh.body);
    });
    return () => { alive = false; unsub?.(); };
  }, []);

  const filtered = filter === 'all' ? rows : filter === 'unread' ? rows.filter(n => n.unread) : rows.filter(n => n.kind === filter);

  const onMarkAll = async () => {
    await markAllRead();
    setRows(cur => cur.map(n => ({ ...n, unread: false })));
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>INBOX</div>
          <h1 style={{ fontSize: 36 }}>Notifications</h1>
        </div>
        <button onClick={onMarkAll} style={{ fontSize: 12, color: 'var(--sunset)' }}>Mark all as read</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all','All'],['unread','Unread · 2'],['license','Licenses'],['comment','Comments'],['follow','Followers'],['system','System'],['flight','Flight alerts']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={'chip' + (filter === k ? ' active' : '')} style={{ fontSize: 12 }}>{l}</button>
        ))}
      </div>

      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        {filtered.map((n, i) => (
          <div key={n.id} style={{
            padding: '16px 20px',
            borderTop: i > 0 ? '1px solid var(--line)' : 'none',
            background: n.unread ? 'var(--forest-900)' : 'transparent',
            display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: KIND_COLOR[n.kind], color: '#faf6ec',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}>{n.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                {n.title}
                {n.unread && <span style={{ marginLeft: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--sunset)', display: 'inline-block', verticalAlign: 'middle' }}/>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.5 }}>{n.body}</div>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{n.time}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 20, border: '1px dashed var(--line-strong)', borderRadius: 3, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>Reached the end · older notifications auto-archive after 90 days.</div>
        <button onClick={() => onNav('settings')} style={{ fontSize: 12, color: 'var(--sunset)' }}>Manage notification preferences →</button>
      </div>
    </div>
  );
}


function humanAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
}

function iconFor(kind) {
  return { license: '$', rank: '↑', comment: '"', follow: '+', system: '✓', payout: '$', flight: '!' }[kind] || '•';
}
