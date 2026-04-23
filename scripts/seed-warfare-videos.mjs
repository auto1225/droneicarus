#!/usr/bin/env node
import fs from 'node:fs';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const rows = JSON.parse(fs.readFileSync('scripts/warfare-videos.json','utf8'));
console.log(`${rows.length} warfare videos to insert...`);

let ok=0, fail=0, dup=0;
for (const row of rows) {
  // Dedupe: check if youtube_id already exists
  const chk = await fetch(`${SUPA}/rest/v1/videos?select=id&youtube_id=eq.${row.youtube_id}&limit=1`, { headers: H });
  const existing = await chk.json();
  if (existing.length > 0) { dup++; continue; }

  const r = await fetch(`${SUPA}/rest/v1/videos`, {
    method:'POST',
    headers:{...H, Prefer:'return=minimal'},
    body: JSON.stringify(row),
  });
  if (r.ok) ok++;
  else { fail++; if (fail<3) console.warn(`FAIL: ${r.status} ${(await r.text()).slice(0,200)}`); }
}
console.log(`ok: ${ok}, dup: ${dup}, fail: ${fail}`);
