// pages/notifications.jsx — notifications inbox

const { useState: nUseState } = React;

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

function NotificationsPage({ onNav }) {
  const [filter, setFilter] = nUseState('all');
  const filtered = filter === 'all' ? NOTIFS : filter === 'unread' ? NOTIFS.filter(n => n.unread) : NOTIFS.filter(n => n.kind === filter);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>INBOX</div>
          <h1 style={{ fontSize: 36 }}>Notifications</h1>
        </div>
        <button style={{ fontSize: 12, color: 'var(--sunset)' }}>Mark all as read</button>
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

Object.assign(window, { NotificationsPage });
