#!/usr/bin/env node
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

// Set published_at to now() for all war-category videos whose published_at is null
const now = new Date().toISOString();
const r = await fetch(`${SUPA}/rest/v1/videos?category=eq.war&published_at=is.null`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ published_at: now }),
});
console.log(`patch: ${r.status}`);
const vr = await fetch(`${SUPA}/rest/v1/videos?category=eq.war&select=id&published_at=is.null&limit=5`, { headers: H });
console.log(`remaining null published_at: ${(await vr.json()).length}`);
