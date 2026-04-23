// scripts/seed-demo-stream.mjs — set up a demo live stream with simulated chat + super chats
// Run via .github/workflows/seed-demo-stream.yml

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };

async function sb(path, opts = {}) {
  const h = { ...headers };
  if (opts.prefer) h.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers: h,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

// Demo pilot — uses a fixed UUID so we can rerun safely
const DEMO_USER_ID = '23c9b732-d522-4814-969b-a8b0f02073df';  // auto0104@gmail.com (admin)
const DEMO_HANDLE = '@demo.pilot';
const DEMO_NAME = 'Demo Pilot · Drone Cam Live';

// A real long YT video to use as the embed (use the user's existing Norway 4K 1HR ambient video)
const YT_VIDEO_ID = 'qF1DTK4U1AM';  // 1HR Norway ambient drone footage by Nature Relaxation Films
const YT_URL = `https://www.youtube.com/watch?v=${YT_VIDEO_ID}`;

// Pool of realistic drone-watcher chat messages
const CHAT_POOL = [
  { user: 'sky.nordic',     msg: 'Wow this looks like the Lofoten islands?', mins: -28 },
  { user: 'ben.films',      msg: 'What lens are you running today?', mins: -27 },
  { user: 'marta.nomad',    msg: 'the colors at golden hour 😍', mins: -25 },
  { user: 'pilot.bot',      msg: 'Wind aloft at 200m: 14 km/h NW. Battery 78%.', mins: -24 },
  { user: 'leon.aerial',    msg: 'how high are you flying right now?', mins: -22 },
  { user: 'demo.pilot',     msg: '180m altitude, 1.4km out — heading toward the fjord head', mins: -21, fromPilot: true },
  { user: 'kim.kyungsoo',   msg: 'beautiful 안녕하세요 from Seoul', mins: -19 },
  { user: 'ria.studio',     msg: 'taking notes on this transition', mins: -18 },
  { user: 'fpv.dad',        msg: 'is this DJI Mavic 3 Cine?', mins: -17 },
  { user: 'demo.pilot',     msg: 'Yes — Mavic 3 Pro, D-Log M, 4K 60p', mins: -16, fromPilot: true },
  { user: 'jp.cinematic',   msg: 'subscribed!', mins: -15 },
  { user: 'patrick.s',      msg: 'where in norway exactly? id like to fly there too', mins: -14 },
  { user: 'demo.pilot',     msg: 'Reine, Lofoten — permits required, contact local authority', mins: -13, fromPilot: true },
  { user: 'oslo.heli',      msg: 'reine is special, lucky weather', mins: -12 },
  { user: 'sigrid.j',       msg: 'do you sell licenses for the clip?', mins: -11 },
  { user: 'demo.pilot',     msg: 'Yes — license through droneicarus marketplace, 4K master available', mins: -10, fromPilot: true },
  { user: 'hans.b',         msg: 'how long is the flight battery?', mins: -9 },
  { user: 'aerial.kr',      msg: 'thanks for streaming 🙏', mins: -8 },
  { user: 'mira.films',     msg: 'gimbal so smooth', mins: -7 },
  { user: 'daniel.l',       msg: 'love these long flow shots', mins: -6 },
  { user: 'rena.air',       msg: 'this is what calm looks like', mins: -5 },
  { user: 'noah.atc',       msg: 'class G airspace here right? checking my map', mins: -4 },
  { user: 'demo.pilot',     msg: 'Yes class G below 120m AGL, observing local NOTAMs', mins: -3, fromPilot: true },
  { user: 'film.nordic',    msg: 'amazing work!', mins: -2 },
  { user: 'ola.drone',      msg: 'will you do a tutorial next?', mins: -1 },
];

// Super Chat tier mapping (from src/pages/live-chat.jsx)
const SUPER_TIERS = [
  { color: 'blue',   pinSec: 0   },
  { color: 'lblue',  pinSec: 0   },
  { color: 'green',  pinSec: 60  },
  { color: 'yellow', pinSec: 120 },
  { color: 'orange', pinSec: 300 },
  { color: 'pink',   pinSec: 900 },
  { color: 'red',    pinSec: 1800 },
];
function tierFor(amount) {
  if (amount >= 100) return SUPER_TIERS[6];
  if (amount >=  50) return SUPER_TIERS[5];
  if (amount >=  20) return SUPER_TIERS[4];
  if (amount >=  10) return SUPER_TIERS[3];
  if (amount >=   5) return SUPER_TIERS[2];
  if (amount >=   2) return SUPER_TIERS[1];
  return SUPER_TIERS[0];
}

const SUPER_CHATS = [
  { user: 'patrick.s',  msg: 'Patreon-level work. Keep it up!',           amount: 5,   mins: -23 },
  { user: 'sigrid.j',   msg: 'For your next battery — appreciate it',    amount: 10,  mins: -20 },
  { user: 'aerial.kr',  msg: 'Greetings from Seoul!',                     amount: 20,  mins: -15 },
  { user: 'leon.aerial',msg: 'Worth every penny. Permit info please?',    amount: 50,  mins: -10 },
  { user: 'noah.atc',   msg: 'Your channel changed how I edit',          amount: 100, mins: -5  },
];

async function ensureProfile() {
  // Profile must pre-exist (auth.users FK). Just patch payout fields so monetization passes the trigger.
  await sb(`/rest/v1/profiles?id=eq.${DEMO_USER_ID}`, {
    method: 'PATCH',
    body: {
      paypal_email: 'demo@paypal.example',
      payee_name: 'Demo Pilot LLC',
      payout_country: 'US',
      payout_terms_at: new Date().toISOString(),
    },
    prefer: 'return=minimal',
  });
  console.log('[demo] payout patched on existing profile');
}

async function ensureStream() {
  // Delete any prior demo stream so we get a fresh one each time
  await sb(`/rest/v1/live_streams?pilot_id=eq.${DEMO_USER_ID}`, { method: 'DELETE', prefer: 'return=minimal' });
  const inserted = await sb('/rest/v1/live_streams', {
    method: 'POST',
    body: {
      pilot_id: DEMO_USER_ID,
      title: 'LIVE · Reine, Lofoten — golden hour drone flight (DEMO)',
      description: 'This is a simulated demo broadcast. The video is a recorded clip; chat & Super Chat below are seeded so you can see how the live experience looks. Sign in to send your own message.',
      thumb_url: `https://i.ytimg.com/vi/${YT_VIDEO_ID}/hqdefault.jpg`,
      status: 'live',
      started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      yt_video_id: YT_VIDEO_ID,
      embed_provider: 'youtube',
      monetization_enabled: true,
      viewers_peak: 142,
      lat: 67.9303,
      lon: 13.0852,  // Reine, Lofoten
    },
    prefer: 'return=representation',
  });
  const stream = inserted[0] || inserted;
  console.log('[demo] stream created:', stream.id);
  return stream;
}

async function seedChat(stream) {
  const now = Date.now();
  // Regular messages
  for (const m of CHAT_POOL) {
    await sb('/rest/v1/live_chat_messages', {
      method: 'POST',
      body: {
        stream_id: stream.id,
        user_id: m.fromPilot ? DEMO_USER_ID : null,
        username: m.user,
        body: m.msg,
        created_at: new Date(now + m.mins * 60 * 1000).toISOString(),
      },
      prefer: 'return=minimal',
    });
  }
  console.log(`[demo] ${CHAT_POOL.length} regular messages seeded`);

  // Super chats: insert message + ledger
  let scInserted = 0;
  for (const sc of SUPER_CHATS) {
    const t = tierFor(sc.amount);
    const msg = await sb('/rest/v1/live_chat_messages', {
      method: 'POST',
      body: {
        stream_id: stream.id,
        user_id: null,
        username: sc.user,
        body: sc.msg,
        is_super: true,
        super_amount_usd: sc.amount,
        super_color: t.color,
        super_pin_seconds: t.pinSec,
        created_at: new Date(now + sc.mins * 60 * 1000).toISOString(),
      },
      prefer: 'return=representation',
    });
    const messageId = (Array.isArray(msg) ? msg[0] : msg).id;
    await sb('/rest/v1/super_chats', {
      method: 'POST',
      body: {
        message_id: messageId,
        stream_id: stream.id,
        user_id: null,
        amount_usd: sc.amount,
        pilot_share_usd: Number((sc.amount * 0.7).toFixed(2)),
        platform_fee_usd: Number((sc.amount * 0.3).toFixed(2)),
        paypal_order_id: `DEMO-${Date.now()}-${scInserted}`,
        status: 'paid',
        created_at: new Date(now + sc.mins * 60 * 1000).toISOString(),
      },
      prefer: 'return=minimal',
    });
    scInserted++;
  }
  console.log(`[demo] ${scInserted} super chats seeded`);
}

(async () => {
  console.log('[demo] starting');
  await ensureProfile();
  const stream = await ensureStream();
  await seedChat(stream);
  console.log('[demo] DONE');
  console.log(`Visit https://droneicarus.com/#live and click the "${stream.title}" stream`);
})();
