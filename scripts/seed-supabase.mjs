// scripts/seed-supabase.mjs — one-shot seed of mock videos into Supabase
//
// Run AFTER applying migrations 0001–0004 (schema + RLS + storage + locations).
// Usage:
//   node scripts/seed-supabase.mjs
//
// Requires .env.local with:
//   VITE_SUPABASE_URL
//   SUPABASE_SECRET_KEY   (service role — bypasses RLS)
//
// The secret key must stay in .env.local (gitignored). Never commit it.

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (avoid dotenv dep)
const envPath = path.resolve(new URL('.', import.meta.url).pathname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

// ---------------------------------------------------------------------------
// Seed demo pilot profiles. We create auth users via Admin API so that
// the `handle_new_user` trigger populates `profiles` automatically.
// ---------------------------------------------------------------------------
const PILOTS = [
  { email: 'sky.waltz@icarus.demo',     handle: '@skywaltz',     name: 'Sky Waltz',       verified: true },
  { email: 'aerial.nomad@icarus.demo',  handle: '@aerialnomad',  name: 'Aerial Nomad',    verified: true },
  { email: 'fpv.rebel@icarus.demo',     handle: '@fpvrebel',     name: 'FPV Rebel',       verified: false },
  { email: 'hyunwoo@icarus.demo',       handle: '@hyunwoo',      name: 'Hyunwoo Park',    verified: true },
  { email: 'khaled.air@icarus.demo',    handle: '@khaled.air',   name: 'Khaled Air',      verified: false },
  { email: 'soaring.claire@icarus.demo',handle: '@soaringclaire',name: 'Soaring Claire',  verified: false },
  { email: 'high.altitude@icarus.demo', handle: '@highaltitude', name: 'High Altitude Co.', verified: false },
  { email: 'drone.yomi@icarus.demo',    handle: '@droneyomi',    name: 'Drone Yomi',      verified: false },
];

async function seedPilots() {
  const idByHandle = {};
  for (const p of PILOTS) {
    // Try to create; if already exists, look up
    const { data: created, error } = await admin.auth.admin.createUser({
      email: p.email,
      password: 'seed-' + Math.random().toString(36).slice(2, 12),
      email_confirm: true,
      user_metadata: { handle: p.handle, display_name: p.name },
    });
    let id;
    if (error && /already been registered/i.test(error.message)) {
      const list = await admin.auth.admin.listUsers({ perPage: 200 });
      id = list.data.users.find(u => u.email === p.email)?.id;
    } else if (error) {
      console.warn(`! ${p.handle}:`, error.message);
      continue;
    } else {
      id = created.user.id;
    }
    if (!id) continue;
    idByHandle[p.handle] = id;
    // Upsert profile with verified status + role
    await admin.from('profiles').upsert({
      id,
      handle: p.handle,
      display_name: p.name,
      email: p.email,
      role: 'pilot',
      pilot_verified: p.verified,
    });
    console.log(`✓ pilot ${p.handle} (${id.slice(0,8)}…)`);
  }
  return idByHandle;
}

// ---------------------------------------------------------------------------
// Seed videos. Mirror the makeVideo() logic from data.jsx.
// ---------------------------------------------------------------------------
const TITLES = [
  'Golden Hour Ascent', 'Cinematic Flight 4K', 'Dawn Patrol', 'Morning Thermals',
  'Above the Clouds', 'Silent Approach', 'Edge of the World', 'Valley Sweep',
  'Ridge Runner', 'Low & Fast', 'Night Vision Run', 'Storm Front',
  'Monsoon Pass', 'Winter Light', 'Raw FPV — No Cuts', 'Master Cut',
];
const YT_POOL = [
  'dQw4w9WgXcQ', 'ScMzIvxBSi4', 'jfKfPfyJRdk', 'M7lc1UVf-VE',
  'aqz-KE-bpKQ', '2Vv-BfVoq4g', 'hFZFjoX2cGg', '09R8_2nJtjg',
  'kXYiU_JCYtU', 'OPf0YbXqDm0', 'fJ9rUzIMcZQ',
];
const DURATIONS = [134, 222, 308, 381, 483, 707, 295, 432, 179]; // seconds
const VIEWS = [12400, 87200, 1_200_000, 342_000, 56_700, 9_300, 4_100_000, 233_000];
const RESOLUTIONS = ['4K', '5.7K', '6K', '8K'];
const PRICES = [4.99, 9.99, 14.99, 29.99];
const LOCATIONS = [
  { id:'pyramids', count:12, cat:'ruins' }, { id:'namsan', count:12, cat:'cityscape' },
  { id:'everest', count:12, cat:'mountain' }, { id:'halong', count:12, cat:'ocean' },
  { id:'grandcanyon', count:12, cat:'landscape' }, { id:'fuji', count:12, cat:'mountain' },
  { id:'sahara', count:12, cat:'desert' }, { id:'amazon', count:12, cat:'forest' },
  { id:'santorini', count:12, cat:'cityscape' }, { id:'iceland', count:12, cat:'landscape' },
  { id:'banff', count:12, cat:'mountain' }, { id:'dubai', count:12, cat:'cityscape' },
  { id:'taj', count:12, cat:'ruins' }, { id:'machu', count:12, cat:'ruins' },
  { id:'sydney', count:12, cat:'cityscape' }, { id:'victoria', count:12, cat:'landscape' },
  { id:'kilimanjaro', count:12, cat:'mountain' }, { id:'great-wall', count:12, cat:'ruins' },
  { id:'matterhorn', count:12, cat:'mountain' }, { id:'bagan', count:12, cat:'ruins' },
  { id:'maldives', count:12, cat:'ocean' }, { id:'patagonia', count:12, cat:'mountain' },
  { id:'yosemite', count:12, cat:'landscape' }, { id:'norway-fjord', count:12, cat:'landscape' },
  { id:'kyiv', count:12, cat:'war' }, { id:'baja', count:12, cat:'racing' },
  { id:'alps-ski', count:12, cat:'sports' }, { id:'bali', count:12, cat:'landscape' },
];

async function seedVideos(idByHandle) {
  const handles = Object.keys(idByHandle);
  if (handles.length === 0) { console.warn('no pilots — skipping videos'); return; }

  const rows = [];
  let i = 0;
  for (const loc of LOCATIONS) {
    for (let n = 0; n < loc.count; n++) {
      const handle = handles[i % handles.length];
      const title = TITLES[i % TITLES.length];
      rows.push({
        title: `${title} — ${title.length % 2 === 0 ? 'Aerial Study' : 'Director’s Edit'}`,
        description: 'Shot on DJI Mavic 3 Pro Cine at golden hour. ND8 filter, 24fps, D-Log M color.',
        owner_id: idByHandle[handle],
        location_id: loc.id,
        category: loc.cat,
        yt_id: YT_POOL[i % YT_POOL.length],
        duration_s: DURATIONS[i % DURATIONS.length],
        resolution: RESOLUTIONS[i % RESOLUTIONS.length],
        fps: 24,
        price_usd: n % 3 === 0 ? PRICES[i % PRICES.length] : 0,
        status: 'published',
        views: VIEWS[i % VIEWS.length],
        likes: Math.round(VIEWS[i % VIEWS.length] * 0.04),
        tags: [loc.cat, 'cinematic', RESOLUTIONS[i % RESOLUTIONS.length], '24fps'],
        published_at: new Date(Date.now() - ([2,5,14,28,60,120,365,4][i%8]) * 86400000).toISOString(),
      });
      i++;
    }
  }

  console.log(`inserting ${rows.length} videos…`);
  // Chunk inserts to avoid request size limits
  for (let j = 0; j < rows.length; j += 100) {
    const chunk = rows.slice(j, j + 100);
    const { error } = await admin.from('videos').insert(chunk);
    if (error) { console.error('! videos chunk:', error.message); break; }
    process.stdout.write(`  ${j + chunk.length}/${rows.length}\r`);
  }
  console.log('\n✓ videos seeded');
}

async function main() {
  console.log('→ seeding pilots…');
  const idByHandle = await seedPilots();
  console.log('→ seeding videos…');
  await seedVideos(idByHandle);
  console.log('done.');
}

main().catch(e => { console.error(e); process.exit(1); });
