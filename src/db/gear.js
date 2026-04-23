// src/db/gear.js — drone product catalog access via raw REST
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function get(path) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const r = await fetch(SUPA_URL + path, {
    headers: {
      apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY,
      'Range-Unit': 'items', Range: '0-9999',
    },
  });
  if (!r.ok) { console.warn('[gear]', path, r.status); return []; }
  return r.json();
}

export async function fetchDroneProducts({ category, manufacturer } = {}) {
  const parts = [
    'select=id,slug,name,manufacturer,category,subcategory,image_url,price_usd_min,price_usd_max,release_year,country_of_origin,specs,highlights,tags,featured',
    'status=eq.published',
    'order=featured.desc,manufacturer.asc,name.asc',
  ];
  if (category && category !== 'all') parts.push(`category=eq.${encodeURIComponent(category)}`);
  if (manufacturer) parts.push(`manufacturer=eq.${encodeURIComponent(manufacturer)}`);
  return get('/rest/v1/drone_products?' + parts.join('&'));
}

export async function fetchDroneProduct(slug) {
  const rows = await get(`/rest/v1/drone_products?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] || null;
}

export async function fetchGearAds() {
  const rows = await get('/rest/v1/ads?select=id,title,brand,image_url,click_url,cta_label&active=eq.true&placement=eq.gear-sidebar&order=created_at.desc&limit=8');
  return rows;
}
