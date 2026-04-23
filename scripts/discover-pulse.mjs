// scripts/discover-pulse.mjs — Lab "pulse" (drone industry news/regulations).
// Polls public RSS / Atom feeds, parses each item, dedupes by guid.

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

const FEEDS = [
  // Quality drone-focused news only (no Reddit — feeds were leaking raw HTML)
  { url: 'https://dronedj.com/feed/',                       source: 'DroneDJ',           tags: ['news'] },
  { url: 'https://www.suasnews.com/feed/',                  source: 'sUAS News',         tags: ['news','regulation'] },
  { url: 'https://dronelife.com/feed/',                     source: 'DroneLife',         tags: ['news'] },
  { url: 'https://www.unmannedsystemstechnology.com/feed/', source: 'UST News',          tags: ['news','industry'] },
  { url: 'https://www.unmannedairspace.info/feed/',         source: 'Unmanned Airspace', tags: ['news','regulation'] },
  { url: 'https://www.faa.gov/newsroom/rss/news-stories.xml',source: 'FAA',              tags: ['regulation','usa'] },
];

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

async function fetchExistingSlugs() {
  const rows = await sb('/rest/v1/lab_items?subsection=eq.pulse&select=slug&limit=2000');
  return new Set(rows.map(r => r.slug).filter(Boolean));
}

function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')   // unwrap CDATA
    .replace(/<!--[\s\S]*?-->/g, ' ')                    // strip HTML comments (incl. Reddit's <!-- SC_OFF -->)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')          // strip <style>
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')        // strip <script>
    .replace(/<[^>]+>/g, ' ')                              // strip all remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x?\d+;/g, ' ')
    .replace(/submitted by[\s\S]*$/i, '')                // drop Reddit "submitted by ..." trailer
    .replace(/\[link\][\s\S]*$/i, '')                   // drop Reddit "[link] [comments]" trailer
    .replace(/\s+/g, ' ').trim();
}

function parseFeed(xml, feedSource) {
  const out = [];
  // Try RSS items
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  if (itemBlocks.length) {
    for (const blk of itemBlocks) {
      const get = (re) => { const m = blk.match(re); return m ? m[1] : null; };
      const title = decode(get(/<title>([\s\S]*?)<\/title>/i));
      const link  = decode(get(/<link>([\s\S]*?)<\/link>/i));
      const desc  = decode(get(/<description>([\s\S]*?)<\/description>/i)).slice(0, 500);
      const pub   = get(/<pubDate>([\s\S]*?)<\/pubDate>/i) || get(/<dc:date>([\s\S]*?)<\/dc:date>/i);
      const guid  = decode(get(/<guid[^>]*>([\s\S]*?)<\/guid>/i)) || link;
      if (title && link && guid) out.push({ title, link, desc, pub, guid });
    }
    return out;
  }
  // Atom <entry>
  const entries = xml.split(/<entry[\s>]/i).slice(1);
  for (const blk of entries) {
    const get = (re) => { const m = blk.match(re); return m ? m[1] : null; };
    const title = decode(get(/<title[^>]*>([\s\S]*?)<\/title>/i));
    const linkAttr = (blk.match(/<link[^>]*href="([^"]+)"/i) || [])[1];
    const desc = decode(get(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
                     || get(/<content[^>]*>([\s\S]*?)<\/content>/i)).slice(0, 500);
    const pub = get(/<published>([\s\S]*?)<\/published>/i) || get(/<updated>([\s\S]*?)<\/updated>/i);
    const guid = decode(get(/<id>([\s\S]*?)<\/id>/i)) || linkAttr;
    if (title && linkAttr && guid) out.push({ title, link: linkAttr, desc, pub, guid });
  }
  return out;
}

function svgPlaceholder(item, tagBg = '#1f2a3a') {
  const title = (item.title || '').slice(0, 100).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const inst = (item.institution || '').slice(0, 36);
  const lines = [];
  let cur = '';
  for (const w of title.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length <= 28) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  const lns = lines.slice(0, 4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${tagBg}"/><stop offset="100%" stop-color="#0a0f14"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><rect x="40" y="46" width="4" height="24" fill="#5fa8d3"/><text x="56" y="64" fill="#5fa8d3" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" letter-spacing="2">PULSE</text>${lns.map((l,i)=>`<text x="40" y="${160+44*i}" fill="#f5ede0" font-family="Inter Tight, Inter, sans-serif" font-size="26" font-weight="700">${l}</text>`).join('')}<text x="40" y="${160+44*lns.length+28}" fill="#d1c8b5" font-family="Inter Tight, Inter, sans-serif" font-size="14" opacity="0.85">${inst}</text><text x="40" y="340" fill="#d1c8b5" font-family="'JetBrains Mono', monospace" font-size="10" opacity="0.5" letter-spacing="1.5">DRONEICARUS · LAB · PULSE</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

(async () => {
  console.log('[discover-pulse] starting');
  const seen = await fetchExistingSlugs();
  console.log(`[discover-pulse] existing slugs: ${seen.size}`);
  let inserted = 0, errors = 0;

  for (const feed of FEEDS) {
    let xml;
    try {
      const r = await fetch(feed.url, { headers: { 'User-Agent': 'droneicarus-bot/1.0', 'Accept': 'application/rss+xml,application/atom+xml,*/*' } });
      if (!r.ok) { console.warn(`  ${feed.source} ${r.status}`); errors++; continue; }
      xml = await r.text();
    } catch (e) { console.warn(`  ${feed.source} err: ${e.message}`); errors++; continue; }

    const items = parseFeed(xml, feed.source);
    let added = 0;
    for (const it of items.slice(0, 20)) {  // top 20 most recent per feed
      const slug = `pulse-${Buffer.from(it.guid).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 40).toLowerCase()}`;
      if (seen.has(slug)) continue;
      const item = {
        type: 'news',
        subsection: 'pulse',
        title: it.title.slice(0, 200),
        slug,
        summary: it.desc,
        external_url: it.link,
        institution: feed.source,
        authors: [feed.source],
        published_at: it.pub ? new Date(it.pub).toISOString().slice(0, 10) : null,
        tags: feed.tags,
        status: 'approved',
      };
      item.cover_image_url = svgPlaceholder(item);
      try {
        await sb('/rest/v1/lab_items', { method: 'POST', body: item, prefer: 'return=minimal' });
        seen.add(slug); inserted++; added++;
      } catch (e) {
        if (!String(e).includes('23505')) console.warn('  insert err:', e.message);
      }
    }
    console.log(`  + ${added} from ${feed.source}`);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`[discover-pulse] DONE — inserted: ${inserted}, feed errors: ${errors}`);
})();
