// scripts/build-sitemap.mjs — build public/sitemap.xml from DB content
// Uses anon key (reads approved videos + lab_items + locations via RLS-allowed SELECTs).

import { writeFile } from 'node:fs/promises';

const SUPA_URL = (process.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co').replace(/\/$/, '');
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const BASE = 'https://droneicarus.com';
const today = new Date().toISOString().slice(0, 10);
const MIN_LASTMOD = '2020-01-01';
// Clamp lastmod so Google doesn't flag ancient/future dates on the sitemap.
function clampDate(iso) {
  if (!iso) return today;
  const d = String(iso).slice(0, 10);
  if (d < MIN_LASTMOD) return today;   // ancient (e.g. 1932 arXiv paper) → use today
  if (d > today) return today;          // future (shouldn't happen, but guard)
  return d;
}

async function get(path) {
  try {
    const r = await fetch(`${SUPA_URL}${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (!r.ok) { console.warn(`  ${path} → ${r.status}`); return []; }
    return r.json();
  } catch (e) { console.warn(`  ${path} err:`, e.message); return []; }
}

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }

function urlEntry(loc, lastmod = today, priority = '0.5', changefreq = 'weekly', images = []) {
  const imgXml = images.map(img => `
    <image:image>
      <image:loc>${esc(img.url)}</image:loc>
      ${img.title ? `<image:title>${esc(img.title)}</image:title>` : ''}
    </image:image>`).join('');
  return `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imgXml}
  </url>`;
}

(async () => {
  console.log('[sitemap] starting');

  // Static routes
  const STATIC = [
    ['/',              '1.0', 'daily'],
    ['/#explore',      '0.9', 'daily'],
    ['/#shots',        '0.9', 'daily'],
    ['/#rankings',     '0.7', 'daily'],
    ['/#creators',     '0.7', 'weekly'],
    ['/#atlas',        '0.7', 'weekly'],
    ['/#lab',          '0.8', 'daily'],
    ['/#lab/research', '0.7', 'daily'],
    ['/#lab/patents',  '0.7', 'daily'],
    ['/#lab/projects', '0.7', 'daily'],
    ['/#lab/hardware', '0.6', 'weekly'],
    ['/#lab/learn',    '0.6', 'weekly'],
    ['/#lab/pulse',    '0.7', 'daily'],
    ['/#live',         '0.8', 'hourly'],
    ['/#livehelp',     '0.6', 'monthly'],
    ['/#pricing',      '0.7', 'weekly'],
    ['/#legal',        '0.3', 'monthly'],
    ['/#guidelines',   '0.3', 'monthly'],
    ['/#mystreams',    '0.3', 'weekly'],
  ];

  const entries = STATIC.map(([path, priority, freq]) => urlEntry(BASE + path, today, priority, freq));

  // Videos — each clip deserves its own URL
  const videos = await get('/rest/v1/videos?select=id,slug,title,thumb_url,youtube_id,published_at&status=eq.published&limit=5000');
  for (const v of videos) {
    const img = v.thumb_url || (v.youtube_id ? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg` : null);
    entries.push(urlEntry(
      `${BASE}/#watch/${v.id}`,
      clampDate(v.published_at),
      '0.7', 'weekly',
      img ? [{ url: img, title: v.title }] : []
    ));
  }

  // Lab items — papers, patents, projects, etc.
  const labs = await get('/rest/v1/lab_items?select=id,title,cover_image_url,published_at&status=eq.approved&limit=5000');
  for (const l of labs) {
    entries.push(urlEntry(
      `${BASE}/#lab-item/${l.id}`,
      clampDate(l.published_at),
      '0.6', 'monthly',
      l.cover_image_url ? [{ url: l.cover_image_url, title: l.title }] : []
    ));
  }

  // Locations — landmark pages (if accessible)
  const locations = await get('/rest/v1/locations?select=id,name&limit=1000');
  for (const loc of locations) {
    entries.push(urlEntry(`${BASE}/#location/${loc.id}`, today, '0.6', 'weekly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;

  await writeFile('public/sitemap.xml', xml);
  console.log(`[sitemap] DONE — ${entries.length} URLs (${videos.length} videos, ${labs.length} lab items, ${locations.length} locations)`);
})();
