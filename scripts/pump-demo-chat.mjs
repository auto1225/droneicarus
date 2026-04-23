// scripts/pump-demo-chat.mjs — push N fresh chat messages to the demo stream right now
const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }
const COUNT = Number(process.env.COUNT || 10);
const DELAY_MS = Number(process.env.DELAY_MS || 4000);

const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };
async function sb(path, opts = {}) {
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers: { ...headers, ...(opts.prefer ? { Prefer: opts.prefer } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${t.slice(0,160)}`);
  return t ? JSON.parse(t) : null;
}

const POOL = [
  { user: 'visitor.42',  msg: 'just joined, looks amazing' },
  { user: 'leo.skies',   msg: 'how are conditions today?' },
  { user: 'mira.films',  msg: 'subscribed' },
  { user: 'jin.aerial',  msg: '안녕하세요!' },
  { user: 'noah.atc',    msg: 'permit map cleared, fly free' },
  { user: 'ria.studio',  msg: 'love this clip', isSuper: true, amount: 5 },
  { user: 'patrick.s',   msg: 'thank you for the live!', isSuper: true, amount: 2 },
  { user: 'sky.nordic',  msg: 'where to next?' },
  { user: 'film.korea',  msg: 'great work as always' },
  { user: 'wing.daniel', msg: 'is that the Mavic 3 Pro?' },
  { user: 'aurora.ke',   msg: 'this is what slow living looks like' },
  { user: 'kira.flight', msg: '🙌' },
  { user: 'eric.fpv',    msg: 'thinking of buying my first drone — recommendations?', isSuper: true, amount: 10 },
];

function tierFor(amount) {
  if (amount >= 50)  return { color: 'pink',   pinSec: 900 };
  if (amount >= 20)  return { color: 'orange', pinSec: 300 };
  if (amount >= 10)  return { color: 'yellow', pinSec: 120 };
  if (amount >= 5)   return { color: 'green',  pinSec: 60 };
  if (amount >= 2)   return { color: 'lblue',  pinSec: 0 };
  return { color: 'blue', pinSec: 0 };
}

(async () => {
  // Find the live demo stream
  const streams = await sb('/rest/v1/live_streams?select=id,title&status=eq.live&order=started_at.desc&limit=1');
  if (!streams.length) { console.log('No active demo stream — run seed-demo-stream.yml first'); return; }
  const stream = streams[0];
  console.log(`[pump] target: ${stream.title}`);
  for (let i = 0; i < COUNT; i++) {
    const m = POOL[Math.floor(Math.random() * POOL.length)];
    const body = {
      stream_id: stream.id, user_id: null, username: m.user, body: m.msg,
      created_at: new Date().toISOString(),
    };
    if (m.isSuper) {
      const t = tierFor(m.amount);
      Object.assign(body, { is_super: true, super_amount_usd: m.amount, super_color: t.color, super_pin_seconds: t.pinSec });
    }
    const inserted = await sb('/rest/v1/live_chat_messages', { method: 'POST', body, prefer: 'return=representation' });
    if (m.isSuper) {
      const messageId = (Array.isArray(inserted) ? inserted[0] : inserted).id;
      await sb('/rest/v1/super_chats', {
        method: 'POST',
        body: {
          message_id: messageId, stream_id: stream.id, user_id: null,
          amount_usd: m.amount,
          pilot_share_usd: Number((m.amount * 0.7).toFixed(2)),
          platform_fee_usd: Number((m.amount * 0.3).toFixed(2)),
          paypal_order_id: `PUMP-${Date.now()}-${i}`,
          status: 'paid',
          created_at: new Date().toISOString(),
        },
        prefer: 'return=minimal',
      });
    }
    console.log(`  [${i+1}/${COUNT}] ${m.user}: ${m.msg.slice(0,40)}${m.isSuper ? ' [$' + m.amount + ']' : ''}`);
    if (i < COUNT - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log('[pump] DONE');
})();
