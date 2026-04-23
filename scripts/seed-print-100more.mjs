#!/usr/bin/env node
// Verify each URL (HTTP 200 + og:image for Printables, oEmbed for YouTube)
// Insert verified items into lab_items (subsection=print). Idempotent on slug.
import fs from 'node:fs';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const candidates = JSON.parse(fs.readFileSync('scripts/print-100-candidates.json', 'utf8'));
console.log(`candidates: ${candidates.length}`);

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
function ytId(url) { const m = url.match(/(?:[?&]v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? m[1] : null; }

async function verifyPrintables(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow' });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) || html.match(/name="og:image"[^>]*content="([^"]+)"/i);
    if (!m) return null;
    // Also pull title to confirm it's a real model page
    const t = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
    return { cover: m[1], ogTitle: t ? t[1] : '' };
  } catch (e) { return null; }
}

async function verifyYouTube(url) {
  const id = ytId(url);
  if (!id) return null;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return null;
    const data = await r.json();
    return { cover: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, author: data.author_name };
  } catch (e) { return null; }
}

async function insert(item) {
  const slug = 'print-' + slugify(item.title);
  const body = {
    type: item.kind === 'youtube' ? 'video' : 'project',
    subsection: 'print',
    title: item.title,
    slug,
    summary: item.summary || item.title,
    external_url: item.url,
    cover_image_url: item._cover,
    institution: item.kind === 'youtube' ? 'YouTube' : 'Printables',
    tags: item.tags || [],
    published_at: new Date().toISOString(),
    status: 'approved',
  };
  const r = await fetch(`${SUPA}/rest/v1/lab_items?on_conflict=slug`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=minimal,resolution=merge-duplicates' },
    body: JSON.stringify(body),
  });
  return r.ok;
}

let okV = 0, badV = 0, inserted = 0;
for (let i = 0; i < candidates.length; i++) {
  const c = candidates[i];
  let verified;
  if (c.kind === 'youtube') verified = await verifyYouTube(c.url);
  else verified = await verifyPrintables(c.url);
  if (!verified) { badV++; console.log(`[${i+1}/${candidates.length}] BAD ${c.title.slice(0,55)}`); continue; }
  okV++;
  c._cover = verified.cover;
  const ins = await insert(c);
  if (ins) { inserted++; console.log(`[${i+1}/${candidates.length}] OK+INS ${c.title.slice(0,55)}`); }
  else console.log(`[${i+1}/${candidates.length}] OK+FAIL-INS ${c.title.slice(0,55)}`);
  // gentle rate limit
  await new Promise(r => setTimeout(r, 150));
}
console.log(`\nverified: ${okV}/${candidates.length}, inserted: ${inserted}`);
