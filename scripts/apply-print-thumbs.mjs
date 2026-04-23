#!/usr/bin/env node
// Apply static og:image mapping (scraped from sandbox) to lab_items.
import fs from 'node:fs';

const SUPA_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

// Map scraped in sandbox on 2026-04-23
const MAP = JSON.parse(fs.readFileSync('scripts/print-thumbs-map.json', 'utf8'));

(async () => {
  let ok = 0, skip = 0;
  for (const [id, og] of MAP) {
    if (!og) { skip++; continue; }
    // For arXiv, the og:image is just the logo — use thum.io screenshot of abstract instead
    let cover = og;
    if (og.includes('arxiv-logo-fb.png')) {
      // find external_url and use thum.io
      const row = await fetch(`${SUPA_URL}/rest/v1/lab_items?select=external_url&id=eq.${id}`, { headers: H }).then(r => r.json());
      if (row[0]?.external_url) cover = `https://image.thum.io/get/width/800/crop/600/${encodeURIComponent(row[0].external_url)}`;
    }
    const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?id=eq.${id}`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ cover_image_url: cover }),
    });
    if (r.ok) { ok++; console.log(`OK ${id} → ${cover.slice(0,70)}`); }
    else console.warn(`FAIL ${id}: ${r.status}`);
  }
  console.log(`\npatched ${ok}, skipped ${skip}`);
})();
