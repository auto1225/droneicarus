#!/usr/bin/env node
import fs from 'node:fs';
const SUPA=process.env.SUPABASE_URL; const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!SUPA||!KEY){console.error('Missing env');process.exit(1);}
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'};

const vids=JSON.parse(fs.readFileSync('scripts/warfare-videos-batch2.json','utf8'));
const labs=JSON.parse(fs.readFileSync('scripts/warfare-lab-batch2.json','utf8'));
console.log(`videos:${vids.length} labs:${labs.length}`);

let vOk=0,vFail=0;
for(const row of vids){
  const r=await fetch(`${SUPA}/rest/v1/videos`,{method:'POST',headers:H,body:JSON.stringify(row)});
  if(r.ok)vOk++; else{vFail++; if(vFail<3)console.warn(`v ${r.status}: ${(await r.text()).slice(0,150)}`);}
}
let lOk=0,lFail=0;
for(const row of labs){
  const r=await fetch(`${SUPA}/rest/v1/lab_items?on_conflict=slug`,{method:'POST',headers:{...H,Prefer:'return=minimal,resolution=merge-duplicates'},body:JSON.stringify(row)});
  if(r.ok)lOk++; else{lFail++; if(lFail<3)console.warn(`l ${r.status}: ${(await r.text()).slice(0,150)}`);}
}
console.log(`videos ok:${vOk}/${vids.length} lab ok:${lOk}/${labs.length}`);
