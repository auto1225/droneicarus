// pages/my-streams.jsx — Pilot's own past + active live streams + Super Chat earnings
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/AuthContext';

export function MyStreamsPage({ onNav }) {
  const { user } = useAuth() || {};
  const [streams, setStreams] = useState([]);
  const [chats, setChats] = useState([]);  // super_chats summary
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.from('live_streams')
        .select('*').eq('pilot_id', user.id).order('created_at', { ascending: false }).limit(100);
      setStreams(s || []);
      // Super chats earned across all my streams
      const ids = (s || []).map(x => x.id);
      if (ids.length) {
        const { data: c } = await supabase.from('super_chats')
          .select('stream_id, amount_usd, pilot_share_usd, status, created_at')
          .in('stream_id', ids).eq('status', 'paid');
        setChats(c || []);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) {
    return <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h2>Sign in to see your streams</h2>
      <button onClick={() => onNav?.('signin')} style={{ marginTop: 16, padding: '10px 18px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Sign in</button>
    </div>;
  }
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading…</div>;

  const totalEarned = chats.reduce((sum, c) => sum + Number(c.pilot_share_usd || 0), 0);
  const platformFee = chats.reduce((sum, c) => sum + Number(c.amount_usd || 0) * 0.3, 0);
  const live = streams.filter(s => s.status === 'live');
  const ended = streams.filter(s => s.status === 'ended');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 10 }}>MY STREAMS</div>
      <h1 style={{ fontSize: 36, marginBottom: 24, letterSpacing: '-0.02em' }}>My broadcasts</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Stat label="Total streams" value={streams.length}/>
        <Stat label="Currently live" value={live.length} color="var(--sunset)"/>
        <Stat label="Super Chats received" value={chats.length}/>
        <Stat label="Earned (your 70%)" value={`$${totalEarned.toFixed(2)}`} color="var(--moss)"/>
      </div>

      {/* Live now */}
      {live.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14, color: 'var(--sunset)' }}>● Live now</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {live.map(s => <StreamRow key={s.id} s={s} chats={chats.filter(c => c.stream_id === s.id)} onNav={onNav}/>)}
          </div>
        </section>
      )}

      {/* Past streams */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Past streams ({ended.length})</h2>
        {ended.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: 'var(--parchment-dim)', border: '1px dashed var(--line)', borderRadius: 6 }}>
            No past streams yet. <button onClick={() => onNav?.('live')} style={{ background: 'transparent', border: 'none', color: 'var(--amber)', cursor: 'pointer', textDecoration: 'underline' }}>Start your first one →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {ended.map(s => <StreamRow key={s.id} s={s} chats={chats.filter(c => c.stream_id === s.id)} onNav={onNav}/>)}
          </div>
        )}
      </section>

      <div style={{ marginTop: 36, padding: 18, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12, color: 'var(--parchment-dim)' }}>
        Earnings settle to your PayPal monthly on the 28th once balance ≥ $50. Platform retains 30% (${platformFee.toFixed(2)} so far).
        <button onClick={() => onNav?.('settings')} style={{ marginLeft: 10, background: 'transparent', border: 'none', color: 'var(--amber)', cursor: 'pointer', textDecoration: 'underline' }}>Payout settings →</button>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'var(--bone)' }) {
  return (
    <div style={{ padding: 18, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function StreamRow({ s, chats, onNav }) {
  const earned = chats.reduce((sum, c) => sum + Number(c.pilot_share_usd || 0), 0);
  const date = (s.started_at || s.created_at || '').slice(0, 10);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 14, padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, alignItems: 'center' }}>
      <div style={{ width: 120, height: 68, background: 'var(--forest-950)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        {s.thumb_url && <img src={s.thumb_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
        {s.status === 'live' && <span style={{ position: 'absolute', top: 4, left: 4, padding: '2px 5px', background: 'var(--sunset)', color: '#fff', fontSize: 9, fontFamily: 'var(--font-mono)', borderRadius: 2 }}>LIVE</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
        <div style={{ fontSize: 11, color: 'var(--parchment-dim)', display: 'flex', gap: 12 }}>
          <span>{date}</span>
          <span>{s.embed_provider === 'youtube' ? 'YouTube mirror' : 'site'}</span>
          {s.monetization_enabled && <span style={{ color: 'var(--amber)' }}>$ Super Chat</span>}
          {chats.length > 0 && <span>{chats.length} tips</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {earned > 0 && <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--moss)' }}>${earned.toFixed(2)}</div>}
        <button onClick={() => onNav?.('live')} style={{ marginTop: 4, padding: '4px 10px', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>View</button>
      </div>
    </div>
  );
}
