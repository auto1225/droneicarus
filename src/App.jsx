// src/App.jsx — main shell, hash routing, Tweaks panel
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

import { VIDEOS } from './data';
import { Header, Footer, Ic } from './components';
import { ToastStack, toast } from './toast';
import { RequireAuth } from './auth/RequireAuth';

// Heavy pages (map / uploader / player) are lazy-loaded so the initial bundle
// stays lean. The prototype was ~657KB as one chunk; with these splits the
// home bundle drops substantially and the browser parses other routes on demand.
const HomePage            = lazy(() => import('./pages/home').then(m => ({ default: m.HomePage })));
const PlayerPage          = lazy(() => import('./pages/player').then(m => ({ default: m.PlayerPage })));
const ExplorePage         = lazy(() => import('./pages/explore').then(m => ({ default: m.ExplorePage })));
const SearchPage          = lazy(() => import('./pages/explore').then(m => ({ default: m.SearchPage })));
const RankingsPage        = lazy(() => import('./pages/rankings').then(m => ({ default: m.RankingsPage })));
const CreatorsPage        = lazy(() => import('./pages/rankings').then(m => ({ default: m.CreatorsPage })));
const CreatorDashboard    = lazy(() => import('./pages/creator').then(m => ({ default: m.CreatorDashboard })));
const UploadPage          = lazy(() => import('./pages/upload').then(m => ({ default: m.UploadPage })));
const MyPage              = lazy(() => import('./pages/mypage').then(m => ({ default: m.MyPage })));
const AuthPage            = lazy(() => import('./pages/auth').then(m => ({ default: m.AuthPage })));
const CheckoutPage        = lazy(() => import('./pages/checkout').then(m => ({ default: m.CheckoutPage })));
const SuccessPage         = lazy(() => import('./pages/checkout').then(m => ({ default: m.SuccessPage })));
const OrdersPage          = lazy(() => import('./pages/checkout').then(m => ({ default: m.OrdersPage })));
const LicenseDetailPage   = lazy(() => import('./pages/checkout').then(m => ({ default: m.LicenseDetailPage })));
const EarningsPage        = lazy(() => import('./pages/earnings').then(m => ({ default: m.EarningsPage })));
const SettingsPage        = lazy(() => import('./pages/settings').then(m => ({ default: m.SettingsPage })));
const PilotOnboardingPage = lazy(() => import('./pages/pilot-onboarding').then(m => ({ default: m.PilotOnboardingPage })));
const ProfilePage         = lazy(() => import('./pages/profile').then(m => ({ default: m.ProfilePage })));
const MessagesPage        = lazy(() => import('./pages/messages').then(m => ({ default: m.MessagesPage })));
const NotificationsPage   = lazy(() => import('./pages/notifications').then(m => ({ default: m.NotificationsPage })));
const CommissionPage      = lazy(() => import('./pages/commission').then(m => ({ default: m.CommissionPage })));
const GuidelinesPage      = lazy(() => import('./pages/static').then(m => ({ default: m.GuidelinesPage })));
const LegalPage           = lazy(() => import('./pages/static').then(m => ({ default: m.LegalPage })));
const FlightLogPage       = lazy(() => import('./pages/flightlog').then(m => ({ default: m.FlightLogPage })));
const AtlasPage           = lazy(() => import('./pages/atlas').then(m => ({ default: m.AtlasPage })));
const LivePage            = lazy(() => import('./pages/live').then(m => ({ default: m.LivePage })));
const CollectionPage      = lazy(() => import('./pages/collection').then(m => ({ default: m.CollectionPage })));
const LocationPage        = lazy(() => import('./pages/location').then(m => ({ default: m.LocationPage })));
const PricingPage         = lazy(() => import('./pages/pricing').then(m => ({ default: m.PricingPage })));
const ShotLibraryPage     = lazy(() => import('./pages/shotlibrary').then(m => ({ default: m.ShotLibraryPage })));
const AdvancedPage        = lazy(() => import('./pages/advanced').then(m => ({ default: m.AdvancedPage })));
const NotFoundPage        = lazy(() => import('./pages/static').then(m => ({ default: m.NotFoundPage })));
const AdminShell          = lazy(() => import('./pages/admin/AdminShell').then(m => ({ default: m.AdminShell })));
const RequireAdminM       = lazy(() => import('./auth/RequireAdmin').then(m => ({ default: m.RequireAdmin })));

const TWEAK_DEFAULTS = {
  theme: 'light',
  density: 'comfortable',
  accent: 'sunset',
  mapStyle: 'dark',
  heroAutoplay: true,
  language: 'en',
  fontPair: 'display',
};

const ACCENTS = {
  sunset: { '--sunset': '#d97045', '--sunset-deep': '#b5532f', '--amber': '#e8b04a' },
  cobalt: { '--sunset': '#3b82f6', '--sunset-deep': '#2563eb', '--amber': '#60a5fa' },
  moss:   { '--sunset': '#6b8e4e', '--sunset-deep': '#4a6741', '--amber': '#a8c074' },
  crimson:{ '--sunset': '#c73e3e', '--sunset-deep': '#8b2020', '--amber': '#e8a04a' },
};

const FONT_PAIRS = {
  display:   { display: 'Bricolage Grotesque', ui: 'Inter Tight' },
  editorial: { display: 'Fraunces',             ui: 'Inter Tight' },
  tech:      { display: 'Space Grotesk',        ui: 'IBM Plex Sans' },
};

function RouteFallback() {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>
      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Loading…</div>
    </div>
  );
}


// ── Chunk-reload boundary ────────────────────────────────────────────
// When a new build is deployed, old tabs keep referencing stale chunk
// hashes. If Vite fails to fetch a lazy chunk we reload the page *once*
// so the user silently picks up the new index.js and its matching chunks.
const STALE_RELOAD_KEY = 'di-stale-reloaded-once';
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    const msg = String(error?.message || '');
    const isChunkMiss = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(msg);
    if (isChunkMiss) {
      // Reload only once per session to avoid infinite loops on real outages
      if (!sessionStorage.getItem(STALE_RELOAD_KEY)) {
        sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
        // Strip any stale ?v= cache buster the old tab might have had
        const u = new URL(window.location.href);
        u.searchParams.set('v', String(Date.now()).slice(-6));
        window.location.replace(u.toString());
      }
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment)', fontFamily: 'var(--font-ui)' }}>
          <div className="eyebrow" style={{ color: 'var(--amber)', marginBottom: 12 }}>LOADING…</div>
          <h2 style={{ fontSize: 24, marginBottom: 10 }}>Updating to the latest version</h2>
          <p style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 20 }}>One moment — we just shipped a new release, refreshing now.</p>
          <button onClick={() => { sessionStorage.removeItem(STALE_RELOAD_KEY); window.location.reload(); }} style={{ padding: '10px 18px', background: 'var(--amber)', color: '#1a2820', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Reload now</button>
        </div>
      );
    }
    return this.props.children;
  }
}
// Also handle unhandled promise rejections globally (covers lazy() outside Suspense error-propagation paths)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (ev) => {
    const msg = String(ev?.reason?.message || ev?.reason || '');
    if (/Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg)) {
      if (!sessionStorage.getItem(STALE_RELOAD_KEY)) {
        sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    }
  });
}

export default function App() {
  const [route, setRoute] = useState('home');
  const [routeParam, setRouteParam] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [query, setQuery] = useState('');
  const [pendingLoc, setPendingLoc] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);

  // Global placeholder-button handler — every <button data-placeholder="true">
  // emits a friendly toast instead of silently doing nothing.
  useEffect(() => {
    const onDocClick = (e) => {
      const btn = e.target.closest('button[data-placeholder="true"]');
      if (!btn) return;
      e.preventDefault();
      const label = (btn.innerText || btn.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) || 'Action';
      toast(label, 'This action will be available soon.', 'info');
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const parseHash = () => {
      const rawHash = (window.location.hash || '#home').slice(1);
      // Supabase OAuth / magic-link / recovery callback lands us on
      // '#access_token=...&refresh_token=...&...' or '#error=...'. Those
      // aren't real routes — treat them as 'home' while the SDK consumes
      // the tokens, then strip the hash so we don't re-enter this branch.
      if (/^(access_token=|refresh_token=|error=|error_code=|provider_token=|expires_in=|token_type=)/.test(rawHash)) {
        setRoute('home');
        setRouteParam(null);
        // Clean URL after Supabase has had a chance to parse it (~next tick)
        setTimeout(() => {
          if (window.location.hash && /access_token|refresh_token|error=/.test(window.location.hash)) {
            history.replaceState(null, '', window.location.pathname + window.location.search + '#home');
          }
        }, 300);
        return;
      }
      const h = rawHash;
      const [r, id] = h.split('/');
      setRoute(r || 'home');
      setRouteParam(id || null);
      if (r === 'watch' && id) {
        const mock = VIDEOS.find(x => x.id === id);
        if (mock) {
          setCurrentVideo(mock);
        } else {
          // Not in mock — probably a real Supabase-uploaded UUID. Fetch live.
          setCurrentVideo(null);
          import('./db/videos').then(({ fetchVideo }) => {
            fetchVideo(id).then(v => v && setCurrentVideo(v));
          });
        }
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const onNav = (r, id) => {
    let h = r;
    if (r === 'watch' && currentVideo) h = `watch/${currentVideo.id}`;
    else if (id) h = `${r}/${id}`;
    window.location.hash = h;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const onOpenVideo = (v) => {
    setCurrentVideo(v);
    window.location.hash = `watch/${v.id}`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-density', tweaks.density);
    const accent = ACCENTS[tweaks.accent] || ACCENTS.sunset;
    Object.entries(accent).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    const fp = FONT_PAIRS[tweaks.fontPair] || FONT_PAIRS.display;
    document.documentElement.style.setProperty('--font-display', `'${fp.display}', Georgia, serif`);
    document.documentElement.style.setProperty('--font-ui', `'${fp.ui}', system-ui, sans-serif`);
  }, [tweaks]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch (_) {}
  };

  return (
    <>
      <Header route={route} onNav={onNav} query={query} setQuery={setQuery} />
      <ToastStack />
      <ChunkErrorBoundary><Suspense fallback={<RouteFallback />}>
        {route === 'home' && <HomePage onOpenVideo={onOpenVideo} onNav={onNav} />}
        {route === 'watch' && <PlayerPage video={currentVideo} onNav={onNav} onOpenVideo={onOpenVideo} />}
        {route === 'explore' && <ExplorePage onOpenVideo={onOpenVideo} onNav={onNav} />}
        {route === 'rankings' && <RankingsPage onOpenVideo={onOpenVideo} />}
        {route === 'creators' && <CreatorsPage onOpenVideo={onOpenVideo} />}
        {route === 'creator' && <RequireAuth onNav={onNav} message="Creator studio is for signed-in pilots."><CreatorDashboard onNav={onNav} /></RequireAuth>}
        {route === 'search' && <SearchPage query={query} onOpenVideo={onOpenVideo} onNav={onNav} onSelectLoc={setPendingLoc} />}
        {route === 'upload' && <RequireAuth onNav={onNav} message="Sign in to upload clips."><UploadPage onNav={onNav} /></RequireAuth>}
        {route === 'mypage' && <RequireAuth onNav={onNav} message="Sign in to view your collections."><MyPage onOpenVideo={onOpenVideo} onNav={onNav} /></RequireAuth>}
        {route === 'signin' && <AuthPage onNav={onNav} />}
        {route === 'checkout' && <RequireAuth onNav={onNav} message="Sign in to complete your purchase."><CheckoutPage videoId={routeParam} onNav={onNav} /></RequireAuth>}
        {route === 'success' && <SuccessPage onNav={onNav} />}
        {route === 'orders' && <RequireAuth onNav={onNav} message="Sign in to see your orders."><OrdersPage onNav={onNav} /></RequireAuth>}
        {route === 'license' && <RequireAuth onNav={onNav}><LicenseDetailPage orderId={routeParam} onNav={onNav} /></RequireAuth>}
        {route === 'earnings' && <RequireAuth onNav={onNav} message="Sign in to view your earnings."><EarningsPage onNav={onNav} /></RequireAuth>}
        {route === 'settings' && <RequireAuth onNav={onNav}><SettingsPage onNav={onNav} /></RequireAuth>}
        {route === 'pilot-onboarding' && <RequireAuth onNav={onNav}><PilotOnboardingPage onNav={onNav} /></RequireAuth>}
        {route === 'profile' && <ProfilePage handle={routeParam} onOpenVideo={onOpenVideo} onNav={onNav} />}
        {route === 'messages' && <MessagesPage onNav={onNav} />}
        {route === 'notifications' && <NotificationsPage onNav={onNav} />}
        {route === 'commission' && <CommissionPage onNav={onNav} />}
        {route === 'guidelines' && <GuidelinesPage onNav={onNav} />}
        {route === 'legal' && <LegalPage onNav={onNav} />}
        {route === 'flightlog' && <FlightLogPage videoId={routeParam} onNav={onNav} />}
        {route === 'atlas' && <AtlasPage onNav={onNav} />}
        {route === 'live' && <LivePage onNav={onNav} />}
        {route === 'collection' && <CollectionPage id={routeParam} onOpenVideo={onOpenVideo} onNav={onNav} />}
        {route === 'location' && <LocationPage id={routeParam} onOpenVideo={onOpenVideo} onNav={onNav} />}
        {route === 'pricing' && <PricingPage onNav={onNav} />}
        {route === 'shotlibrary' && <ShotLibraryPage onNav={onNav} onOpenVideo={onOpenVideo} />}
        {route === 'advanced' && <AdvancedPage onNav={onNav} onOpenVideo={onOpenVideo} />}
        {route === 'admin' && <RequireAdminM onNav={onNav}><AdminShell section={routeParam || 'dashboard'} onNav={onNav} /></RequireAdminM>}
        {!['home', 'watch', 'explore', 'rankings', 'creators', 'creator', 'search', 'upload', 'mypage', 'signin', 'checkout', 'success', 'orders', 'license', 'earnings', 'settings', 'pilot-onboarding', 'profile', 'messages', 'notifications', 'commission', 'guidelines', 'legal', 'flightlog', 'atlas', 'live', 'collection', 'location', 'pricing', 'shotlibrary', 'advanced', 'admin'].includes(route) && <NotFoundPage onNav={onNav} />}
      </Suspense></ChunkErrorBoundary>
      {!['creator','pilot-onboarding','signin','messages','live','admin'].includes(route) && <Footer onNav={onNav} />}

      {tweaksOpen && <TweaksPanel tweaks={tweaks} update={updateTweak} onClose={() => setTweaksOpen(false)} />}
    </>
  );
}

function TweaksPanel({ tweaks, update, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      width: 320,
      background: 'rgba(13, 20, 16, 0.96)',
      backdropFilter: 'blur(14px)',
      border: '1px solid var(--line-strong)',
      borderRadius: 6,
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
      color: 'var(--bone)',
      fontFamily: 'var(--font-ui)',
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }}/>
          <strong style={{ fontSize: 13, letterSpacing: '0.04em' }}>Tweaks</strong>
        </div>
        <button onClick={onClose} style={{ color: 'var(--parchment-dim)' }}><Ic.close/></button>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
        <TweakGroup label="Color theme">
          <TweakSeg opts={[['dark', 'Dark'], ['light', 'Light']]} value={tweaks.theme} onChange={v => update('theme', v)} />
        </TweakGroup>
        <TweakGroup label="Accent">
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(ACCENTS).map(([k, v]) => (
              <button key={k} onClick={() => update('accent', k)} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: v['--sunset'],
                border: tweaks.accent === k ? '2px solid var(--bone)' : '2px solid var(--line)',
                cursor: 'pointer',
              }} title={k}/>
            ))}
          </div>
        </TweakGroup>
        <TweakGroup label="Card density">
          <TweakSeg opts={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} value={tweaks.density} onChange={v => update('density', v)} />
        </TweakGroup>
        <TweakGroup label="Typography">
          <TweakSeg opts={[['display', 'Display'], ['editorial', 'Editorial'], ['tech', 'Tech']]} value={tweaks.fontPair} onChange={v => update('fontPair', v)} />
        </TweakGroup>
        <TweakGroup label="Language">
          <TweakSeg opts={[['en', 'English'], ['ko', '한국어']]} value={tweaks.language} onChange={v => update('language', v)} />
        </TweakGroup>
        <TweakGroup label="Hero map autoplay video">
          <TweakSeg opts={[[true, 'On'], [false, 'Off']]} value={tweaks.heroAutoplay} onChange={v => update('heroAutoplay', v)} />
        </TweakGroup>
      </div>
    </div>
  );
}

function TweakGroup({ label, children }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function TweakSeg({ opts, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 3, padding: 3 }}>
      {opts.map(([v, label]) => (
        <button key={String(v)} onClick={() => onChange(v)} style={{
          flex: 1, padding: '6px 10px', fontSize: 12,
          background: value === v ? 'var(--forest-700)' : 'transparent',
          color: value === v ? 'var(--bone)' : 'var(--parchment-dim)',
          borderRadius: 2,
        }}>{label}</button>
      ))}
    </div>
  );
}
