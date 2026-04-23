#!/usr/bin/env node
import fs from 'node:fs';
const SUPA=process.env.SUPABASE_URL; const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!SUPA||!KEY){console.error('Missing env');process.exit(1);}
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'};
const rows=JSON.parse(fs.readFileSync('scripts/lowcov2-videos.json','utf8'));
console.log(`${rows.length} low-coverage-region videos to insert...`);
let ok=0, fail=0;
for(const row of rows){
  const r=await fetch(`${SUPA}/rest/v1/videos`,{method:'POST',headers:H,body:JSON.stringify(row)});
  if(r.ok)ok++; else{fail++; if(fail<3)console.warn(`FAIL ${r.status}: ${(await r.text()).slice(0,120)}`);}
}
console.log(`ok: ${ok}/${rows.length}, fail: ${fail}`);
