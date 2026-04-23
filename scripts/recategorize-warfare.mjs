#!/usr/bin/env node
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const r = await fetch(`${SUPA}/rest/v1/videos?category=eq.war&select=id,title,tags`, { headers: H });
const rows = await r.json();
console.log(`${rows.length} war videos to recategorize`);

function classify(tags, title) {
  const t = new Set(tags || []);
  const T = (title || '').toLowerCase();
  if (t.has('swarm') || t.has('autonomous') || /swarm|autonomous/.test(T)) return 'war-swarm';
  if (t.has('ukraine') || t.has('russia') || /ukraine|russia|kyiv|moscow/.test(T))
    return t.has('russia') && !t.has('ukraine') ? 'war-russia' : 'war-ukraine';
  if (t.has('gaza') || /gaza/.test(T)) return 'war-gaza';
  if (t.has('israel') || t.has('idf') || t.has('hamas') || /israel|idf|hamas/.test(T)) return 'war-israel';
  if (t.has('iran') || t.has('shahed') || /iran|shahed/.test(T)) return 'war-iran';
  if (t.has('mq9') || t.has('reaper') || t.has('bayraktar') || /mq-?9|reaper|bayraktar|tb2/.test(T)) return 'war-platform';
  if (t.has('counter-uav') || t.has('anti-drone') || t.has('interceptor') || /counter|intercept|anti-drone/.test(T)) return 'war-counter';
  if (t.has('middle-east') || t.has('houthi') || /middle east|houthi/.test(T)) return 'war-mideast';
  return 'war-ukraine';  // default bucket
}

let ok=0, fail=0;
const dist = {};
for (const row of rows) {
  const cat = classify(row.tags, row.title);
  dist[cat] = (dist[cat] || 0) + 1;
  const p = await fetch(`${SUPA}/rest/v1/videos?id=eq.${row.id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ category: cat }),
  });
  if (p.ok) ok++; else fail++;
}
console.log('category distribution:', dist);
console.log(`ok: ${ok}, fail: ${fail}`);
