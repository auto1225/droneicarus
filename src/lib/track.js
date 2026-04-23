const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getSessionId() {
  try {
    let id = localStorage.getItem('di:session');
    if (!id) {
      id = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('di:session', id);
    }
    return id;
  } catch { return 's_' + Date.now(); }
}

function parseUa(ua) {
  ua = ua || navigator.userAgent || '';
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /OPR\//.test(ua) ? 'Opera' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os =
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
    /Linux/.test(ua) ? 'Linux' : 'Other';
  const device =
    /iPad|Tablet/.test(ua) ? 'tablet' :
    /Mobile|Android|iPhone/.test(ua) ? 'mobile' : 'desktop';
  return { browser, os, device };
}

function parseUtm() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source:   p.get('utm_source') || null,
    utm_medium:   p.get('utm_medium') || null,
    utm_campaign: p.get('utm_campaign') || null,
    utm_term:     p.get('utm_term') || null,
    utm_content:  p.get('utm_content') || null,
  };
}

let _geoCache = null;
async function getGeo() {
  if (_geoCache !== null) return _geoCache;
  try {
    const cached = sessionStorage.getItem('di:geo');
    if (cached) { _geoCache = JSON.parse(cached); return _geoCache; }
  } catch {}
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (r.ok) {
      const j = await r.json();
      _geoCache = { country: j.country_name || j.country_code, region: j.region, city: j.city };
      try { sessionStorage.setItem('di:geo', JSON.stringify(_geoCache)); } catch {}
      return _geoCache;
    }
  } catch {}
  _geoCache = { country: null, region: null, city: null };
  return _geoCache;
}

let _lastPath = null;
let _lastTrackedAt = 0;

export async function trackPageview({ path, user, profile } = {}) {
  if (!KEY) return;
  const now = Date.now();
  if (path === _lastPath && now - _lastTrackedAt < 1500) return;
  _lastPath = path;
  _lastTrackedAt = now;

  const geo = await getGeo();
  const ua = parseUa();
  const utm = parseUtm();
  const sessionId = getSessionId();
  const body = {
    session_id: sessionId,
    user_id: user?.id || null,
    user_email: user?.email || null,
    user_handle: profile?.handle || null,
    user_role: profile?.role || null,
    is_member: !!user,
    path: path || window.location.hash || window.location.pathname || '/',
    full_url: window.location.href,
    referrer: document.referrer || null,
    ...utm,
    ...geo,
    user_agent: navigator.userAgent,
    ...ua,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
  };
  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      const url = `${SUPA_URL}/rest/v1/page_views?apikey=${encodeURIComponent(KEY)}`;
      navigator.sendBeacon(url, blob);
    } else {
      await fetch(`${SUPA_URL}/rest/v1/page_views`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body),
      });
    }
  } catch {}
}
