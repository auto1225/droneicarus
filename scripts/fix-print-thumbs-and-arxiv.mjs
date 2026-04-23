#!/usr/bin/env node
// Fix Print slot:
//   1) Replace 2 mismatched arXiv URLs with REAL drone-related papers
//   2) For every Printables item, scrape og:image and use it as cover_image_url
//      (image.thum.io was failing to render, so use Printables' own thumbnail directly)

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

// === arXiv replacements ===
const ARXIV_REMAP = {
  // bogus URL → { new_url, new_title, new_summary }
  'https://arxiv.org/abs/2208.04576': {
    url: 'https://arxiv.org/abs/2401.02541',
    title: 'Autonomous Multi-Rotor UAVs — Holistic Design, Optimization, Fabrication',
    summary: 'Topology optimization + FEM analysis applied to multi-rotor UAV frame design — reduces total weight and material usage. Walks through full design loop.',
  },
  'https://arxiv.org/abs/2301.00213': {
    url: 'https://arxiv.org/abs/2509.09024',
    title: 'Rapid Manufacturing of Lightweight Drone Frames using Single-Tow Architected Composites',
    summary: '3D-fiber-tethered FCC lattice frame fabrication. Specific strength 4–8× metals/thermoplastics. Demonstrates real production drone frames from continuous single-tow CF.',
  },
};

// === Helper to scrape og:image ===
async function fetchOgImage(pageUrl) {
  try {
    const r = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; droneicarus/1.0)' }, redirect: 'follow' });
    if (!r.ok) return null;
    const html = await r.text();
    // Look for og:image
    const m = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
           || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

async function listPrint() {
  const r = await fetch(`${URL}/rest/v1/lab_items?select=id,title,external_url&subsection=eq.print&limit=100`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  return r.json();
}

async function patch(id, body) {
  const r = await fetch(`${URL}/rest/v1/lab_items?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) console.warn(`patch ${id}: ${r.status} ${await r.text()}`);
  return r.ok;
}

(async () => {
  const rows = await listPrint();
  console.log(`processing ${rows.length} print rows...\n`);
  let arxivFixed = 0, ogFetched = 0, ogFailed = 0;
  for (const row of rows) {
    // 1) arXiv remap
    if (ARXIV_REMAP[row.external_url]) {
      const r = ARXIV_REMAP[row.external_url];
      await patch(row.id, { external_url: r.url, title: r.title, summary: r.summary });
      console.log(`  ✎ arxiv-remap ${row.title.slice(0,60)} → ${r.url}`);
      arxivFixed++;
      // Try og:image too
      const og = await fetchOgImage(r.url);
      if (og) await patch(row.id, { cover_image_url: og });
      continue;
    }
    // 2) og:image for Printables/YouTube/arXiv
    if (row.external_url.includes('youtube.com')) continue;  // YT thumbs already direct
    const og = await fetchOgImage(row.external_url);
    if (og) {
      await patch(row.id, { cover_image_url: og });
      console.log(`  ✎ og-thumb ${row.title.slice(0,55)}`);
      ogFetched++;
    } else {
      console.log(`  ✗ no og:image ${row.title.slice(0,55)}`);
      ogFailed++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\nDone. arxiv fixed: ${arxivFixed}, og fetched: ${ogFetched}, og failed: ${ogFailed}`);
})();
