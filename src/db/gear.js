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

// ─── Comments ───
export async function fetchDroneComments(slug) {
  const rows = await get(
    `/rest/v1/drone_comments?select=id,drone_slug,parent_id,author_name,body,created_at,likes&drone_slug=eq.${encodeURIComponent(slug)}&status=eq.published&order=created_at.asc&limit=500`
  );
  return rows;
}

export async function postDroneComment({ slug, parent_id, author_name, body }) {
  if (!SUPA_URL || !SUPA_KEY) return null;
  if (!author_name?.trim() || !body?.trim()) return null;
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/drone_comments', {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify({
        drone_slug: slug,
        parent_id: parent_id || null,
        author_name: author_name.trim().slice(0, 60),
        body: body.trim().slice(0, 2000),
        status: 'published',
      }),
    });
    if (!r.ok) { console.warn('[comment]', r.status); return null; }
    const arr = await r.json();
    return Array.isArray(arr) ? arr[0] : arr;
  } catch (e) { console.warn('[comment]', e.message); return null; }
}

// Appended to src/db/gear.js

export async function fetchDroneRatingStats({ limit = 100, min_count = 1, category } = {}) {
  const parts = [
    'select=drone_slug,name,manufacturer,category,subcategory,image_url,price_usd_min,price_usd_max,release_year,rating_count,avg_score,fresh_pct,tomato_status,tomato_score',
    `rating_count=gte.${min_count}`,
    'order=tomato_score.desc.nullslast,rating_count.desc',
    `limit=${limit}`,
  ];
  if (category && category !== 'all') parts.push(`category=eq.${encodeURIComponent(category)}`);
  return get('/rest/v1/drone_rating_stats?' + parts.join('&'));
}

export async function fetchDroneRatingsFor(slug) {
  return get(`/rest/v1/drone_ratings?select=id,score,review,created_at,user_id&drone_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&limit=500`);
}

export async function fetchMyRating(slug, accessToken) {
  if (!SUPA_URL || !SUPA_KEY || !accessToken) return null;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/drone_ratings?select=id,score,review&drone_slug=eq.${encodeURIComponent(slug)}&limit=1`, {
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + accessToken },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0] ?? null;
  } catch (e) { return null; }
}

export async function submitDroneRating({ slug, score, review }, accessToken) {
  if (!SUPA_URL || !SUPA_KEY || !accessToken) return { error: 'not_authenticated' };
  if (!slug || score < 1 || score > 10) return { error: 'invalid_score' };
  try {
    // Upsert by (drone_slug, user_id) unique constraint
    const r = await fetch(`${SUPA_URL}/rest/v1/drone_ratings?on_conflict=drone_slug,user_id`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify({
        drone_slug: slug,
        score,
        review: review?.trim()?.slice(0, 2000) || null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!r.ok) {
      const body = await r.text();
      return { error: body };
    }
    const arr = await r.json();
    return { rating: Array.isArray(arr) ? arr[0] : arr };
  } catch (e) {
    return { error: e.message };
  }
}

export async function deleteMyRating(slug, accessToken) {
  if (!SUPA_URL || !SUPA_KEY || !accessToken) return false;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/drone_ratings?drone_slug=eq.${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + accessToken },
    });
    return r.ok;
  } catch (e) { return false; }
}
