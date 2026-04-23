#!/usr/bin/env node
import fs from 'node:fs';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const items = JSON.parse(fs.readFileSync('scripts/print-300-final.json','utf8'));
console.log(`${items.length} items to insert...`);
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);}
const seenSlugs = new Set();
let ok = 0, skipDup = 0, fail = 0;
for (const it of items) {
  let s = 'print-' + slug(it.title);
  if (seenSlugs.has(s)) { skipDup++; continue; }
  seenSlugs.add(s);
  const body = {
    type:'project', subsection:'print',
    title: it.title, slug: s, summary: it.title,
    external_url: it.url, cover_image_url: it.cover,
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
  if (r.ok) ok++;
  else { fail++; if (fail<3) console.warn(`FAIL ${s}: ${r.status} ${await r.text()}`); }
}
console.log(`\nok: ${ok}, dup-skip: ${skipDup}, fail: ${fail}`);
