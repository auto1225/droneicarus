#!/usr/bin/env node
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const r = await fetch(`${SUPA}/rest/v1/site_content?key=eq.explore.hierarchy&select=value`, { headers: H });
const rows = await r.json();
if (!rows.length) { console.error('key missing'); process.exit(1); }
const hier = JSON.parse(rows[0].value);
// Drop any existing 'warfare' group then append fresh one
hier.groups = hier.groups.filter(g => g.id !== 'warfare');
hier.groups.push({
  id: 'warfare',
  label: 'Warfare & Defense',
  icon: 'warfare',
  children: [
    { id: 'ukraine-war', label: 'Ukraine · Russia',  fine: ['war-ukraine','war-russia'] },
    { id: 'middle-east', label: 'Middle East',       fine: ['war-mideast','war-israel','war-gaza','war-iran'] },
    { id: 'autonomous',  label: 'Autonomous Swarms', fine: ['war-swarm','war-autonomous'] },
    { id: 'counter-uav', label: 'Counter-UAV',       fine: ['war-counter'] },
    { id: 'platforms',   label: 'Platforms (MQ-9/Bayraktar/Shahed)', fine: ['war-platform'] },
  ],
});

const p = await fetch(`${SUPA}/rest/v1/site_content?key=eq.explore.hierarchy`, {
  method: 'PATCH',
  headers: { ...H, Prefer: 'return=minimal' },
  body: JSON.stringify({ value: JSON.stringify(hier) }),
});
console.log(`patch: ${p.status}`);
console.log(`groups now: ${hier.groups.map(g => g.label).join(', ')}`);
