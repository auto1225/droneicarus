// pages/settings.jsx — Account settings
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CURRENT_USER } from '../data';
import { Ic } from '../components';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';
import { toast } from '../toast';
const sUseState = useState;

export function SettingsPage({ onNav }) {
  const [section, setSection] = sUseState('profile');
  const { profile, refreshProfile } = useAuth();
  const u = profile ? {
    id: profile.id,
    name: profile.display_name,
    handle: profile.handle,
    email: profile.email,
    initials: (profile.display_name || '?').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
    location: profile.location,
    pilotVerified: profile.pilot_verified,
  } : CURRENT_USER;

  const [draft, setDraft] = sUseState({
    display_name: u.name || '',
    handle: u.handle || '',
    location: u.location || '',
    bio: profile?.bio || '',
  });
  const [saving, setSaving] = sUseState(false);
  const onSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: draft.display_name,
        handle: draft.handle.startsWith('@') ? draft.handle : `@${draft.handle}`,
        location: draft.location,
        bio: draft.bio,
      }).eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast?.('Saved', 'Profile updated');
    } catch (e) {
      toast?.('Save failed', e.message, 'error');
    } finally { setSaving(false); }
  };

  const sections = [
    ['profile', 'Profile', Ic.user || Ic.pin],
    ['account', 'Account & security', Ic.lock],
    ['billing', 'Billing & payouts', Ic.credit || Ic.drone],
    ['pilot', 'Pilot verification', Ic.drone],
    ['notifications', 'Notifications', Ic.bell || Ic.drone],
    ['privacy', 'Privacy & data', Ic.eye || Ic.drone],
    ['appearance', 'Appearance'],
    ['danger', 'Danger zone'],
  ];

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 28px 80px' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 10 }}>SETTINGS</div>
      <h1 style={{ fontSize: 36, marginBottom: 24 }}>Account</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 36 }}>
        <nav>
          {sections.map(([k, label]) => (
            <button key={k} onClick={() => setSection(k)} style={{
              display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
              fontSize: 13, marginBottom: 2,
              color: section === k ? 'var(--bone)' : 'var(--parchment-dim)',
              background: section === k ? 'var(--forest-900)' : 'transparent',
              borderLeft: section === k ? '2px solid var(--amber)' : '2px solid transparent',
              borderRadius: 2,
            }}>{label}</button>
          ))}
        </nav>

        <div>
          {section === 'profile' && <SProfile u={u}/>}
          {section === 'account' && <SAccount u={u}/>}
          {section === 'billing' && <SBilling/>}
          {section === 'pilot' && <SPilot onNav={onNav}/>}
          {section === 'notifications' && <SNotifs/>}
          {section === 'privacy' && <SPrivacy/>}
          {section === 'appearance' && <SAppearance/>}
          {section === 'danger' && <SDanger/>}
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, footer }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 4, marginBottom: 18 }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 16, marginBottom: subtitle ? 3 : 0 }}>{title}</h3>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 22 }}>{children}</div>
      {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', background: 'var(--forest-950)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginTop: 3 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const iS = { width: '100%', padding: '9px 12px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', fontSize: 13, borderRadius: 3, outline: 'none', fontFamily: 'inherit' };

function SProfile({ u }) {
  return (
    <>
      <Card title="Public profile" subtitle="Shown on your creator page and next to your clips."
        footer={<><button className="btn secondary" style={{ fontSize: 12, padding: '6px 14px' }} data-placeholder="true">Cancel</button><button className="btn" style={{ fontSize: 12, padding: '6px 14px' }} data-placeholder="true">Save changes</button></>}>
        <Row label="Avatar" hint="PNG or JPG, max 5MB">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sunset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#faf6ec' }}>{u.initials}</div>
            <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Upload new</button>
            <button style={{ fontSize: 12, color: 'var(--parchment-dim)' }} data-placeholder="true">Remove</button>
          </div>
        </Row>
        <Row label="Display name"><input defaultValue={u.name} style={iS}/></Row>
        <Row label="Handle" hint="icarus.fly/@your-handle"><input defaultValue={u.handle.slice(1)} style={iS}/></Row>
        <Row label="Bio" hint="260 chars max">
          <textarea defaultValue="Seoul-based aerial pilot. Shooting coastlines & urban golden hour since 2019. DJI Mavic 3 Pro Cine." style={{ ...iS, minHeight: 80, resize: 'vertical' }}/>
        </Row>
        <Row label="Location"><input defaultValue="Seoul, South Korea" style={iS}/></Row>
        <Row label="Links">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input defaultValue="https://hyunwoo.fly" style={iS}/>
            <input defaultValue="instagram.com/hyunwoo.aerial" style={iS}/>
          </div>
        </Row>
      </Card>
    </>
  );
}

function SAccount({ u }) {
  return (
    <>
      <Card title="Email & password">
        <Row label="Email"><input defaultValue={u.email} style={iS}/></Row>
        <Row label="Password" hint="Last changed 3 months ago">
          <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Change password</button>
        </Row>
      </Card>
      <Card title="Two-factor authentication" subtitle="Add a second layer of security for your flight log.">
        <Row label="Authenticator app" hint="Google Authenticator, 1Password, Authy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--lichen)', letterSpacing: '0.12em' }}>● ENABLED · TOTP</span>
            <button style={{ fontSize: 12, color: 'var(--sunset)' }} data-placeholder="true">Regenerate codes</button>
          </div>
        </Row>
        <Row label="SMS backup" hint="+82 10 •••• 4821">
          <Toggle defaultChecked={true}/>
        </Row>
        <Row label="Passkeys" hint="Sign in with Face ID / Touch ID">
          <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Add a passkey</button>
        </Row>
      </Card>
      <Card title="Active sessions">
        {[
          ['MacBook Pro · Chrome 134', 'Seoul, KR · active now', true],
          ['iPhone 15 Pro · iOS app', 'Busan, KR · 2h ago', false],
          ['iPad Air · Safari', 'Seoul, KR · 3d ago', false],
        ].map(([dev, meta, cur]) => (
          <Row key={dev} label={dev} hint={meta}>
            {cur ? <span style={{ fontSize: 11, color: 'var(--lichen)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>● THIS DEVICE</span>
                 : <button style={{ fontSize: 12, color: 'var(--sunset)' }} data-placeholder="true">Revoke</button>}
          </Row>
        ))}
      </Card>
    </>
  );
}

function SBilling() {
  return (
    <>
      <Card title="Payment methods">
        <Row label="Default card">
          <div style={{ padding: 14, border: '1px solid var(--line-strong)', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Visa •• 4242</div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>Expires 04 / 29 · Hyunwoo Park</div>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.14em' }}>DEFAULT</span>
          </div>
          <button className="btn secondary" style={{ fontSize: 12, marginTop: 10 }} data-placeholder="true">+ Add payment method</button>
        </Row>
        <Row label="Billing address">
          <div style={{ fontSize: 13, color: 'var(--parchment)' }}>
            Hyunwoo Park<br/>
            63 Yeouinaru-ro<br/>
            Yeongdeungpo-gu, Seoul 04539<br/>
            South Korea
          </div>
        </Row>
        <Row label="VAT number" hint="For business invoices"><input defaultValue="KR-1048-28392-18" style={iS}/></Row>
      </Card>
      <Card title="Payout account" subtitle="Where your pilot earnings are deposited.">
        <Row label="Method">
          <div style={{ padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Stripe Connect · KEB Hana Bank</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)' }}>•• •• •• 4821 · SWIFT KOEXKRSE · verified 2024.03.14</div>
          </div>
        </Row>
        <Row label="Minimum payout"><input defaultValue="$50.00" style={iS}/></Row>
        <Row label="Schedule"><Toggle defaultChecked label="Auto-deposit on the 28th of every month"/></Row>
      </Card>
    </>
  );
}

function SPilot({ onNav }) {
  return (
    <>
      <Card title="Verification status">
        <div style={{ padding: 18, background: 'var(--forest-900)', border: '1px solid var(--moss)', borderRadius: 3, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.check/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Verified commercial pilot</div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>Approved 2024.03.14 · valid through 2027.03.14</div>
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--lichen)', letterSpacing: '0.14em' }}>● VERIFIED</span>
        </div>
      </Card>
      <Card title="Registered aircraft">
        {[
          ['DJI Mavic 3 Pro Cine', 'FA3X4MK219 · 958g · last flown 3d ago'],
          ['DJI Air 3S', 'FAS-84J2M-28 · 720g · last flown 14d ago'],
          ['DJI Inspire 3', 'FAI-3X-09482 · 3995g · last flown 2mo ago'],
        ].map(([m, meta]) => (
          <Row key={m} label={m} hint={meta}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ fontSize: 12, color: 'var(--sunset)' }} data-placeholder="true">Edit</button>
              <button style={{ fontSize: 12, color: 'var(--parchment-dim)' }} data-placeholder="true">Remove</button>
            </div>
          </Row>
        ))}
        <div style={{ paddingTop: 14 }}>
          <button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">+ Register another drone</button>
        </div>
      </Card>
      <Card title="Certifications & insurance">
        <Row label="KCAA Commercial License" hint="Korea Civil Aviation Authority · expires 2027.03"><span style={{ fontSize: 11, color: 'var(--lichen)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>● VERIFIED</span></Row>
        <Row label="FAA Part 107" hint="US commercial operation · expires 2026.09"><span style={{ fontSize: 11, color: 'var(--lichen)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>● VERIFIED</span></Row>
        <Row label="Liability insurance" hint="$1M coverage · Lloyd's of London"><span style={{ fontSize: 11, color: 'var(--lichen)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>● VERIFIED</span></Row>
        <Row label="Expand coverage"><button className="btn secondary" style={{ fontSize: 12 }} onClick={() => onNav('pilot-onboarding')}>Add another region</button></Row>
      </Card>
    </>
  );
}

function SNotifs() {
  return (
    <Card title="Email notifications">
      {[
        ['New license purchased', 'Someone licenses one of your clips', true],
        ['Monthly earnings summary', 'On the 1st of each month', true],
        ['New follower', 'When someone follows your profile', true],
        ['Reply to my comment', 'Instant', false],
        ['Weekly Rankings digest', 'Where your clips chart', true],
        ['New flight restrictions in my area', 'Seoul · KR', true],
        ['Product updates & newsletter', 'From the Drone Icarus team', false],
      ].map(([t, d, on]) => (
        <Row key={t} label={t} hint={d}><Toggle defaultChecked={on}/></Row>
      ))}
    </Card>
  );
}

function SPrivacy() {
  return (
    <>
      <Card title="Discoverability">
        <Row label="Show profile in search" hint="Let anyone find you by name or handle"><Toggle defaultChecked/></Row>
        <Row label="Show clips on global map" hint="Uncheck to only share via direct link"><Toggle defaultChecked/></Row>
        <Row label="Allow AI / ML training" hint="Third-party AI companies can license your clips as training data"><Toggle/></Row>
        <Row label="Show flight metadata" hint="Altitude, aircraft, shot date on your clips"><Toggle defaultChecked/></Row>
      </Card>
      <Card title="Your data">
        <Row label="Download my data" hint="All clips, metadata, licenses, messages · delivered as .zip within 48h"><button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Request export</button></Row>
        <Row label="Cookies & tracking"><button style={{ fontSize: 12, color: 'var(--sunset)' }} data-placeholder="true">Manage preferences →</button></Row>
      </Card>
    </>
  );
}

function SAppearance() {
  return (
    <Card title="Appearance" subtitle="These mirror the Tweaks panel — changes apply immediately.">
      <Row label="Theme"><Toggle defaultChecked label="Dark"/></Row>
      <Row label="Reduced motion"><Toggle/></Row>
      <Row label="Auto-play preview on hover"><Toggle defaultChecked/></Row>
      <Row label="Currency"><select style={iS}><option>USD ($)</option><option>KRW (₩)</option><option>EUR (€)</option><option>JPY (¥)</option></select></Row>
      <Row label="Units"><select style={iS}><option>Metric (m, km, °C)</option><option>Imperial (ft, mi, °F)</option></select></Row>
    </Card>
  );
}

function SDanger() {
  return (
    <Card title="Danger zone" subtitle="These actions are permanent.">
      <Row label="Deactivate account" hint="Hide your profile and clips. Reversible for 30 days."><button className="btn secondary" style={{ fontSize: 12, color: 'var(--sunset)' }} data-placeholder="true">Deactivate</button></Row>
      <Row label="Transfer clips to another pilot"><button className="btn secondary" style={{ fontSize: 12 }} data-placeholder="true">Start transfer</button></Row>
      <Row label="Delete account" hint="All clips, licenses issued, and earnings history are erased. This cannot be undone.">
        <button style={{ padding: '8px 14px', fontSize: 12, background: 'transparent', border: '1px solid #c73e3e', color: '#c73e3e', borderRadius: 3 }} data-placeholder="true">Delete permanently</button>
      </Row>
    </Card>
  );
}

function Toggle({ defaultChecked, label }) {
  const [on, setOn] = sUseState(!!defaultChecked);
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <button onClick={() => setOn(!on)} style={{
        width: 36, height: 20, borderRadius: 999,
        background: on ? 'var(--sunset)' : 'var(--forest-700)',
        position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#faf6ec',
          transition: 'left 0.15s',
        }}/>
      </button>
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
    </label>
  );
}

