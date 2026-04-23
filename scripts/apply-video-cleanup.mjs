#!/usr/bin/env node
import fs from 'node:fs';
const SUPA=process.env.SUPABASE_URL; const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!SUPA||!KEY){console.error('Missing env');process.exit(1);}
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'};

const plan = JSON.parse(fs.readFileSync('scripts/video-cleanup.json','utf8'));
console.log(`delete: ${plan.delete_ids.length}, thumb updates: ${plan.thumb_updates.length}`);

// Delete unplayable videos
let delOk=0,delFail=0;
for (const id of plan.delete_ids) {
  const r = await fetch(`${SUPA}/rest/v1/videos?id=eq.${id}`, { method:'DELETE', headers:H });
  if (r.ok) delOk++; else { delFail++; console.warn(`DEL fail ${id}: ${r.status}`); }
}
console.log(`deleted: ${delOk}/${plan.delete_ids.length}`);

// Update thumbnails
let upOk=0, upFail=0;
for (const {id, url} of plan.thumb_updates) {
  const r = await fetch(`${SUPA}/rest/v1/videos?id=eq.${id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ thumb_url: url }),
  });
  if (r.ok) upOk++; else { upFail++; if (upFail<3) console.warn(`UP fail ${id}: ${r.status}`); }
}
console.log(`thumbs updated: ${upOk}/${plan.thumb_updates.length}`);

// Also delete matching lab_items (where external_url contains the deleted youtube id)
// Fetch ids first
for (const id of plan.delete_ids) {
  // We don't know the yt_id directly here; lab cleanup does a broader sweep.
}
