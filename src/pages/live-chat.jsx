// pages/live-chat.jsx — Realtime chat + Super Chat for the Live page
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/AuthContext';

// YouTube-style Super Chat color tiers (USD → tier)
export const SUPER_TIERS = [
  { min: 1,    max: 1.99,  color: '#1565c0', text: '#fff', label: 'Blue',   pinSec: 0   },
  { min: 2,    max: 4.99,  color: '#00b8d4', text: '#000', label: 'Lblue',  pinSec: 0   },
  { min: 5,    max: 9.99,  color: '#00bfa5', text: '#000', label: 'Green',  pinSec: 60  },
  { min: 10,   max: 19.99, color: '#ffca28', text: '#000', label: 'Yellow', pinSec: 120 },
  { min: 20,   max: 49.99, color: '#ff8f00', text: '#000', label: 'Orange', pinSec: 300 },
  { min: 50,   max: 99.99, color: '#e91e63', text: '#fff', label: 'Pink',   pinSec: 900 },
  { min: 100,  max: 9999,  color: '#d50000', text: '#fff', label: 'Red',    pinSec: 1800 },
];
export function tierFor(amount) {
  return SUPER_TIERS.find(t => amount >= t.min && amount <= t.max) || SUPER_TIERS[0];
}

// ─── Realtime chat panel ───────────────────────────────────────────────
export function LiveChatPanel({ streamId }) {
  const { user, profile } = useAuth() || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSuper, setShowSuper] = useState(false);
  const listRef = useRef(null);

  // Initial load + subscribe to inserts
  useEffect(() => {
    if (!streamId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(80);
      if (!cancelled) setMessages((data || []).reverse());
    })();
    const ch = supabase
      .channel(`chat:${streamId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `stream_id=eq.${streamId}` },
          payload => setMessages(m => [...m, payload.new].slice(-200)))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [streamId]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    const body = input.trim();
    if (!body || !user) return;
    setBusy(true);
    try {
      await supabase.from('live_chat_messages').insert({
        stream_id: streamId,
        user_id: user.id,
        username: profile?.handle || profile?.display_name || user.email?.split('@')[0],
        body,
      });
      setInput('');
    } catch (e) { console.warn('send chat err', e); }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 360 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>LIVE CHAT</div>
      <div ref={listRef} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {messages.length === 0 && <div style={{ color: 'var(--parchment-dim)', fontSize: 12, padding: 14, textAlign: 'center' }}>Chat is quiet — say hello.</div>}
        {messages.map(m => {
          if (m.is_super) {
            const t = tierFor(Number(m.super_amount_usd));
            return (
              <div key={m.id} style={{ background: t.color, color: t.text, padding: '8px 10px', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 2, opacity: 0.85 }}>@{m.username || 'guest'} · ${Number(m.super_amount_usd).toFixed(2)}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.body}</div>
              </div>
            );
          }
          return (
            <div key={m.id} style={{ fontSize: 12, lineHeight: 1.45 }}>
              <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>@{m.username || 'guest'}</span>
              <span style={{ color: 'var(--parchment)' }}>{m.body}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={user ? 'Say something…' : 'Sign in to chat'} disabled={!user || busy}
          style={{ flex: 1, padding: 9, background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 12, borderRadius: 3 }}/>
        <button onClick={() => setShowSuper(true)} disabled={!user}
          title="Send a Super Chat — pinned, color-highlighted, supports the pilot 70%"
          style={{ padding: '8px 10px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: 3, cursor: user ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 12 }}>
          $
        </button>
      </div>
      {showSuper && <SuperChatModal streamId={streamId} onClose={() => setShowSuper(false)}/>}
    </div>
  );
}

// ─── Super Chat modal — PayPal-driven 7:3 split ────────────────────────
const PRESETS = [1, 2, 5, 10, 20, 50, 100];

export function SuperChatModal({ streamId, onClose }) {
  const { user, profile } = useAuth() || {};
  const [amount, setAmount] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const tier = tierFor(Number(amount) || 1);
  const ppRef = useRef(null);

  // Render PayPal Smart Buttons once dialog opens
  useEffect(() => {
    if (!ppRef.current) return;
    if (!window.paypal) {
      // SDK should already be loaded by checkout flow; if not, lazy-add
      const sc = document.createElement('script');
      sc.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=USD';
      sc.onload = () => mountButtons();
      document.head.appendChild(sc);
      return () => sc.remove();
    }
    mountButtons();
    function mountButtons() {
      try {
        ppRef.current.innerHTML = '';
        window.paypal.Buttons({
          style: { layout: 'horizontal', tagline: false, height: 38 },
          createOrder: (data, actions) => actions.order.create({
            purchase_units: [{ amount: { value: Number(amount).toFixed(2) }, description: `Super Chat for stream ${streamId.slice(0,8)}` }]
          }),
          onApprove: async (data, actions) => {
            const cap = await actions.order.capture();
            await persistSuperChat(cap.id);
            onClose();
          },
          onError: (e) => { console.warn('paypal err', e); alert('Payment failed.'); },
        }).render(ppRef.current);
      } catch (e) { console.warn('mount err', e); }
    }
  }, [amount]);

  const persistSuperChat = async (paypalOrderId) => {
    setBusy(true);
    try {
      const amt = Number(amount);
      // Insert chat message first
      const { data: msg, error: e1 } = await supabase.from('live_chat_messages').insert({
        stream_id: streamId,
        user_id: user.id,
        username: profile?.handle || profile?.display_name || user.email?.split('@')[0],
        body: body || `(${tier.label} Super Chat)`,
        is_super: true,
        super_amount_usd: amt,
        super_color: tier.label.toLowerCase(),
        super_pin_seconds: tier.pinSec,
      }).select().single();
      if (e1) throw e1;
      // Then ledger row with 7:3 split
      await supabase.from('super_chats').insert({
        message_id: msg.id, stream_id: streamId, user_id: user.id,
        amount_usd: amt,
        pilot_share_usd: Number((amt * 0.7).toFixed(2)),
        platform_fee_usd: Number((amt * 0.3).toFixed(2)),
        paypal_order_id: paypalOrderId,
        status: 'paid',
      });
    } catch (e) { console.warn('persist super err', e); alert('Saved payment but failed to log message.'); }
    setBusy(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink)', padding: 24, borderRadius: 8, maxWidth: 420, width: '90%', border: '1px solid var(--line-strong)' }}>
        <div style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', marginBottom: 6 }}>SUPER CHAT</div>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Send a Super Chat</h3>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setAmount(p)}
              style={{ padding: '8px 12px', background: amount === p ? 'var(--amber)' : 'transparent', color: amount === p ? 'var(--ink)' : 'var(--bone)', border: '1px solid var(--line-strong)', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
              ${p}
            </button>
          ))}
        </div>
        <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Custom amount USD"
          style={{ width: '100%', padding: '10px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, marginBottom: 12, fontFamily: 'inherit' }}/>

        {/* Live preview */}
        <div style={{ background: tier.color, color: tier.text, padding: '12px 14px', borderRadius: 6, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4, opacity: 0.85 }}>@{profile?.handle || 'you'} · ${Number(amount || 0).toFixed(2)}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{body || `Your ${tier.label} message preview`}</div>
        </div>

        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Optional message (max 500 chars)" rows={2}
          maxLength={500}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, marginBottom: 12, fontFamily: 'inherit', fontSize: 13 }}/>

        <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 14 }}>
          70% goes directly to the pilot. 30% supports the platform.
          {tier.pinSec > 0 && <> Pinned for {tier.pinSec >= 60 ? Math.round(tier.pinSec/60) + ' min' : tier.pinSec + ' s'}.</>}
        </div>

        <div ref={ppRef} style={{ minHeight: 38 }}/>

        <button onClick={onClose} style={{ marginTop: 12, padding: '8px 14px', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
}
