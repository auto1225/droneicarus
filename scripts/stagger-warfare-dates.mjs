#!/usr/bin/env node
import crypto from 'node:crypto';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const r = await fetch(`${SUPA}/rest/v1/videos?category=like.war-*&select=id`, { headers: H });
const rows = await r.json();
console.log(`${rows.length} warfare rows to stagger...`);

const now = Date.now();
const YEAR_MS = 365 * 24 * 3600 * 1000;
let ok = 0;
for (const row of rows) {
  // Deterministic offset: hash of id → 0..1 → map to [0, YEAR]
  const h = crypto.createHash('md5').update(row.id).digest().readUInt32BE(0);
  const offset = (h / 0xFFFFFFFF) * YEAR_MS;
  const published = new Date(now - offset).toISOString();
  const p = await fetch(`${SUPA}/rest/v1/videos?id=eq.${row.id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ published_at: published }),
  });
  if (p.ok) ok++;
}
console.log(`ok: ${ok}/${rows.length}`);
