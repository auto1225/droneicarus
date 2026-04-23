#!/usr/bin/env node
import fs from 'node:fs';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const items = JSON.parse(fs.readFileSync('scripts/print-100-verified-printables.json','utf8'));
console.log(`${items.length} items to insert...`);
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);}
let ok = 0;
for (const it of items) {
  const body = {
    type:'project', subsection:'print',
    title: it.title,
    slug: 'print-'+slug(it.title),
    summary: it.title,
    external_url: it.url,
    cover_image_url: it.cover,
    institution: 'Printables',
    tags: it.tags || [],
    published_at: new Date().toISOString(),
    status: 'approved',
  };
  const r = await fetch(`${SUPA}/rest/v1/lab_items?on_conflict=slug`, {
    method:'POST',
    headers:{...H, Prefer:'return=minimal,resolution=merge-duplicates'},
    body: JSON.stringify(body),
  });
  if (r.ok) { ok++; console.log(`+ ${it.title.slice(0,60)}`); }
  else console.warn(`FAIL ${it.title.slice(0,50)}: ${r.status}`);
}
console.log(`\nok: ${ok}/${items.length}`);
