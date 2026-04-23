#!/usr/bin/env node
// One-shot concept cleanup — strips emoji from videos + lab_items, deletes stock-footage titles
// Runs via GH Actions workflow_dispatch with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

// Match the emoji-code-point ranges we want to strip:
//   Pictographs + Supplemental + Ext-A + Symbols & Pictographs Ext-A
//   (U+1F300..U+1FAFF) — main emoji blocks
//   Plus ZWJ (U+200D), VS15/16 (U+FE0E/FE0F), and regional indicators (flags)
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{200D}\u{FE0E}\u{FE0F}]/gu;

function strip(s) {
  if (!s) return s;
  const out = s.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
  return out;
}

async function page(table, select, offset = 0, limit = 1000) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=${select}&limit=${limit}&offset=${offset}`, { headers: H });
  if (!r.ok) throw new Error(`${table} fetch ${r.status}: ${await r.text()}`);
  return r.json();
}

async function patch(table, id, body) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${table} patch ${id} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function del(table, id) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers: H });
  if (!r.ok) throw new Error(`${table} delete ${id} ${r.status}: ${await r.text()}`);
  return r.status;
}

async function cleanTable(table, fields) {
  console.log(`\n== ${table} — strip emoji from ${fields.join(', ')} ==`);
  let offset = 0, updated = 0, scanned = 0;
  while (true) {
    const rows = await page(table, `id,${fields.join(',')}`, offset, 1000);
    if (!rows.length) break;
    scanned += rows.length;
    for (const row of rows) {
      const patchBody = {};
      for (const f of fields) {
        const before = row[f] ?? '';
        const after = strip(before);
        if (before !== after) patchBody[f] = after;
      }
      if (Object.keys(patchBody).length) {
        await patch(table, row.id, patchBody);
        updated++;
      }
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  console.log(`${table}: scanned=${scanned} updated=${updated}`);
}

async function deleteStockFootage() {
  console.log('\n== videos — delete generic stock-footage titles ==');
  const pattern = 'stock|Stock|STOCK';
  // Fetch all videos (we need JS-side filter since PostgREST pattern-or matching is cumbersome)
  let offset = 0, candidates = [];
  while (true) {
    const rows = await page('videos', 'id,title', offset, 1000);
    if (!rows.length) break;
    for (const r of rows) {
      const t = String(r.title || '');
      // Match: generic SEO stock-footage spam
      const isStock = /stock (footage|video)|royalty[-\s]?free|no copyright/i.test(t);
      // Exempt: anything that also mentions "droneicarus" (we're the author)
      const isOurs = /droneicarus/i.test(t);
      if (isStock && !isOurs) candidates.push(r);
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  console.log(`candidates: ${candidates.length}`);
  for (const c of candidates) console.log(`  - ${c.id}  ${c.title}`);
  let deleted = 0;
  for (const c of candidates) { await del('videos', c.id); deleted++; }
  console.log(`deleted: ${deleted}`);
}

(async () => {
  try {
    await cleanTable('videos', ['title', 'description']);
    await cleanTable('lab_items', ['title', 'summary']);
    await deleteStockFootage();
    console.log('\nConcept cleanup complete.');
  } catch (e) { console.error(e); process.exit(1); }
})();
