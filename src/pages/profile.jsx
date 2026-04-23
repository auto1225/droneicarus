// pages/profile.jsx — public creator profile (replaces old /creators single-page)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VIDEOS, CREATORS, thumbGradient } from '../data';
import { Ic, VideoCard, FollowButton } from '../components';
import { supabase } from '../supabase';
import { isFollowing, toggleFollow } from '../db/social';
import { toast } from '../toast';
const pUseState = useState;

export function ProfilePage({ handle, onOpenVideo, onNav }) {
  const mockCreator = (CREATORS || []).find(c => c.handle === handle || c.handle === '@' + handle) || CREATORS[0];
  const [creator, setCreator] = pUseState(mockCreator);
  const [dbVideos, setDbVideos] = pUseState(null);
  const [following, setFollowing] = pUseState(false);
  const [tab, setTab] = pUseState('clips');

  useEffect(() => {
    // Look up real profile by handle if it's prefixed with @
    const h = handle?.startsWith('@') ? handle : '@' + handle;
    if (!handle) return;
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', h)
        .maybeSingle();
      if (prof) {
        setCreator({
          handle: prof.handle,
          name: prof.display_name,
          verified: prof.pilot_verified,
          followers: prof.followers_count,
          videos: 0,
          region: prof.location,
          earning: 0,
          id: prof.id,
          avatarUrl: prof.avatar_url,
          bio: prof.bio,
        });
        // Fetch their videos
        const { data: vids } = await supabase
          .from('videos')
          .select('id, title, category, location_id, resolution, duration_s, views, likes, price_usd, yt_id, thumb_path, published_at')
          .eq('owner_id', prof.id)
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        setDbVideos((vids || []).map(v => ({
          id: v.id, ytId: v.yt_id, title: v.title, category: v.category, locationId: v.location_id,
          resolution: v.resolution, duration: v.duration_s ? `${Math.floor(v.duration_s/60)}:${String(v.duration_s%60).padStart(2,'0')}` : '',
          views: v.views, uploadedDaysAgo: v.published_at ? Math.round((Date.now() - new Date(v.published_at)) / 86400000) : 0,
          price: Number(v.price_usd) || 0, likes: v.likes,
          creator: { handle: prof.handle, name: prof.display_name, verified: prof.pilot_verified },
        })));
        isFollowing(prof.id).then(setFollowing).catch(() => {});
      }
    })();
  }, [handle]);

  const vids = (dbVideos && dbVideos.length ? dbVideos : VIDEOS.filter(v => v.creator.handle === creator.handle || v.creator.name === creator.name));
  const displayVids = vids.length ? vids : VIDEOS.slice(0, 12);

  const onToggleFollow = async () => {
    if (!creator.id) return;
    try {
      const now = await toggleFollow(creator.id);
      setFollowing(now);
      toast?.(now ? `Following ${creator.name}` : `Unfollowed ${creator.name}`);
    } catch (e) {
      toast?.('Sign in to follow', '', 'error');
      onNav?.('signin');
    }
  };

  const stats = {
    clips: displayVids.length,
    views: displayVids.reduce((s, v) => s + (v.views || 0), 0),
    licensed: Math.floor(displayVids.length * 38),
    countries: 14,
  };

  return (
    <div>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 380, overflow: 'hidden', background: thumbGradient(displayVids[0]?.id.charCodeAt(1) || 3), borderBottom: '1px solid var(--line)' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }} viewBox="0 0 1600 380" preserveAspectRatio="none">
          <g stroke="rgba(245,237,224,0.5)" fill="none" strokeWidth="0.6">
            {[...Array(14)].map((_, i) => (
              <path key={i} d={`M0 ${30 + i*30} Q400 ${10 + i*30} 800 ${40 + i*30} T1600 ${20 + i*30}`}/>
            ))}
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,20,16,0) 40%, rgba(13,20,16,0.9) 100%)' }}/>

        <div style={{ position: 'absolute', top: 22, left: 28, display: 'flex', gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: '#f5ede0', padding: '5px 10px', background: 'var(--thumb-overlay)', borderRadius: 2 }}>● LIVE BROADCASTING</span>
          <span className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--amber)', padding: '5px 10px', background: 'var(--thumb-overlay)', borderRadius: 2 }}>VERIFIED PILOT</span>
        </div>
      </div>

      {/* Profile meta bar — overlaps hero */}
      <div style={{ maxWidth: 1200, margin: '-100px auto 0', padding: '0 28px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', marginBottom: 30 }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: 'var(--sunset)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56, fontWeight: 700, color: '#faf6ec',
            border: '5px solid var(--ink)', boxShadow: 'var(--shadow-lg)',
            flexShrink: 0,
          }}>{creator.name[0]}</div>

          <div style={{ flex: 1, paddingBottom: 12 }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--parchment-dim)', marginBottom: 6 }}>
              AERIAL PILOT · BASED IN {creator.country?.toUpperCase() || 'SEOUL, KR'}
            </div>
            <h1 style={{ fontSize: 48, letterSpacing: '-0.02em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              {creator.name}
              <span style={{ color: 'var(--amber)' }}><Ic.check/></span>
            </h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--parchment-dim)', alignItems: 'center' }}>
              <span className="mono">{creator.handle}</span>
              <span>·</span>
              <span>Joined Mar 2023</span>
              <span>·</span>
              <span>{(creator.followers || 28400).toLocaleString()} followers</span>
              <span>·</span>
              <span>{displayVids.filter(v => v.price > 0).length} licensed clips</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingBottom: 12 }}>
            <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">Message</button>
            <button className="btn secondary" style={{ fontSize: 14 }} data-placeholder="true">Commission</button>
            <FollowButton creatorId={p?.id || handle} creatorHandle={p?.handle || handle} className="btn" style={{ fontSize: 14 }} />
          </div>
        </div>

        {/* Pull quote / bio — editorial */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, marginBottom: 40, paddingBottom: 30, borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.24em', color: 'var(--amber)', marginBottom: 14 }}>ON THE RECORD</div>
            <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', color: 'var(--bone)', marginBottom: 18 }}>
              "Shooting at 400 ft changes how you love a place. You stop seeing traffic and start seeing the way a river carved the valley over ten thousand years."
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--parchment)' }}>
              Seoul-based aerial cinematographer shooting for Netflix, Apple TV+, and the Korean Film Council. Specializes in coastal light, urban density, and the strange blue hour over industrial harbors. Has flown in 14 countries — most of it before breakfast.
            </p>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 12 }}>KIT</div>
            {[
              ['Primary', 'DJI Mavic 3 Pro Cine'],
              ['Indoor / tight', 'DJI Avata 2'],
              ['Weight-class', 'DJI Inspire 3 + Zenmuse X9'],
              ['Color science', 'D-Log M → Rec.709 via custom LUT'],
              ['Licenses', 'KCAA Commercial · FAA Part 107'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, padding: '7px 0', fontSize: 14, borderBottom: '1px solid var(--line)' }}>
                <span className="mono" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.1em', fontSize: 12, textTransform: 'uppercase' }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 40 }}>
          {[
            ['CLIPS PUBLISHED', stats.clips],
            ['TOTAL VIEWS', (stats.views / 1e6).toFixed(1) + 'M'],
            ['LICENSES SOLD', stats.licensed.toLocaleString()],
            ['COUNTRIES FLOWN', stats.countries],
          ].map(([k, v], i) => (
            <div key={k} style={{ padding: '22px 28px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 8 }}>{k}</div>
              <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
          {[
            ['clips', 'Clips · ' + displayVids.length],
            ['collections', 'Collections · 6'],
            ['map', 'Flight map'],
            ['about', 'About'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '12px 2px', marginBottom: -1, fontSize: 14,
              color: tab === k ? 'var(--bone)' : 'var(--parchment-dim)',
              borderBottom: tab === k ? '2px solid var(--amber)' : '2px solid transparent',
              fontWeight: tab === k ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ marginBottom: 60 }}>
          {tab === 'clips' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
              {displayVids.map(v => <VideoCard key={v.id} video={v} onClick={onOpenVideo}/>)}
            </div>
          )}
          {tab === 'collections' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {['Coastal golden hour', 'Seoul density', 'The blue hour', 'Industrial harbors', 'Mountain weather', 'Waterfalls of Jeju'].map((name, i) => (
                <div key={name} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3, aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ gridRow: 'span 2', background: thumbGradient(i * 3) }}/>
                    <div style={{ background: thumbGradient(i * 3 + 1) }}/>
                    <div style={{ background: thumbGradient(i * 3 + 2) }}/>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{8 + i * 3} clips · updated {i + 2}w ago</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'map' && (
            <div style={{ padding: 60, border: '1px solid var(--line)', borderRadius: 6, textAlign: 'center', background: 'var(--forest-900)' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--parchment-dim)', marginBottom: 12 }}>FLIGHT MAP</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 20 }}>Every place this pilot has flown, as a heat-map.</div>
              <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>Map loads Leaflet overlay with flight waypoints · scroll to zoom · filtered by year.</div>
            </div>
          )}
          {tab === 'about' && (
            <div style={{ maxWidth: 720, fontSize: 14, lineHeight: 1.7, color: 'var(--parchment)' }}>
              <h3 style={{ fontSize: 20, marginBottom: 14, color: 'var(--bone)' }}>Background</h3>
              <p style={{ marginBottom: 16 }}>Hyunwoo started flying in 2019 as a way to scout surf spots on the Korean east coast. What began as a GoPro-strapped Phantom ended up in the opening title sequence of three documentaries. He still goes back to the same three beaches every March.</p>
              <h3 style={{ fontSize: 20, marginBottom: 14, marginTop: 26, color: 'var(--bone)' }}>Published in</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Netflix · Our Seas', 'Apple TV+ · Earth at Night', 'Korean Film Council', 'Monocle Magazine', 'The Atlantic Photo', 'Vimeo Staff Picks'].map(p => (
                  <span key={p} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid var(--line)', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

