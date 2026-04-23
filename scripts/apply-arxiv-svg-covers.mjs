#!/usr/bin/env node
import fs from 'node:fs';
const SUPA_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
const patches = JSON.parse(fs.readFileSync('scripts/print-arxiv-covers.json', 'utf8'));
let ok = 0;
for (const p of patches) {
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?id=eq.${p.id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ cover_image_url: p.cover_image_url }),
  });
  if (r.ok) { ok++; console.log(`OK ${p.id}`); } else console.warn(`FAIL ${p.id}: ${r.status} ${await r.text()}`);
}
console.log(`\npatched ${ok}/${patches.length}`);
