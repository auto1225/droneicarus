#!/usr/bin/env node
// Explore counts videos by tags[0], so for the Warfare group to light up,
// each war video's first tag must equal its category (war-ukraine, war-russia, etc.).
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const r = await fetch(`${SUPA}/rest/v1/videos?category=like.war-*&select=id,category,tags`, { headers: H });
const rows = await r.json();
console.log(`${rows.length} warfare videos to fix...`);

let ok = 0;
for (const row of rows) {
  const cat = row.category;  // e.g. 'war-ukraine'
  const existing = (row.tags || []).filter(t => t !== cat);
  const newTags = [cat, ...existing];  // prepend so tags[0] === category
  const p = await fetch(`${SUPA}/rest/v1/videos?id=eq.${row.id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ tags: newTags }),
  });
  if (p.ok) ok++;
}
console.log(`ok: ${ok}/${rows.length}`);
