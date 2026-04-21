// data.jsx — mock data for Drone Icarus

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'cityscape', label: 'Cityscape' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'desert', label: 'Desert' },
  { id: 'forest', label: 'Forest' },
  { id: 'racing', label: 'FPV Racing' },
  { id: 'sports', label: 'Sports' },
  { id: 'war', label: 'Conflict Zone' },
  { id: 'fishing', label: 'Fishing' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'ruins', label: 'Ruins & Heritage' },
  { id: 'space', label: 'Stratosphere' },
  { id: 'weather', label: 'Storm Chasing' },
  { id: 'night', label: 'Night Flight' },
];

// Inline SVG icons per category
const CAT_ICONS = {
  all: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>),
  landscape: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 19l5-8 4 5 3-4 6 7z"/><circle cx="17" cy="6" r="2"/></svg>),
  cityscape: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21V10l5-3v3l5-3v4l7-2v12z"/></svg>),
  mountain: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 20l7-12 4 6 2-3 7 9z"/></svg>),
  ocean: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 9c3-2 5-2 8 0s5 2 8 0 2-2 4-0M2 15c3-2 5-2 8 0s5 2 8 0 2-2 4-0"/></svg>),
  desert: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 19c3-3 6-3 10 0s7 0 10-3M2 14c3-2 5-2 8 0"/><circle cx="18" cy="6" r="2.5"/></svg>),
  forest: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 20V14M8 14l-3 0 3-4-2 0 3-4 3 4-2 0 3 4-3 0"/><path d="M16 20V15M16 15l-2 0 2-3-1 0 2-3 2 3-1 0 2 3-2 0"/></svg>),
  racing: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12l18-8-7 18-3-7z"/></svg>),
  sports: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/></svg>),
  war: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 3v18M5 4h11l-3 4 3 4H5"/></svg>),
  fishing: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 15c3 3 9 3 12 0l3-3-3-3c-3-3-9-3-12 0"/><circle cx="8" cy="12" r="1"/></svg>),
  wildlife: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 9c0-3 2-5 4-3l3 3 3-3c2-2 4 0 4 3v2c0 4-3 8-7 8s-7-4-7-8z"/><circle cx="9" cy="12" r="0.8" fill="currentColor"/><circle cx="15" cy="12" r="0.8" fill="currentColor"/></svg>),
  ruins: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V9l4-4 4 4v11M12 20V12l4-4 4 4v8M4 20h16"/></svg>),
  space: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>),
  weather: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 15a4 4 0 010-8 5 5 0 019-2 4 4 0 012 8"/><path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3"/></svg>),
  night: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 14a8 8 0 11-10-10 6 6 0 0010 10z"/></svg>),
};

// Real-world landmarks with lat/lon — used for Leaflet pins
const LOCATIONS = [
  { id: 'pyramids', name: 'Giza Pyramids', country: 'Egypt', lat: 29.9792, lon: 31.1342, videos: 47, category: 'ruins', featured: true },
  { id: 'namsan', name: 'N Seoul Tower', country: 'South Korea', lat: 37.5512, lon: 126.9882, videos: 23, category: 'cityscape' },
  { id: 'everest', name: 'Mt. Everest Base Camp', country: 'Nepal', lat: 28.0026, lon: 86.8528, videos: 38, category: 'mountain', featured: true },
  { id: 'halong', name: 'Ha Long Bay', country: 'Vietnam', lat: 20.9101, lon: 107.1839, videos: 61, category: 'ocean' },
  { id: 'grandcanyon', name: 'Grand Canyon', country: 'USA', lat: 36.1069, lon: -112.1129, videos: 89, category: 'landscape', featured: true },
  { id: 'fuji', name: 'Mt. Fuji', country: 'Japan', lat: 35.3606, lon: 138.7274, videos: 54, category: 'mountain' },
  { id: 'sahara', name: 'Sahara, Merzouga', country: 'Morocco', lat: 31.0994, lon: -4.0131, videos: 29, category: 'desert' },
  { id: 'amazon', name: 'Amazon Basin', country: 'Brazil', lat: -3.4653, lon: -62.2159, videos: 34, category: 'forest' },
  { id: 'santorini', name: 'Santorini', country: 'Greece', lat: 36.3932, lon: 25.4615, videos: 76, category: 'cityscape' },
  { id: 'iceland', name: 'Jökulsárlón Glacier', country: 'Iceland', lat: 64.0784, lon: -16.2306, videos: 42, category: 'landscape', featured: true },
  { id: 'banff', name: 'Lake Moraine, Banff', country: 'Canada', lat: 51.3217, lon: -116.1860, videos: 51, category: 'mountain' },
  { id: 'dubai', name: 'Burj Khalifa', country: 'UAE', lat: 25.1972, lon: 55.2744, videos: 68, category: 'cityscape' },
  { id: 'taj', name: 'Taj Mahal', country: 'India', lat: 27.1751, lon: 78.0421, videos: 31, category: 'ruins' },
  { id: 'machu', name: 'Machu Picchu', country: 'Peru', lat: -13.1631, lon: -72.5450, videos: 44, category: 'ruins' },
  { id: 'sydney', name: 'Sydney Opera House', country: 'Australia', lat: -33.8568, lon: 151.2153, videos: 39, category: 'cityscape' },
  { id: 'victoria', name: 'Victoria Falls', country: 'Zimbabwe', lat: -17.9243, lon: 25.8572, videos: 27, category: 'landscape' },
  { id: 'kilimanjaro', name: 'Mt. Kilimanjaro', country: 'Tanzania', lat: -3.0674, lon: 37.3556, videos: 22, category: 'mountain' },
  { id: 'great-wall', name: 'Great Wall — Jinshanling', country: 'China', lat: 40.6769, lon: 117.2422, videos: 36, category: 'ruins' },
  { id: 'matterhorn', name: 'Matterhorn', country: 'Switzerland', lat: 45.9766, lon: 7.6585, videos: 58, category: 'mountain' },
  { id: 'bagan', name: 'Bagan Temples', country: 'Myanmar', lat: 21.1717, lon: 94.8585, videos: 19, category: 'ruins' },
  { id: 'maldives', name: 'Malé Atoll', country: 'Maldives', lat: 4.1755, lon: 73.5093, videos: 47, category: 'ocean' },
  { id: 'patagonia', name: 'Torres del Paine', country: 'Chile', lat: -50.9423, lon: -73.4068, videos: 33, category: 'mountain' },
  { id: 'yosemite', name: 'Yosemite Valley', country: 'USA', lat: 37.8651, lon: -119.5383, videos: 72, category: 'landscape' },
  { id: 'norway-fjord', name: 'Geirangerfjord', country: 'Norway', lat: 62.1010, lon: 7.2060, videos: 48, category: 'landscape' },
  { id: 'kyiv', name: 'Kyiv Outskirts', country: 'Ukraine', lat: 50.4501, lon: 30.5234, videos: 14, category: 'war' },
  { id: 'baja', name: 'Baja Peninsula FPV', country: 'Mexico', lat: 26.0444, lon: -111.3471, videos: 18, category: 'racing' },
  { id: 'alps-ski', name: 'Chamonix', country: 'France', lat: 45.9237, lon: 6.8694, videos: 41, category: 'sports' },
  { id: 'bali', name: 'Tegallalang Rice Terrace', country: 'Indonesia', lat: -8.4333, lon: 115.2782, videos: 55, category: 'landscape' },
];

// Videos — each maps to a location + category. thumbYt = real YouTube-style ID for embed.
// We use a curated set of public drone/scenic YouTube IDs.
const YT_POOL = [
  'dQw4w9WgXcQ', 'ScMzIvxBSi4', 'jfKfPfyJRdk', 'M7lc1UVf-VE',
  'aqz-KE-bpKQ', '2Vv-BfVoq4g', 'hFZFjoX2cGg', '09R8_2nJtjg',
  'kXYiU_JCYtU', 'OPf0YbXqDm0', 'fJ9rUzIMcZQ',
];

function makeVideo(id, locationId, cat, opts = {}) {
  const titles = [
    'Golden Hour Ascent', 'Cinematic Flight 4K', 'Dawn Patrol', 'Morning Thermals',
    'Above the Clouds', 'Silent Approach', 'Edge of the World', 'Valley Sweep',
    'Ridge Runner', 'Low & Fast', 'Night Vision Run', 'Storm Front',
    'Monsoon Pass', 'Winter Light', 'Raw FPV — No Cuts', 'Master Cut',
  ];
  const creators = [
    { handle: '@skywaltz', name: 'Sky Waltz', verified: true },
    { handle: '@aerialnomad', name: 'Aerial Nomad', verified: true },
    { handle: '@fpvrebel', name: 'FPV Rebel' },
    { handle: '@hyunwoo', name: 'Hyunwoo Park', verified: true },
    { handle: '@khaled.air', name: 'Khaled Air' },
    { handle: '@soaringclaire', name: 'Soaring Claire' },
    { handle: '@highaltitude', name: 'High Altitude Co.' },
    { handle: '@droneyomi', name: 'Drone Yomi' },
  ];
  const c = creators[id % creators.length];
  const ytId = YT_POOL[id % YT_POOL.length];
  const title = titles[id % titles.length];
  const duration = ['2:14','3:42','5:08','6:21','8:03','11:47','4:55','7:12','2:59'][id % 9];
  const views = [12400, 87200, 1_200_000, 342_000, 56_700, 9_300, 4_100_000, 233_000][id % 8];
  const days = [2, 5, 14, 28, 60, 120, 365, 4][id % 8];
  const price = opts.paid ? [4.99, 9.99, 14.99, 29.99][id % 4] : 0;
  const resolution = ['4K', '5.7K', '6K', '8K'][id % 4];
  const rank = opts.rank || null;
  return {
    id: `v${id}`,
    ytId,
    title: `${title} — ${title.length % 2 === 0 ? 'Aerial Study' : 'Director\u2019s Edit'}`,
    locationId,
    category: cat,
    creator: c,
    duration,
    views,
    uploadedDaysAgo: days,
    price,
    resolution,
    rank,
    likes: Math.round(views * 0.04),
    description: 'Shot on DJI Mavic 3 Pro Cine at golden hour. ND8 filter, 24fps, D-Log M color. Licensed for commercial use with attribution.',
    tags: [cat, 'cinematic', resolution, '24fps'],
  };
}

const VIDEOS = [];
let vidIdx = 0;
LOCATIONS.forEach((loc) => {
  const count = Math.min(loc.videos, 12);
  for (let i = 0; i < count; i++) {
    VIDEOS.push(makeVideo(vidIdx++, loc.id, loc.category, {
      paid: i % 3 === 0,
      rank: loc.featured && i < 3 ? i + 1 : null,
    }));
  }
});

// Trending — top 10 overall by views
const TRENDING = [...VIDEOS].sort((a, b) => b.views - a.views).slice(0, 10)
  .map((v, i) => ({ ...v, rank: i + 1 }));

// Featured creators
const CREATORS = [
  { handle: '@skywaltz', name: 'Sky Waltz', verified: true, followers: 482000, videos: 127, region: 'Global', earning: 24100 },
  { handle: '@aerialnomad', name: 'Aerial Nomad', verified: true, followers: 291000, videos: 89, region: 'Asia Pacific', earning: 17400 },
  { handle: '@fpvrebel', name: 'FPV Rebel', verified: false, followers: 88000, videos: 54, region: 'N. America', earning: 4200 },
  { handle: '@hyunwoo', name: 'Hyunwoo Park', verified: true, followers: 156000, videos: 73, region: 'Korea / Japan', earning: 11800 },
];

// Placeholder thumbnail generator — colorful gradient blocks for videos
// We derive a pseudo-random hue from the video id.
// Solid earth-tone swatch (no gradients) — derive a muted color from the seed
function thumbGradient(seed) {
  const palette = [
    '#3a4a3b', '#4a5a3e', '#5a5040', '#6b4a32', '#3d4a52',
    '#4a3d2e', '#2d3a2e', '#556b4a', '#4a3a42', '#3e4a54',
    '#5c4a38', '#424a3a', '#4a4238', '#363f3a', '#52463a',
  ];
  return palette[seed % palette.length];
}

Object.assign(window, { CATEGORIES, CAT_ICONS, LOCATIONS, VIDEOS, TRENDING, CREATORS, thumbGradient });

// ——— User & commerce mocks ———
const CURRENT_USER = {
  id: 'u_8f3a',
  name: 'Hyunwoo Park',
  handle: '@hyunwoo',
  email: 'hyunwoo@icarus.fly',
  initials: 'HW',
  pilotVerified: true,
  joined: 'Mar 2024',
  location: 'Seoul, KR',
  followers: 156000,
  following: 242,
  collections: 14,
  purchases: 31,
};

// Orders — realistic IDs & timestamps
function pick(arr, seed){ return arr[seed % arr.length]; }
const ORDERS = (() => {
  const paidVids = VIDEOS.filter(v => v.price > 0);
  const rows = [];
  const licenseTypes = ['Personal', 'Commercial', 'Extended'];
  const cards = ['Visa •• 4242', 'Mastercard •• 8831', 'PayPal · hyunwoo@icarus.fly', 'Amex •• 1005'];
  const months = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'];
  for (let i = 0; i < 18; i++) {
    const v = paidVids[i % paidVids.length];
    const lic = licenseTypes[i % 3];
    const mult = lic === 'Extended' ? 3.5 : lic === 'Commercial' ? 1.8 : 1;
    const sub = Math.round(v.price * mult * 100) / 100;
    const tax = Math.round(sub * 0.08 * 100) / 100;
    const total = Math.round((sub + tax) * 100) / 100;
    const id = `DI-${2026 - (i > 11 ? 1 : 0)}-${String(4821 + i * 17).padStart(5, '0')}`;
    const m = months[i % 12];
    const d = String(((i * 7) % 27) + 1).padStart(2, '0');
    const yr = i > 11 ? 2025 : 2026;
    const hh = String(((i * 11) % 23)).padStart(2, '0');
    const mm = String(((i * 29) % 60)).padStart(2, '0');
    rows.push({
      id, videoId: v.id, license: lic,
      subtotal: sub, tax, total,
      card: cards[i % cards.length],
      date: `${m} ${d}, ${yr} · ${hh}:${mm}`,
      sortKey: yr * 10000 + (i * 7 + 1),
      fileFormat: pick(['MP4 H.264','MP4 H.265','ProRes 422 HQ','ProRes 4444'], i),
      fileSize: pick(['1.8 GB','3.4 GB','6.2 GB','12.1 GB','24.8 GB'], i),
      status: i === 0 ? 'processing' : 'complete',
    });
  }
  return rows;
})();

// Collections (Pinterest-style boards)
const COLLECTIONS = [
  { id: 'c1', name: 'Dawn & Gold', count: 28, cover: ['v0','v3','v7','v12'], updated: '2d ago' },
  { id: 'c2', name: 'Coastal Vertical', count: 14, cover: ['v5','v18','v23','v31'], updated: '5d ago' },
  { id: 'c3', name: 'Ruins, Aerial', count: 22, cover: ['v9','v44','v55','v68'], updated: '1w ago' },
  { id: 'c4', name: 'Client: Nomad Air', count: 9, cover: ['v2','v14','v27','v40'], private: true, updated: '3w ago' },
  { id: 'c5', name: 'Reference — Color', count: 41, cover: ['v11','v22','v33','v45'], updated: '2mo ago' },
  { id: 'c6', name: 'To re-shoot', count: 6, cover: ['v17','v29','v52','v61'], private: true, updated: '4mo ago' },
];

// Payouts (pilot earnings)
const PAYOUTS = [
  { id: 'po_001', period: 'Mar 2026', gross: 4280.00, fees: 428.00, net: 3852.00, status: 'scheduled', eta: 'Apr 05, 2026', method: 'Wise · USD' },
  { id: 'po_002', period: 'Feb 2026', gross: 3917.50, fees: 391.75, net: 3525.75, status: 'paid', eta: 'Mar 05, 2026', method: 'Wise · USD' },
  { id: 'po_003', period: 'Jan 2026', gross: 5124.20, fees: 512.42, net: 4611.78, status: 'paid', eta: 'Feb 05, 2026', method: 'Wise · USD' },
  { id: 'po_004', period: 'Dec 2025', gross: 6288.90, fees: 628.89, net: 5660.01, status: 'paid', eta: 'Jan 05, 2026', method: 'Wise · USD' },
  { id: 'po_005', period: 'Nov 2025', gross: 2714.00, fees: 271.40, net: 2442.60, status: 'paid', eta: 'Dec 05, 2025', method: 'Wise · USD' },
  { id: 'po_006', period: 'Oct 2025', gross: 3402.10, fees: 340.21, net: 3061.89, status: 'paid', eta: 'Nov 05, 2025', method: 'Wise · USD' },
];

// Reviews (per video)
const REVIEWS = [
  { author: 'Marta L.', role: 'Creative Director, Nomad Co.', rating: 5, date: '2 weeks ago', text: 'Graded beautifully — dropped straight into a Samsung spot. Colorist barely had to touch it.' },
  { author: 'Kenji R.', role: 'Documentary editor', rating: 5, date: '1 month ago', text: 'Stable, clean highlights, plenty of handles at the head & tail. Shot log is honest.' },
  { author: 'Adaeze O.', role: 'Motion designer', rating: 4, date: '1 month ago', text: 'Gorgeous. Minor prop shadow at 00:07 but easy to clone out. Would buy from this pilot again.' },
  { author: 'Ben H.', role: 'Freelance filmmaker', rating: 5, date: '3 months ago', text: 'Worth every penny. The early-morning fog layer is exactly what my reel needed.' },
];

Object.assign(window, { CURRENT_USER, ORDERS, COLLECTIONS, PAYOUTS, REVIEWS });
