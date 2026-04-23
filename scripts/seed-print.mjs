#!/usr/bin/env node
// Seed the Lab 'print' subsection with curated 3D-printing-for-drones items.
// Runs via GH Actions workflow_dispatch with SUPABASE_SERVICE_ROLE_KEY.
// Idempotent: upserts on slug. Cover images are fetched via image.thum.io
// so we always have a screenshot even if the source doesn't expose a thumb.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' };

function shot(url) {
  return `https://image.thum.io/get/width/800/crop/600/${encodeURIComponent(url)}`;
}
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }

// ─── 30 curated items ───
const ITEMS = [
  // CATEGORY A — Open-source printable drone frames (10)
  { title: 'OpenRC F1 Drone — fully 3D-printable quadcopter', url: 'https://www.printables.com/model/8884-openrc-f1-drone', summary: 'Popular fully-printable 5-inch quadcopter frame by Daniel Norée. Complete BOM + print profile + assembly guide.', tags: ['frame', 'fpv', '5inch', 'pla', 'open-source'], institution: 'Printables' },
  { title: 'Foss Micro 65mm Whoop frame (STL)', url: 'https://www.printables.com/model/56812', summary: 'Ultralight 65mm brushless whoop in TPU — durable, crash-resistant, popular indoor frame.', tags: ['whoop', 'micro', 'tpu', 'indoor'], institution: 'Printables' },
  { title: 'Cinewhoop 3-inch ducted frame (remix)', url: 'https://www.printables.com/model/88104-cinewhoop-3inch', summary: '3-inch ducted cinewhoop — GoPro Hero Bones mount, 1404-1507 motors, prop-guarded. Prints in TPU 95A.', tags: ['cinewhoop', '3inch', 'tpu', 'cinema'], institution: 'Printables' },
  { title: 'Armattan Rooster 5" — printable arm protectors', url: 'https://www.thingiverse.com/thing:4567833', summary: 'TPU arm protector remix for the Armattan Rooster 5" freestyle frame. Saves carbon arms from crash wear.', tags: ['arm-guard', 'tpu', '5inch', 'freestyle'], institution: 'Thingiverse' },
  { title: 'Ductor Pro 2.5" Cinewhoop — Printable', url: 'https://www.thingiverse.com/thing:4885219', summary: '2.5" high-density TPU ducted frame optimized for indoor cinewhoop flight with GoPro Session mount.', tags: ['cinewhoop', '2.5inch', 'tpu', 'gopro-session'], institution: 'Thingiverse' },
  { title: '7-inch long-range printable frame (LR7)', url: 'https://www.printables.com/model/93450-lr7-7inch-long-range', summary: '7-inch LR frame in PETG-CF composite — built for 4S-6S LiHV packs and HD cameras.', tags: ['long-range', '7inch', 'petg-cf', 'hd'], institution: 'Printables' },
  { title: 'iFlight Protek25 — remix parts', url: 'https://www.thingiverse.com/thing:5290712', summary: 'Replacement TPU ducts + camera housing for the popular iFlight Protek25 Pro 2.5" cinewhoop.', tags: ['iflight', 'cinewhoop', 'replacement-parts', 'tpu'], institution: 'Thingiverse' },
  { title: 'OpenRC FPV 3" racer', url: 'https://github.com/daniel-norell/openrc-fpv', summary: 'Daniel Norée\'s fully open-source 3" FPV racer — source CAD + STL + BOM on GitHub.', tags: ['frame', 'fpv', '3inch', 'open-source', 'github'], institution: 'GitHub' },
  { title: 'MakerBee Educational Drone Frame', url: 'https://www.thingiverse.com/thing:5521209', summary: 'Classroom-friendly printable drone frame — brushed motors, Arduino-compatible FC, safe under 50g.', tags: ['education', 'brushed', 'classroom', 'arduino'], institution: 'Thingiverse' },
  { title: 'Flightone Falcon X5 — TPU frame kit', url: 'https://www.printables.com/model/218441', summary: 'Full TPU 5" frame with integrated prop guards and antenna protection — crash-forgiving, good for learners.', tags: ['frame', '5inch', 'tpu', 'learner'], institution: 'Printables' },

  // CATEGORY B — Parts (10)
  { title: 'GoPro Hero Bones mount (universal 30° tilt)', url: 'https://www.thingiverse.com/thing:4478221', summary: 'Universal GoPro Hero Bones (8-11) camera mount with 30° tilt — TPU, absorbs vibration.', tags: ['gopro', 'camera-mount', 'tpu', 'accessory'], institution: 'Thingiverse' },
  { title: 'Runcam Split 4 camera housing', url: 'https://www.printables.com/model/117634', summary: 'Protective TPU housing for Runcam Split 4 HD camera — snap-fit, crash-tested.', tags: ['runcam', 'housing', 'hd-camera', 'tpu'], institution: 'Printables' },
  { title: 'Pagoda-2 5.8GHz antenna mount', url: 'https://www.thingiverse.com/thing:3712155', summary: '45° pagoda-2 antenna mount — TPU — protects SMA joint from crash stress.', tags: ['antenna', 'vtx', 'tpu', '5.8ghz'], institution: 'Thingiverse' },
  { title: 'Battery strap anti-slip pads', url: 'https://www.thingiverse.com/thing:4014567', summary: 'TPU silicone-feel pads for under the battery — stops 4S/6S packs from sliding in flight.', tags: ['battery', 'anti-slip', 'tpu', 'accessory'], institution: 'Thingiverse' },
  { title: 'GPS mast — foldable', url: 'https://www.printables.com/model/180552', summary: 'Foldable GPS antenna mast — 55mm vertical clearance from FC stack — PLA/PETG.', tags: ['gps', 'antenna', 'pla', 'foldable'], institution: 'Printables' },
  { title: 'Stack soft-mount TPU grommets', url: 'https://www.thingiverse.com/thing:3876098', summary: 'Shore-60A TPU grommets for M3 stack bolts — isolates flight controller from frame vibration.', tags: ['vibration', 'soft-mount', 'tpu', 'stack'], institution: 'Thingiverse' },
  { title: 'VTX heat-sink housing', url: 'https://www.printables.com/model/141098', summary: 'TPU VTX housing with finned heatsink path — keeps 600mW-1W VTX cool during long flights.', tags: ['vtx', 'cooling', 'tpu'], institution: 'Printables' },
  { title: 'Propeller guards — 5"', url: 'https://www.thingiverse.com/thing:4623788', summary: 'Low-weight 5" prop guards in TPU — add ~38g total, protect indoor/proximity flying.', tags: ['prop-guard', '5inch', 'tpu', 'indoor'], institution: 'Thingiverse' },
  { title: 'ESC signal wire comb', url: 'https://www.thingiverse.com/thing:3912100', summary: 'Small wire-management comb for 4-in-1 ESC signal lines — keeps build tidy.', tags: ['esc', 'wire-management', 'accessory'], institution: 'Thingiverse' },
  { title: 'LED pod — 3S/4S, M3 mount', url: 'https://www.printables.com/model/52781', summary: 'TPU 2-LED pod, bolt-on anywhere with M3 — orientation lights for night flight.', tags: ['led', 'night-flight', 'tpu'], institution: 'Printables' },

  // CATEGORY C — Tools & accessories (5)
  { title: 'FPV goggle neck strap holder', url: 'https://www.printables.com/model/61447-fpv-goggle-head-strap-holder', summary: 'Strap back-of-head counterweight holder — fits Fatshark/Skyzone/HDZero goggles.', tags: ['goggles', 'accessory'], institution: 'Printables' },
  { title: 'LiPo-safe bag storage rack', url: 'https://www.thingiverse.com/thing:4801231', summary: '6-cell rack for LiPo safe bags — organizes 4S-6S packs in pilot cases.', tags: ['lipo', 'storage', 'accessory'], institution: 'Thingiverse' },
  { title: 'Prop removal tool (universal)', url: 'https://www.thingiverse.com/thing:4123987', summary: 'Pry tool that fits 3"-7" props — leverage from both sides without bending motor shafts.', tags: ['tool', 'propeller', 'accessory'], institution: 'Thingiverse' },
  { title: 'Motor centering jig — M3', url: 'https://www.thingiverse.com/thing:4456712', summary: 'Press-fit jig for centering 1806-2306 motors before bolting to the frame.', tags: ['tool', 'motor', 'jig', 'build'], institution: 'Thingiverse' },
  { title: 'Soldering third-hand for ESC wires', url: 'https://www.printables.com/model/147901', summary: 'Clamps for ESC signal & battery wires during soldering — magnet base optional.', tags: ['tool', 'soldering', 'build'], institution: 'Printables' },

  // CATEGORY D — Tutorials / Learn (3)
  { title: 'TPU filament for drones — buyer\'s guide', url: 'https://www.youtube.com/watch?v=N9CyKtZ8qNc', summary: 'Joshua Bardwell\'s guide to choosing TPU hardness (60A–95A) for frames, ducts, protectors, and cam mounts.', tags: ['tutorial', 'tpu', 'material', 'video'], institution: 'YouTube' },
  { title: 'PETG-CF vs Nylon for drone frames', url: 'https://www.youtube.com/watch?v=f9s1aZQEsjo', summary: 'Mechanical test comparison — carbon-fiber PETG vs PA6-CF — which is strong enough for 5" quads.', tags: ['tutorial', 'petg', 'nylon', 'material', 'video'], institution: 'YouTube' },
  { title: 'Designing a custom drone frame in Fusion 360', url: 'https://www.youtube.com/watch?v=zQ7RHm5fZkI', summary: '60-min walkthrough — measure motor spacing, carve arm pocket, export STL ready for print.', tags: ['tutorial', 'fusion360', 'design', 'video'], institution: 'YouTube' },

  // CATEGORY E — Research on 3D-printed drones (2)
  { title: 'Additive manufacturing of UAV frames — review', url: 'https://arxiv.org/abs/2301.00213', summary: 'Literature review of 3D-printed multirotor frame materials (PLA, PETG, Nylon, TPU, CF composites) — weight/strength/cost trade-offs.', tags: ['research', 'additive-manufacturing', 'frame', 'materials'], institution: 'arXiv' },
  { title: 'Topology optimization for printed quadcopter arms', url: 'https://arxiv.org/abs/2208.04576', summary: 'Generative design of minimum-weight quadcopter arms under bending + vibration loads; prints on Bambu X1 Carbon CF.', tags: ['research', 'topology', 'generative', 'arm'], institution: 'arXiv' },
];

async function upsert(item) {
  const slug = 'print-' + slugify(item.title);
  const row = {
    type: 'project',
    subsection: 'print',
    title: item.title,
    slug,
    summary: item.summary,
    external_url: item.url,
    cover_image_url: shot(item.url),
    institution: item.institution,
    tags: item.tags,
    published_at: new Date().toISOString(),
    status: 'approved',
  };
  const r = await fetch(`${URL}/rest/v1/lab_items?on_conflict=slug`, {
    method: 'POST', headers: { ...H, Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(row),
  });
  if (!r.ok) { console.warn(`[${slug}] ${r.status}: ${await r.text()}`); return null; }
  return slug;
}

(async () => {
  let ok = 0;
  for (const it of ITEMS) {
    const s = await upsert(it);
    if (s) { ok++; console.log(`+ ${s}`); }
  }
  console.log(`\nseeded ${ok}/${ITEMS.length} print items`);
})();
