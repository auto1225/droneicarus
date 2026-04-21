// pages/auth.jsx — Sign in / Sign up with map-backed hero, 3-step signup, forgot pw flow
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Ic } from '../components';
import { toast } from '../toast';
const aUseState = useState;
const aUseEffect = useEffect;
const aUseRef = useRef;
const aUseMemo = useMemo;

// --- Password strength evaluator ---
function pwScore(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}
const PW_LABELS = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];
const PW_COLORS = ['#a8a090', '#c73e3e', '#e8b04a', '#6b8a55', '#4a6741'];

// --- Animated map backdrop (stylized, no Leaflet — just vibes) ---
function AuthBackdrop() {
  const [tick, setTick] = aUseState(0);
  aUseEffect(() => { const t = setInterval(() => setTick(x => x+1), 900); return () => clearInterval(t); }, []);
  const pins = aUseMemo(() => [
    { x: 18, y: 28, c: 'sunset', label: 'NAMSAN', v: '2.4K' },
    { x: 52, y: 22, c: 'amber',  label: 'GIZA',   v: '1.8K' },
    { x: 72, y: 38, c: 'sunset', label: 'DOLOMITES', v: '894' },
    { x: 26, y: 58, c: 'amber',  label: 'ANTELOPE', v: '612' },
    { x: 60, y: 66, c: 'sunset', label: 'ULURU', v: '1.2K' },
    { x: 84, y: 72, c: 'amber',  label: 'PATAGONIA', v: '503' },
    { x: 40, y: 44, c: 'sunset', label: 'ICELAND', v: '2.1K' },
  ], []);
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 30% 40%, #2d3a2e 0%, #1a2820 45%, #0d1410 100%)',
    }}>
      {/* Topographic contours */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22 }}>
        <defs>
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#f5ede0" strokeWidth="0.08"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)"/>
        {[...Array(12)].map((_, i) => {
          const r = 10 + i * 6;
          return <ellipse key={i} cx="45" cy="50" rx={r} ry={r*0.55} fill="none" stroke="#e8b04a" strokeWidth="0.15" opacity={0.7 - i*0.05}/>;
        })}
      </svg>

      {/* Flight path */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="fp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d97045" stopOpacity="0"/>
            <stop offset="50%" stopColor="#e8b04a" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#d97045" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M 18 28 Q 30 50 52 22 T 72 38 T 60 66 T 84 72" fill="none" stroke="url(#fp)" strokeWidth="0.4" strokeDasharray="2 2"/>
        <path d="M 26 58 Q 30 50 40 44 T 60 66" fill="none" stroke="url(#fp)" strokeWidth="0.3" strokeDasharray="1.5 1.5" opacity="0.6"/>
      </svg>

      {/* Pins */}
      {pins.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '1px solid ' + (p.c === 'sunset' ? '#d97045' : '#e8b04a'),
              animation: `authPulse 2.2s ease-out ${i*0.3}s infinite`,
            }}/>
            <span style={{
              display: 'block', width: 10, height: 10, borderRadius: '50%',
              background: p.c === 'sunset' ? '#d97045' : '#e8b04a',
              boxShadow: `0 0 0 3px rgba(13,20,16,0.5), 0 0 16px ${p.c === 'sunset' ? '#d97045' : '#e8b04a'}80`,
            }}/>
            <span style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em',
              color: '#faf6ec', opacity: (tick + i) % 4 === 0 ? 1 : 0.6,
              whiteSpace: 'nowrap', transition: 'opacity 0.5s',
              background: 'rgba(13,20,16,0.85)', padding: '2px 6px', borderRadius: 2,
            }}>{p.label} · {p.v}</span>
          </div>
        </div>
      ))}

      {/* Corner HUD */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
        color: 'rgba(245,237,224,0.6)', textAlign: 'right',
      }}>
        <div>N 37°33'04" · E 126°58'18"</div>
        <div style={{ marginTop: 4 }}>ALT 384 M · HDG 127°</div>
        <div style={{ marginTop: 4, color: '#e8b04a' }}>● LIVE · {12847 + tick} CLIPS</div>
      </div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(13,20,16,0.5) 90%)', pointerEvents: 'none' }}/>
    </div>
  );
}

// --- Form field with validation ---
function AuthField({ label, hint, error, children, success }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--parchment)', letterSpacing: '0.01em' }}>{label}</span>
        {hint && <button type="button" style={{ fontSize: 11, color: 'var(--sunset)' }} data-placeholder="true">{hint}</button>}
      </div>
      <div style={{ position: 'relative' }}>
        {children}
        {success && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--moss)', pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12l6 6L20 6"/></svg>
          </span>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#c73e3e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7v6M12 17v0.01" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          {error}
        </div>
      )}
    </label>
  );
}

const authInputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--forest-950)',
  border: '1px solid var(--line-strong)',
  borderRadius: 4,
  color: 'var(--bone)',
  fontSize: 14,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  transition: 'border-color 0.15s',
};

import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';

export function AuthPage({ onNav }) {
  const auth = useAuth();
  const [mode, setMode] = aUseState('signin'); // signin | signup | forgot | reset-sent
  const [step, setStep] = aUseState(1); // signup: 1 account, 2 role, 3 profile
  const [email, setEmail] = aUseState('');
  const [password, setPassword] = aUseState('');
  const [showPw, setShowPw] = aUseState(false);
  const [role, setRole] = aUseState(null);
  const [name, setName] = aUseState('');
  const [handle, setHandle] = aUseState('');
  const [loading, setLoading] = aUseState(false);
  const [errors, setErrors] = aUseState({});

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const score = pwScore(password);

  const submit = async () => {
    const e = {};
    if (mode !== 'reset-sent' && !validEmail) e.email = 'Enter a valid email address';
    if (mode === 'signup' && score < 2) e.password = 'Use at least 8 characters with a mix of letters and numbers';
    if (mode === 'signin' && password.length < 1) e.password = 'Enter your password';
    if (mode === 'signup' && step === 3) {
      if (!handle || handle.length < 3) e.handle = 'Choose a handle (3+ characters)';
      if (!name) e.name = 'Enter your display name';
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      if (mode === 'signin') {
        await auth.signIn({ email, password });
        toast?.('Welcome back', 'Signed in to Drone Icarus');
        onNav('home');
      } else if (mode === 'signup') {
        if (step === 1) { setStep(2); }
        else if (step === 2) { setStep(3); }
        else {
          await auth.signUp({ email, password, handle, displayName: name });
          // Update profile with chosen role
          if (auth.session?.user?.id && role) {
            await supabase.from('profiles').update({ role }).eq('id', auth.session.user.id);
          }
          toast?.('Welcome to Drone Icarus', 'Your account is ready');
          onNav('home');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#signin`,
        });
        if (error) throw error;
        setMode('reset-sent');
      }
    } catch (err) {
      toast?.('Auth error', err.message || 'Please try again', 'error');
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const title = {
    signin: 'Welcome back, pilot.',
    signup: step === 1 ? 'Start flying with us.' : step === 2 ? 'How will you use Icarus?' : 'Claim your handle.',
    forgot: 'Reset your password.',
    'reset-sent': 'Check your inbox.',
  }[mode];

  const sub = {
    signin: 'Sign in to access your collections, licenses, and earnings.',
    signup: step === 1 ? 'Takes less than a minute. No credit card needed.' : step === 2 ? 'You can change this later in settings.' : 'Your handle is how pilots and buyers find you.',
    forgot: "Enter your email and we'll send you a reset link.",
    'reset-sent': "We've sent a secure link to " + email + ". It expires in 30 minutes.",
  }[mode];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', minHeight: 'calc(100vh - 62px)', background: 'var(--ink)' }}>
      {/* Left: immersive backdrop */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <AuthBackdrop/>

        <div style={{ position: 'absolute', inset: 0, padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#faf6ec', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <span style={{ color: '#e8b04a' }}><Ic.drone/></span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#faf6ec', letterSpacing: '-0.02em' }}>
                Drone<span style={{ color: '#d97045' }}>Icarus</span>
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.02, color: '#faf6ec', maxWidth: 520, letterSpacing: '-0.03em' }}>
              The atlas of <em style={{ fontStyle: 'italic', color: '#e8b04a' }}>aerial</em> footage.
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(245,237,224,0.7)', maxWidth: 460, marginTop: 20, lineHeight: 1.55 }}>
              Browse the world from above. Over 12,000 drone clips from 184 countries, shot and owned by verified pilots on the ground.
            </p>
          </div>

          {/* Testimonial / social proof */}
          <div style={{
            background: 'rgba(13,20,16,0.55)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(245,237,224,0.14)', borderRadius: 6,
            padding: '22px 24px', maxWidth: 440,
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#6b8e4e', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>K</div>
              <div>
                <p style={{ fontSize: 14, color: '#faf6ec', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  "Licensed a sunrise shot of Mt. Fuji from Icarus, edited it into our documentary the same afternoon. Everything on here is cleared and ready to ship."
                </p>
                <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(245,237,224,0.6)' }}>
                  Kenji Mori · Director · NHK Mirai
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(245,237,224,0.12)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,237,224,0.55)' }}>
              <span>NETFLIX</span><span>APPLE TV+</span><span>BBC</span><span>NHK</span><span>+1.2K STUDIOS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 64px', maxWidth: 600, position: 'relative' }}>
        {/* Segmented toggle */}
        {(mode === 'signin' || mode === 'signup') && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', background: 'var(--forest-950)', border: '1px solid var(--line)', borderRadius: 999, padding: 3 }}>
              {['signin', 'signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setStep(1); setErrors({}); }} style={{
                  padding: '8px 20px', fontSize: 13, borderRadius: 999,
                  background: mode === m ? 'var(--bone)' : 'transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--parchment-dim)',
                  fontWeight: mode === m ? 600 : 500,
                  transition: 'all 0.2s',
                }}>{m === 'signin' ? 'Sign in' : 'Create account'}</button>
              ))}
            </div>
          </div>
        )}

        {/* Signup stepper */}
        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, maxWidth: 280 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: step >= s ? 'var(--sunset)' : 'var(--line-strong)',
                transition: 'background 0.3s',
              }}/>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: 32, marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 26, lineHeight: 1.55 }}>{sub}</p>

        {/* Step 2: role */}
        {mode === 'signup' && step === 2 ? (
          <div>
            {[
              ['viewer', 'I watch and license footage', 'Browse, build collections, buy clips for my projects.', 'grid'],
              ['pilot', 'I fly and sell footage', 'Verify your certification and start earning from your aerial work.', 'drone'],
              ['studio', 'I license for a team', 'Team seats, invoicing, enterprise license templates.', 'crown'],
            ].map(([k, label, note, icon]) => {
              const Icon = Ic[icon];
              return (
                <button key={k} onClick={() => setRole(k)} style={{
                  display: 'flex', gap: 16, padding: '18px 20px', width: '100%', textAlign: 'left',
                  border: role === k ? '2px solid var(--sunset)' : '1px solid var(--line-strong)',
                  borderRadius: 6, marginBottom: 10,
                  background: role === k ? 'var(--forest-950)' : 'transparent',
                  transition: 'all 0.15s', alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 4, flexShrink: 0,
                    background: role === k ? 'var(--sunset)' : 'var(--forest-900)',
                    color: role === k ? '#faf6ec' : 'var(--amber)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.5 }}>{note}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: role === k ? '6px solid var(--sunset)' : '2px solid var(--line-strong)',
                    marginTop: 2,
                  }}/>
                </button>
              );
            })}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button className="btn secondary" onClick={() => setStep(1)} style={{ padding: '12px 16px' }}>← Back</button>
              <button className="btn primary" disabled={!role} onClick={() => setStep(3)}
                style={{ flex: 1, padding: '12px 16px', opacity: role ? 1 : 0.5 }}>
                Continue →
              </button>
            </div>
          </div>
        ) : mode === 'signup' && step === 3 ? (
          <div>
            <AuthField label="Display name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hyunwoo Park" style={authInputStyle}/>
            </AuthField>
            <AuthField label="Handle" hint="icarus.fly/@...">
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--forest-950)', border: '1px solid var(--line-strong)', borderRadius: 4 }}>
                <span style={{ padding: '12px 0 12px 14px', color: 'var(--parchment-dim)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>@</span>
                <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="hyunwoo.aerial" style={{ ...authInputStyle, border: 'none', padding: '12px 14px 12px 2px', background: 'transparent' }}/>
                {handle.length >= 3 && <span style={{ paddingRight: 14, color: 'var(--moss)' }}><Ic.check/></span>}
              </div>
            </AuthField>
            <div style={{ padding: 14, background: 'var(--forest-950)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.55, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: 'var(--parchment)' }}>
                <span style={{ color: 'var(--amber)' }}><Ic.check/></span>
                <strong style={{ fontSize: 12 }}>What's next</strong>
              </div>
              {role === 'pilot'
                ? 'After signup, we\'ll walk you through drone registration & cert verification to unlock monetization.'
                : role === 'studio'
                ? 'We\'ll send you an invite link for your team. Drone Icarus has no subscription — you only pay when you license a clip.'
                : 'Browse the map, save clips to collections, and purchase licenses whenever you need footage.'}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button className="btn secondary" onClick={() => setStep(2)} style={{ padding: '12px 16px' }}>← Back</button>
              <button className="btn primary" disabled={!name || handle.length < 3} onClick={() => {
                toast?.('Welcome aboard, ' + (name || 'pilot') + '!', 'Account created');
                onNav(role === 'pilot' ? 'pilot-onboarding' : 'home');
              }}
                style={{ flex: 1, padding: '12px 16px', opacity: (name && handle.length >= 3) ? 1 : 0.5 }}>
                Create account
              </button>
            </div>
          </div>
        ) : mode === 'reset-sent' ? (
          <div>
            <div style={{
              padding: 24, background: 'var(--forest-950)', border: '1px solid var(--moss)',
              borderRadius: 6, display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Reset link sent</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.55 }}>
                  Didn't receive it? Check your spam folder, or{' '}
                  <button onClick={() => setMode('forgot')} style={{ color: 'var(--sunset)', textDecoration: 'underline' }}>try again</button>.
                </div>
              </div>
            </div>
            <button className="btn secondary" onClick={() => setMode('signin')} style={{ width: '100%', padding: '12px 16px', justifyContent: 'center' }}>
              ← Back to sign in
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <div>
            <AuthField label="Email address" error={errors.email}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="pilot@icarus.fly" style={authInputStyle}/>
            </AuthField>
            <button className="btn primary" onClick={submit} disabled={loading}
              style={{ width: '100%', padding: '12px 16px', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <button onClick={() => setMode('signin')} style={{ width: '100%', textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--parchment-dim)' }}>
              ← Back to sign in
            </button>
          </div>
        ) : (
          /* mode === 'signin' || (mode === 'signup' && step === 1) */
          <div>
            {/* Social auth */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button className="btn secondary" style={{ justifyContent: 'center', padding: 12, fontSize: 13 }} data-placeholder="true">
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 1 1-3.3-13L37.7 9A20 20 0 1 0 44 24c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.2 7.8 3L37.7 9A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.1 4-3.9 5.5l6.2 5.3C43 34.5 44 29.5 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                Google
              </button>
              <button className="btn secondary" style={{ justifyContent: 'center', padding: 12, fontSize: 13 }} data-placeholder="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.54c-.02-2.34 1.91-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.84-1.44-.15-2.82.85-3.56.85-.74 0-1.87-.83-3.09-.81-1.58.03-3.05.93-3.87 2.35-1.65 2.87-.42 7.1 1.19 9.43.78 1.14 1.71 2.41 2.93 2.37 1.18-.05 1.63-.76 3.05-.76s1.83.76 3.08.74c1.28-.02 2.08-1.15 2.86-2.3.9-1.32 1.27-2.6 1.29-2.67-.03-.01-2.47-.95-2.48-3.76zM14.7 5.06c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.6.7-1.12 1.8-.98 2.86 1.04.08 2.1-.53 2.74-1.32z"/></svg>
                Apple
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
              <span className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', letterSpacing: '0.14em' }}>OR WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            </div>

            <AuthField label="Email" error={errors.email} success={validEmail && email.length > 0}>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: null }); }}
                placeholder="pilot@icarus.fly" style={{
                  ...authInputStyle,
                  borderColor: errors.email ? '#c73e3e' : authInputStyle.border,
                }}/>
            </AuthField>

            <AuthField
              label="Password"
              hint={mode === 'signin' ? 'Forgot?' : null}
              error={errors.password}
            >
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: null }); }}
                  placeholder={mode === 'signup' ? 'Create a strong password' : '••••••••'}
                  style={{ ...authInputStyle, paddingRight: 44 }}/>
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--parchment-dim)', padding: 4,
                }}>
                  {showPw ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </AuthField>

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 18 }}>
                <button onClick={() => setMode('forgot')} style={{ fontSize: 12, color: 'var(--sunset)' }}>Forgot password?</button>
              </div>
            )}

            {/* Password strength meter */}
            {mode === 'signup' && password.length > 0 && (
              <div style={{ marginTop: -6, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i < score ? PW_COLORS[score] : 'var(--line-strong)',
                      transition: 'background 0.2s',
                    }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: PW_COLORS[score] }}>{PW_LABELS[score]}</span>
                  <span style={{ color: 'var(--parchment-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {password.length >= 8 ? '✓ 8+ chars' : `${8-password.length} more chars`}
                  </span>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <label style={{ display: 'flex', gap: 10, marginTop: 16, marginBottom: 4, fontSize: 12, color: 'var(--parchment-dim)', lineHeight: 1.6, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
                <span>
                  I agree to the <a style={{ color: 'var(--sunset)', textDecoration: 'underline' }}>Terms</a> and{' '}
                  <a style={{ color: 'var(--sunset)', textDecoration: 'underline' }}>Privacy Policy</a>, and confirm my uploads are shot legally under my local airspace rules.
                </span>
              </label>
            )}

            <button onClick={submit} disabled={loading} className="btn primary"
              style={{ marginTop: 20, width: '100%', padding: '13px 16px', fontSize: 14, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <span className="auth-spinner"/>
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (mode === 'signin' ? 'Sign in to Icarus →' : 'Continue →')}
            </button>

            <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--parchment-dim)' }}>
              {mode === 'signin' ? "New to Drone Icarus? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStep(1); setErrors({}); }} style={{ color: 'var(--sunset)', fontWeight: 600 }}>
                {mode === 'signin' ? 'Create a free account' : 'Sign in'}
              </button>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 28, left: 64, right: 64, fontSize: 11, color: 'var(--parchment-dim)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
          <span>SECURED BY ICARUS</span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
}

