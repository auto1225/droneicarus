// src/lib/seo.js — update <head> meta per route (titles, descriptions, canonical, og:*)
const BASE_URL = 'https://droneicarus.com';

const ROUTE_META = {
  home:        { title: 'Aerial footage, mapped worldwide', desc: 'Browse drone footage on an interactive world map. License cinematic clips from verified pilots — pilots keep 70%, no subscriptions.' },
  explore:     { title: 'Explore drone footage by category', desc: 'Thousands of aerial drone clips sorted by category: cityscape, mountain, ocean, desert, forest. Filter by resolution, license tier, location.' },
  shots:       { title: 'Drone clip library', desc: 'Every aerial clip on droneicarus. Search, sort, and license 4K / 5K / 8K drone shots from pilots worldwide.' },
  rankings:    { title: 'Top drone pilots & clips', desc: 'Most-licensed aerial drone clips and highest-earning pilots this week, month, and year.' },
  creators:    { title: 'Verified drone pilots', desc: 'Discover drone pilots by location and specialty. Hire for commissions or license their existing catalog.' },
  atlas:       { title: 'Atlas — unclaimed aerial locations', desc: 'Crowdsourced bounties for aerial footage we don\'t yet have. Claim a bounty, deliver the clip, keep the purse.' },
  lab:         { title: 'Drone Lab — research, patents, projects', desc: 'A hub for drone research papers, patents, open-source firmware, hardware reviews, tutorials, and industry news.' },
  live:        { title: 'Live drone broadcasts', desc: 'Watch pilots flying right now. Chat, tip with Super Chat, discover new aerial creators.' },
  livehelp:    { title: 'How live broadcasting works', desc: 'Stream to YouTube, mirror on droneicarus, chat with your viewers, earn 70% of every Super Chat tip.' },
  pricing:     { title: 'Pricing — pilots keep 70%', desc: 'Two revenue streams, one flat split: clip licensing (buyers set budget, pilots set price) and live Super Chat tips — pilots always keep 70%.' },
  mystreams:   { title: 'My streams', desc: 'Your past broadcasts and Super Chat earnings.' },
  legal:       { title: 'Licensing & legal', desc: 'Drone Icarus marketplace terms, license tiers (personal → exclusive), DMCA, and payout policy.' },
  guidelines:  { title: 'Pilot code of conduct', desc: 'Airspace, permits, privacy, and safety rules every droneicarus pilot agrees to.' },
  upload:      { title: 'Upload your drone footage', desc: 'Drop in a master file or paste an external host link. Set a price per license tier, keep 70%.' },
  watch:       { title: 'Drone clip', desc: 'Watch this drone footage on droneicarus.' },
  'lab-item':  { title: 'Lab item', desc: 'Research, project, patent, or tutorial on droneicarus Lab.' },
  location:    { title: 'Location', desc: 'Aerial drone footage from this landmark.' },
  admin:       { title: 'Admin · CMS',      desc: 'droneicarus operations.', noIndex: true },
  signin:      { title: 'Sign in',          desc: 'Sign in to droneicarus.',  noIndex: true },
  settings:    { title: 'Settings',         desc: 'Account settings.',         noIndex: true },
  orders:      { title: 'Orders & licenses',desc: 'Your licensed clips.',     noIndex: true },
  earnings:    { title: 'Earnings',         desc: 'Your earnings dashboard.', noIndex: true },
  checkout:    { title: 'Checkout',         desc: 'Complete your purchase.',  noIndex: true },
  success:     { title: 'Purchase complete', desc: '',                         noIndex: true },
  mypage:      { title: 'My collections',   desc: '',                          noIndex: true },
  messages:    { title: 'Messages',         desc: '',                          noIndex: true },
  notifications: { title: 'Notifications',  desc: '',                          noIndex: true },
  profile:     { title: 'Profile', desc: '', noIndex: false },
};

function ensureMeta(name, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  return el;
}

function setMeta(name, value, attr = 'name') {
  if (value == null) return;
  ensureMeta(name, attr).setAttribute('content', String(value));
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', url);
}

export function applyRouteSEO({ route, routeParam, videoTitle, labTitle, locationName }) {
  const meta = ROUTE_META[route] || { title: route, desc: 'droneicarus — aerial footage, mapped.' };
  let title = meta.title;
  let desc = meta.desc;

  // Dynamic content overrides
  if (route === 'watch' && videoTitle) title = videoTitle;
  else if (route === 'lab-item' && labTitle) title = labTitle;
  else if (route === 'location' && locationName) title = locationName;

  const fullTitle = title ? `${title} · droneicarus` : 'droneicarus — aerial footage, mapped.';
  document.title = fullTitle;

  const url = BASE_URL + '/' + (routeParam ? `#${route}/${routeParam}` : (route === 'home' ? '' : `#${route}`));
  setCanonical(url);

  setMeta('description', desc);
  setMeta('og:title',       fullTitle, 'property');
  setMeta('og:description', desc,      'property');
  setMeta('og:url',         url,       'property');
  setMeta('og:type',        route === 'watch' ? 'video.other' : 'website', 'property');

  setMeta('twitter:title',       fullTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:card',        'summary_large_image');

  setMeta('robots', meta.noIndex ? 'noindex, nofollow' : 'index, follow');
}

// Inject JSON-LD structured data for video pages
export function setVideoJsonLd(video) {
  const existing = document.getElementById('jsonld-video');
  if (existing) existing.remove();
  if (!video) return;
  const ytThumb = video.youtube_id ? `https://i.ytimg.com/vi/${video.youtube_id}/maxresdefault.jpg` : null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: video.thumb_url || ytThumb,
    uploadDate: video.published_at || video.created_at,
    duration: video.duration_s ? `PT${Math.floor(video.duration_s/60)}M${video.duration_s%60}S` : undefined,
    contentUrl: video.youtube_id ? `https://www.youtube.com/watch?v=${video.youtube_id}` : undefined,
    embedUrl: video.youtube_id ? `https://www.youtube.com/embed/${video.youtube_id}` : undefined,
  };
  const script = document.createElement('script');
  script.id = 'jsonld-video';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}
