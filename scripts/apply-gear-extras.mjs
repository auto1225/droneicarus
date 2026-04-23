#!/usr/bin/env node
import fs from 'node:fs';
const SUPA=process.env.SUPABASE_URL; const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!SUPA||!KEY){console.error('Missing env');process.exit(1);}
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'return=minimal,resolution=merge-duplicates'};
const rows=JSON.parse(fs.readFileSync('scripts/gear-extra-drones.json','utf8'));
console.log(`inserting ${rows.length} extras...`);
let ok=0,fail=0;
for(const row of rows){
  const r=await fetch(`${SUPA}/rest/v1/drone_products?on_conflict=slug`,{method:'POST',headers:H,body:JSON.stringify(row)});
  if(r.ok)ok++; else {fail++; if(fail<3)console.warn(`FAIL ${row.slug}: ${r.status} ${(await r.text()).slice(0,200)}`);}
}
console.log(`ok: ${ok}, fail: ${fail}`);
