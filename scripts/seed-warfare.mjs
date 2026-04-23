#!/usr/bin/env node
import fs from 'node:fs';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const items = JSON.parse(fs.readFileSync('scripts/warfare-verified.json','utf8'));
console.log(`${items.length} warfare items to insert...`);
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);}
let ok=0, fail=0;
for (const it of items) {
  const body = {
    type: 'video', subsection: 'warfare',
    title: it.verified_title || it.title,
    slug: 'warfare-' + slug(it.title),
    summary: it.title,
    external_url: `https://www.youtube.com/watch?v=${it.id}`,
    cover_image_url: `https://i.ytimg.com/vi/${it.id}/maxresdefault.jpg`,
    institution: 'YouTube',
    authors: it.author ? [it.author] : [],
    tags: it.tags || [],
    published_at: new Date().toISOString(),
    status: 'approved',
  };
  const r = await fetch(`${SUPA}/rest/v1/lab_items?on_conflict=slug`, {
    method:'POST',
    headers:{...H, Prefer:'return=minimal,resolution=merge-duplicates'},
    body: JSON.stringify(body),
  });
  if (r.ok) ok++; else { fail++; if (fail<3) console.warn(`FAIL: ${r.status} ${await r.text()}`); }
}
console.log(`ok: ${ok}, fail: ${fail}`);
