// src/App.jsx — main shell, hash routing, Tweaks panel
import React, { useState, useEffect, useRef } from 'react';

import { VIDEOS } from './data';
import { Header, Footer, Ic } from './components';
import { ToastStack } from './toast';

import { HomePage } from './pages/home';
import { PlayerPage } from './pages/player';
import { ExplorePage, SearchPage } from './pages/explore';
import { RankingsPage, CreatorsPage } from './pages/rankings';
import { CreatorDashboard } from './pages/creator';
import { UploadPage } from './pages/upload';
import { MyPage } from './pages/mypage';
import { AuthPage } from './pages/auth';
import { CheckoutPage, SuccessPage, OrdersPage, LicenseDetailPage } from './pages/checkout';
import { EarningsPage } from './pages/earnings';
import { SettingsPage } from './pages/settings';
import { PilotOnboardingPage } from './pages/pilot-onboarding';
import { ProfilePage } from './pages/profile';
import { MessagesPage } from './pages/messages';
import { NotificationsPage } from './pages/notifications';
import { CommissionPage } from './pages/commission';
import { GuidelinesPage, LegalPage, NotFoundPage } from './pages/static';
import { FlightLogPage } from './pages/flightlog';
import { AtlasPage } from './pages/atlas';
import { LivePage } from './pages/live';
import { CollectionPage } from './pages/collection';
import { LocationPage } from './pages/location';
import { PricingPage } from './pages/pricing';
import { ShotLibraryPage } from './pages/shotlibrary';
import { AdvancedPage } from './pages/advanced';

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

export default function App() {
  const [route, setRoute] = useState('home');
  const [routeParam, setRouteParam] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [query, setQuery] = useState('');
  const [pendingLoc, setPendingLoc] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);

  // Hash routing
  useEffect(() => {
    const parseHash = () => {
      const h = (window.location.hash || '#home').slice(1);
      const [r, id] = h.split('/');
      setRoute(r || 'home');
      setRouteParam(id || null);
      if (r === 'watch' && id) {
        const v = VIDEOS.find(x => x.id === id);
        if (v) setCurrentVideo(v);
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

  // Apply tweaks to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-density', tweaks.density);
    const accent = ACCENTS[tweaks.accent] || ACCENTS.sunset;
    Object.entries(accent).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    const fp = FONT_PAIRS[tweaks.fontPair] || FONT_PAIRS.display;
    document.documentElement.style.setProperty('--font-display', `'${fp.display}', Georgia, serif`);
    document.documentElement.style.setProperty('--font-ui', `'${fp.ui}', system-ui, sans-serif`);
  }, [tweaks]);

  // Claude Design edit-mode protocol (harmless if not embedded)
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
      {route === 'home' && <HomePage onOpenVideo={onOpenVideo} onNav={onNav} />}
      {route === 'watch' && <PlayerPage video={currentVideo} onNav={onNav} onOpenVideo={onOpenVideo} />}
      {route === 'explore' && <ExplorePage onOpenVideo={onOpenVideo} onNav={onNav} />}
      {route === 'rankings' && <RankingsPage onOpenVideo={onOpenVideo} />}
      {route === 'creators' && <CreatorsPage onOpenVideo={onOpenVideo} />}
      {route === 'creator' && <CreatorDashboard onNav={onNav} />}
      {route === 'search' && <SearchPage query={query} onOpenVideo={onOpenVideo} onNav={onNav} onSelectLoc={setPendingLoc} />}
      {route === 'upload' && <UploadPage onNav={onNav} />}
      {route === 'mypage' && <MyPage onOpenVideo={onOpenVideo} onNav={onNav} />}
      {route === 'signin' && <AuthPage onNav={onNav} />}
      {route === 'checkout' && <CheckoutPage videoId={routeParam} onNav={onNav} />}
      {route === 'success' && <SuccessPage onNav={onNav} />}
      {route === 'orders' && <OrdersPage onNav={onNav} />}
      {route === 'license' && <LicenseDetailPage orderId={routeParam} onNav={onNav} />}
      {route === 'earnings' && <EarningsPage onNav={onNav} />}
      {route === 'settings' && <SettingsPage onNav={onNav} />}
      {route === 'pilot-onboarding' && <PilotOnboardingPage onNav={onNav} />}
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
      {!['creator','pilot-onboarding','signin','messages','live'].includes(route) && <Footer />}

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
