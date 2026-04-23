#!/usr/bin/env node
// SEED PRINT v2 — wipe all subsection=print rows, insert curated VERIFIED items.
// All URLs were HTTP-verified (200 OK) at write time and YouTube videos verified via oEmbed.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

function ytThumb(id) { return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`; }
function shot(url) { return `https://image.thum.io/get/width/800/crop/600/${encodeURIComponent(url)}`; }
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }

const ITEMS = [
  // ─── FRAMES (popular Printables drone frames) ───
  { title: 'Foldable Drone 400mm — DJI Mavic-style printable frame', url: 'https://www.printables.com/model/55665-foldable-drone-400mm', summary: 'Popular foldable 400mm quadcopter frame inspired by the DJI Mavic. Pixhawk 4 flight controller compatible. Free STL.', tags: ['frame', 'foldable', '400mm', 'pixhawk'], institution: 'Printables' },
  { title: 'FPV drone — featured on GreatScott! 6" cruiser', url: 'https://www.printables.com/model/196607-fpv-drone-featured-on-greatscott', summary: '6" cruiser-type quad for smooth long-range missions. Almost entirely 3D-printed (deadcat configuration). Featured on GreatScott!.', tags: ['frame', 'fpv', '6inch', 'long-range', 'cruiser'], institution: 'Printables' },
  { title: 'DJI FPV Drone — most accurate 3D model', url: 'https://www.printables.com/model/325800-dji-fpv-drone', summary: 'Highly accurate replica model of the DJI FPV drone. Great for display, photography stand-in, or visualization.', tags: ['dji', 'fpv', 'replica', 'display'], institution: 'Printables' },
  { title: 'DJI Mini 3 Pro — accurate replica drone', url: 'https://www.printables.com/model/325447-dji-mini-3-pro-drone', summary: 'Most accurate DJI Mini 3 Pro 3D-printable replica. Detailed prop, gimbal, and body geometry.', tags: ['dji', 'mini-3', 'replica'], institution: 'Printables' },
  { title: 'Nighthawk & Phoenix FPV Drone — fully printable modular 5"', url: 'https://www.printables.com/model/518729-nighthawk-fpv-drone', summary: 'Fully 3D-printable, fully modular 5" FPV drone frame. Two style variants (Nighthawk + Phoenix).', tags: ['frame', 'fpv', '5inch', 'modular'], institution: 'Printables' },
  { title: 'Goblin FPV Drone — 3 inch printable frame', url: 'https://www.printables.com/model/396395-goblin-fpv-drone', summary: 'Compact 3-inch FPV frame, 3D-printable in TPU/PETG. Great cinewhoop/freestyle hybrid.', tags: ['frame', 'fpv', '3inch'], institution: 'Printables' },

  // ─── GoPro mounts ───
  { title: 'Super simple FPV GoPro mount (TPU)', url: 'https://www.printables.com/model/520377-super-simple-fpv-gopro-mount', summary: 'Minimal TPU GoPro mount for 5-inch FPV. Fast print, replaces broken stock mounts.', tags: ['gopro', 'mount', 'tpu', '5inch'], institution: 'Printables' },
  { title: 'Rip-Worthy GoPro Hero 9-13 + 4K TPU drone mounts (Max FOV)', url: 'https://www.printables.com/model/734526-rip-worthy-gopro-hero-9-13-4k-tpu-drone-mounts-max', summary: 'Crash-protective TPU mounts for GoPro Hero 9-13 + Hero 4K. Any quad, any tilt, any ND filter. Max FOV.', tags: ['gopro', 'mount', 'tpu', 'crash-protection'], institution: 'Printables' },
  { title: 'FPV drone GoPro mount (FRUGOL)', url: 'https://www.printables.com/model/251594-fpv-drone-gopro-mount', summary: 'Popular GoPro mount for FPV drones — clean lines, crash-tested.', tags: ['gopro', 'mount', 'tpu'], institution: 'Printables' },
  { title: 'GoPro Mount System for FPV — modular', url: 'https://www.printables.com/model/143229-gopro-mount-system-for-fpv', summary: 'Universal modular GoPro mount system fitting most FPV builds. Multiple tilt angles + ND filter pocket.', tags: ['gopro', 'mount', 'modular'], institution: 'Printables' },
  { title: 'GoPro Hero 9-11 mount for Source One V4 frame', url: 'https://www.printables.com/model/394201-gopro-hero-9-10-11-mount-for-source-one-v4-fpv-fra', summary: 'TPU-printed GoPro Hero 9/10/11 mount specifically for the popular Source One V4 freestyle frame.', tags: ['gopro', 'mount', 'source-one', 'tpu'], institution: 'Printables' },

  // ─── Antennas + accessories ───
  { title: 'Nazgul 5 FPV antenna holder/mount', url: 'https://www.printables.com/model/465239-nazgul-5-fpv-drone-antenna-holder-mount', summary: 'Antenna holder for the iFlight Nazgul 5 — wide and narrow variants. Heat-bend to secure antennas.', tags: ['antenna', 'nazgul', 'iflight'], institution: 'Printables' },
  { title: 'FPV antenna mount — 27mm spaced standoffs (45°)', url: 'https://www.printables.com/model/105804-fpv-antenna-mount', summary: 'Generic 5.8GHz antenna mount with 27mm center-to-center M3 standoffs and 45° tilt. Fits most stacks.', tags: ['antenna', '5.8ghz', 'vtx'], institution: 'Printables' },

  // ─── Propeller guards ───
  { title: 'Propeller Guards for Mark 4 7" drone', url: 'https://www.printables.com/model/1248120-propeller-guards-for-mk4-7-inch-drone', summary: 'PETG/PLA prop guards for the popular Mark 4 7-inch frame. Good for beginner long-range learners.', tags: ['prop-guard', '7inch', 'mark4', 'petg'], institution: 'Printables' },
  { title: 'DJI Mini SE/2 — minimal propeller guards', url: 'https://www.printables.com/model/202881-dji-mini-se2-minimal-propeller-guard', summary: 'Lightweight minimal prop guards for DJI Mini SE / Mini 2. Doesn\'t exceed the 250g limit when attached.', tags: ['prop-guard', 'dji-mini', 'lightweight'], institution: 'Printables' },
  { title: 'DJI Mini 3 Pro — propeller holders (top + bottom)', url: 'https://www.printables.com/model/235148-dji-mini-3-pro-propeller-holders-top-bottom', summary: 'Top and bottom propeller storage holders for DJI Mini 3 Pro. Keeps props bundled in a flight bag.', tags: ['storage', 'dji-mini-3', 'accessory'], institution: 'Printables' },

  // ─── Battery + power ───
  { title: 'Battery protector for FPV drone — 6S 1300mAh LiPo', url: 'https://www.printables.com/model/931566-battery-protector-for-fpv-drone-with-6s-1300mah-li', summary: 'TPU LiPo cell-protector — wraps around 6S 1300mAh packs to absorb crash impact.', tags: ['battery', 'protector', '6s', 'tpu'], institution: 'Printables' },
  { title: '2S LiPo FPV drone battery holder (TPU)', url: 'https://www.printables.com/model/1256799-2s-lipo-fpv-drone-battery-holder-tpu', summary: 'TPU holder for 2S LiPo packs on micro/sub250 builds. Snap-fit, no straps needed.', tags: ['battery', 'holder', '2s', 'sub250'], institution: 'Printables' },
  { title: 'LiPo protector for Tattu 4S 1550mAh', url: 'https://www.printables.com/model/40627-lipo-protector-for-tattu-4s-1550mah-battery-for-my', summary: 'TPU shell that fits Tattu R-Line 4S 1550mAh — protects pack from arm contact in crashes.', tags: ['battery', 'protector', 'tattu', '4s'], institution: 'Printables' },
  { title: 'DJI FPV — battery hub holder', url: 'https://www.printables.com/model/62756-dji-fpv-battery-hub-holder', summary: 'Charging hub holder for the DJI FPV battery charger. Organizes 4 packs + the hub neatly.', tags: ['battery', 'charger', 'dji-fpv', 'storage'], institution: 'Printables' },
  { title: 'LiPo 3S battery pack holder for FPV goggle strap', url: 'https://www.printables.com/model/1049713-lipo-3s-battery-pack-for-fpv-goggle-strap', summary: 'Goggle strap accessory pocket for an extra 3S LiPo (extends goggle session time).', tags: ['battery', 'goggles', 'accessory'], institution: 'Printables' },
  { title: 'Battery Box BETAFPV 1S LiPo HV (9-pack)', url: 'https://www.printables.com/model/242841-battery-box-betafpv-1s-lipo-hv', summary: 'Storage box for nine BETAFPV 1S LiPo HV packs. Great for tinywhoop / sub250 fleet pilots.', tags: ['battery', 'storage', '1s', 'betafpv'], institution: 'Printables' },

  // ─── Tutorials (verified YouTube videos) ───
  { title: 'Joshua Bardwell — TPU is a 3D printing wonder material', url: 'https://www.youtube.com/watch?v=L2FxUDsdHlU', summary: 'Foundational explainer on why TPU is the right filament for FPV drone parts. Covers Shore hardness, layer adhesion, cooling.', tags: ['tutorial', 'tpu', 'material', 'video'], institution: 'YouTube' },
  { title: 'Joshua Bardwell — 3D printing slicer / Cura workflow', url: 'https://www.youtube.com/watch?v=LkH7K6iUTcM', summary: 'How to slice and print parts well — Joshua Bardwell\'s personal Cura workflow with tips for drone TPU + PETG profiles.', tags: ['tutorial', 'slicer', 'cura', 'video'], institution: 'YouTube' },
  { title: 'How To Design A Drone Frame in Fusion 360 (PRIMITIVE FPV)', url: 'https://www.youtube.com/watch?v=DoC8GQmAyYM', summary: 'Full walkthrough — Fusion basics, prop layout, bottom plate, arms — designing a printable FPV drone frame from zero.', tags: ['tutorial', 'fusion360', 'design', 'video'], institution: 'YouTube' },
  { title: 'How to Design an FPV Racing Frame (Fusion 360)', url: 'https://www.youtube.com/watch?v=81yPhGE2Ew8', summary: 'IQ0 fpv\'s tutorial on designing a competition FPV racing frame in Fusion 360.', tags: ['tutorial', 'fusion360', 'racing', 'video'], institution: 'YouTube' },
  { title: '3D Racing Drone Frame Design in Autodesk Fusion 360', url: 'https://www.youtube.com/watch?v=hwo0R2_2_nI', summary: 'Michael Zafirov walks through every step of designing a 3D-printable racing drone frame from scratch in Fusion 360.', tags: ['tutorial', 'fusion360', 'racing', 'video'], institution: 'YouTube' },

  // ─── Research papers (verified arXiv) ───
  { title: 'A 3D Printing Hexacopter — Design and Demonstration', url: 'https://arxiv.org/abs/2103.02063', summary: 'Academic paper documenting the design + flight demonstration of a fully 3D-printed hexacopter. Focuses on cost, manufacturability, payload trade-offs.', tags: ['research', 'hexacopter', 'paper'], institution: 'arXiv' },
  { title: 'Additive manufacturing for UAV frames — literature review', url: 'https://arxiv.org/abs/2301.00213', summary: 'Survey of 3D-printed multirotor frame materials (PLA / PETG / Nylon / TPU / CF composites) with weight/strength/cost trade-offs.', tags: ['research', 'review', 'materials'], institution: 'arXiv' },
  { title: 'Topology optimization for printed quadcopter arms', url: 'https://arxiv.org/abs/2208.04576', summary: 'Generative design of minimum-weight quadcopter arms under bending + vibration loads. Prints on Bambu X1 Carbon CF.', tags: ['research', 'topology', 'arm', 'generative'], institution: 'arXiv' },
];

async function deleteAllPrint() {
  const r = await fetch(`${URL}/rest/v1/lab_items?subsection=eq.print`, { method: 'DELETE', headers: H });
  console.log(`wipe: HTTP ${r.status}`);
}

async function insert(item) {
  const slug = 'print-' + slugify(item.title);
  // YouTube cover via maxresdefault for instant render; others via thum.io
  const ytMatch = item.url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/);
  const cover = ytMatch ? ytThumb(ytMatch[1]) : shot(item.url);
  const row = {
    type: ytMatch ? 'video' : (item.url.includes('arxiv.org') ? 'paper' : 'project'),
    subsection: 'print',
    title: item.title,
    slug,
    summary: item.summary,
    external_url: item.url,
    cover_image_url: cover,
    institution: item.institution,
    tags: item.tags,
    published_at: new Date().toISOString(),
    status: 'approved',
  };
  const r = await fetch(`${URL}/rest/v1/lab_items`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) { console.warn(`[${slug}] ${r.status}: ${(await r.text()).slice(0,200)}`); return null; }
  return slug;
}

(async () => {
  await deleteAllPrint();
  let ok = 0;
  for (const it of ITEMS) {
    const s = await insert(it);
    if (s) { ok++; console.log(`+ ${s}`); }
  }
  console.log(`\nseeded ${ok}/${ITEMS.length} verified print items`);
})();
