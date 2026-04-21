// pages/checkout.jsx — Stripe-style 2-col checkout + success + order history + license detail
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LOCATIONS, VIDEOS, thumbGradient, CURRENT_USER, ORDERS } from '../data';
import { Ic } from '../components';
import { useAuth } from '../auth/AuthContext';
import { createOrder, fetchOrder } from '../db/commerce';
import { toast } from '../toast';

async function downloadSigned(path, suggestedName) {
  try {
    const { signedUrl } = await import('../db/storage');
    const u = await signedUrl('videos', path, 600);
    if (!u) { (window.toast || (()=>{}))('Download unavailable', 'This clip has no source file yet.', 'error'); return; }
    // Trigger native download
    const a = document.createElement('a');
    a.href = u;
    a.download = suggestedName || 'clip.mp4';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    (window.toast || (()=>{}))('Download failed', e.message || 'Try again', 'error');
  }
}

const ckUseState = useState;
const ckUseEffect = useEffect;

export function CheckoutPage({ videoId, licenseType = 'Commercial', onNav }) {
  const v = VIDEOS.find(x => x.id === videoId) || VIDEOS.find(x => x.price > 0);
  const [tier, setTier] = ckUseState(licenseType);
  const [payMethod, setPayMethod] = ckUseState('card');
  const [email, setEmail] = ckUseState('hyunwoo@icarus.fly');
  const [card, setCard] = ckUseState('4242 4242 4242 4242');
  const [exp, setExp] = ckUseState('04 / 29');
  const [cvc, setCvc] = ckUseState('314');
  const [name, setName] = ckUseState('Hyunwoo Park');
  const [country, setCountry] = ckUseState('South Korea');
  const [zip, setZip] = ckUseState('04539');
  const [processing, setProcessing] = ckUseState(false);

  const loc = LOCATIONS.find(l => l.id === v.locationId);
  const mult = tier === 'Extended' ? 3.5 : tier === 'Commercial' ? 1.8 : 1;
  const sub = Math.round(v.price * mult * 100) / 100;
  const tax = Math.round(sub * 0.08 * 100) / 100;
  const total = Math.round((sub + tax) * 100) / 100;

  const submit = async () => {
    setProcessing(true);
    try {
      // Try creating the real order if video.id is a UUID (Supabase). Otherwise just simulate.
      let orderId = `DI-2026-${String(Math.floor(48100 + Math.random() * 500)).padStart(5, '0')}`;
      if (/^[0-9a-f]{8}-/.test(String(v.id))) {
        const row = await createOrder({
          videoId: v.id,
          license: tier.toLowerCase(),
          subtotal: sub, tax, total,
          paymentBrand: payMethod === 'paypal' ? 'PayPal' : 'Visa',
          paymentLast4: payMethod === 'paypal' ? null : card.slice(-4),
        });
        orderId = row.id;
      }
      __lastOrder = {
        id: orderId, videoId: v.id, tier,
        subtotal: sub, tax, total,
        method: payMethod === 'paypal' ? 'PayPal · ' + email : 'Visa •• ' + card.slice(-4),
      };
      toast?.('License secured', `Order ${orderId} confirmed`);
      onNav('success');
    } catch (e) {
      toast?.('Payment failed', e.message || 'Try again', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: 'calc(100vh - 62px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72 }}>
        {/* Left: order summary */}
        <div>
          <button onClick={() => onNav('watch', v.id)} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 22 }}>← Back to clip</button>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 10 }}>LICENSE CHECKOUT</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.1, marginBottom: 8 }}>{v.title}</h1>
          <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 22 }}>
            {v.creator.handle} · {loc?.name}, {loc?.country}
          </div>

          <div style={{
            aspectRatio: '16/9', borderRadius: 6, background: thumbGradient(v.id.charCodeAt(1) || 5),
            position: 'relative', marginBottom: 24, border: '1px solid var(--line-strong)',
          }}>
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{v.resolution}</div>
            <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '3px 7px', borderRadius: 2, fontFamily: 'var(--font-mono)' }}>{v.duration}</div>
          </div>

          {/* License tiers */}
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 10 }}>LICENSE TIER</div>
          <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, marginBottom: 22 }}>
            {[
              ['Personal', 'Edits, social reels, non-commercial', v.price],
              ['Commercial', 'Ads, client work, online spots', Math.round(v.price * 1.8 * 100) / 100],
              ['Extended', 'Broadcast, exclusive window, resale', Math.round(v.price * 3.5 * 100) / 100],
            ].map(([k, note, p], i) => {
              const on = tier === k;
              return (
                <label key={k} style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr 100px', gap: 12, alignItems: 'center',
                  padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                  background: on ? 'var(--forest-900)' : 'transparent', cursor: 'pointer',
                }}>
                  <input type="radio" checked={on} onChange={() => setTier(k)}/>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{note}</div>
                  </div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, textAlign: 'right' }}>${p}</div>
                </label>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 4, padding: '16px 20px' }}>
            <TotalRow k={`${tier} license · non-exclusive · perpetual · worldwide`} v={`$${sub}`}/>
            <TotalRow k="VAT (8%)" v={`$${tax}`}/>
            <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }}/>
            <TotalRow k="Total" v={`$${total}`} bold/>
          </div>

          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', marginTop: 14, letterSpacing: '0.1em', lineHeight: 1.6 }}>
            INCLUDES: {v.resolution} MASTER (MP4 H.264) · 4K PRORES 422 HQ · LUT (.CUBE) · SIGNED LICENSE PDF · UPDATES FOR 12 MONTHS
          </div>
        </div>

        {/* Right: payment form */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)' }}>SECURE PAYMENT · 256-bit TLS</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)' }}>POWERED BY STRIPE</div>
          </div>

          {/* Pay method tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
            {[['card', 'Card'], ['paypal', 'PayPal']].map(([k, label]) => (
              <button key={k} onClick={() => setPayMethod(k)} style={{
                padding: '12px 14px', fontSize: 13,
                border: payMethod === k ? '2px solid var(--sunset)' : '1px solid var(--line-strong)',
                background: payMethod === k ? 'var(--forest-900)' : 'transparent',
                borderRadius: 4, fontWeight: 600,
              }}>{label}</button>
            ))}
          </div>

          {payMethod === 'card' ? (
            <>
              <Fld label="Email">
                <input value={email} onChange={e => setEmail(e.target.value)} style={fstyle}/>
              </Fld>
              <div style={{ height: 14 }}/>
              <Fld label="Card information">
                <div style={{ border: '1px solid var(--line-strong)', borderRadius: '4px 4px 0 0', background: 'var(--forest-900)' }}>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)' }}>
                    <input value={card} onChange={e => setCard(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', fontSize: 14, fontFamily: 'var(--font-mono)' }}/>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.1em' }}>VISA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <input value={exp} onChange={e => setExp(e.target.value)} placeholder="MM / YY" style={{ padding: '10px 14px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', fontSize: 14, fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--line)' }}/>
                    <input value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVC" style={{ padding: '10px 14px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', fontSize: 14, fontFamily: 'var(--font-mono)' }}/>
                  </div>
                </div>
              </Fld>
              <div style={{ height: 14 }}/>
              <Fld label="Cardholder name">
                <input value={name} onChange={e => setName(e.target.value)} style={fstyle}/>
              </Fld>
              <div style={{ height: 14 }}/>
              <Fld label="Billing country">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <select value={country} onChange={e => setCountry(e.target.value)} style={fstyle}>
                    {['South Korea','United States','Japan','Germany','France','United Kingdom','Australia','Canada','Brazil'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input value={zip} onChange={e => setZip(e.target.value)} placeholder="Postal code" style={fstyle}/>
                </div>
              </Fld>
              <label style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 12, color: 'var(--parchment-dim)' }}>
                <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
                Save card for future purchases. Charges appear as <span className="mono" style={{ color: 'var(--bone)' }}>ICARUS.FLY</span> on your statement.
              </label>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--line-strong)', borderRadius: 4, background: 'var(--forest-900)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#003087', marginBottom: 10, letterSpacing: '-0.02em' }}>
                Pay<span style={{ color: '#0070ba' }}>Pal</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--parchment-dim)', marginBottom: 18 }}>You'll be redirected to PayPal to approve this charge of <strong style={{ color: 'var(--bone)' }}>${total}</strong>.</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.1em' }}>SIGNED IN AS {email.toUpperCase()}</div>
            </div>
          )}

          <button disabled={processing} onClick={submit} className="btn"
            style={{ width: '100%', padding: '14px 20px', marginTop: 22, fontSize: 15, justifyContent: 'center', opacity: processing ? 0.6 : 1 }}>
            {processing ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#faf6ec', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                Processing…
              </>
            ) : `Pay $${total}`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 11, color: 'var(--parchment-dim)' }}>
            <Ic.lock/> Encrypted · 3-D Secure · SCA compliant · PCI-DSS L1
          </div>
          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--parchment-dim)', lineHeight: 1.6 }}>
            By paying, you agree to the <span style={{ color: 'var(--sunset)' }}>Drone Icarus license agreement</span> for the {tier} tier above.
            A signed PDF and the master files will be available in your <span style={{ color: 'var(--sunset)', cursor: 'pointer' }} onClick={() => onNav('orders')}>Orders locker</span> within 30 seconds.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function SuccessPage({ onNav }) {
  const order = __lastOrder || { id: 'DI-2026-04821', videoId: 'v0', tier: 'Commercial', total: 17.98, method: 'Visa •• 4242' };
  const v = VIDEOS.find(x => x.id === order.videoId) || VIDEOS[0];
  const [progress, setProgress] = ckUseState(0);
  ckUseEffect(() => {
    const id = setInterval(() => setProgress(p => Math.min(100, p + 7)), 90);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--moss)', color: '#faf6ec',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 22px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l6 6L20 6"/></svg>
        </div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', color: 'var(--parchment-dim)', marginBottom: 8 }}>PAYMENT CONFIRMED · {new Date().toISOString().slice(0,10).replace(/-/g,'.')}</div>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>License issued.</h1>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>
          Order <span className="mono" style={{ color: 'var(--bone)' }}>{order.id}</span> · Paid with {order.method} · Emailed to hyunwoo@icarus.fly
        </p>
      </div>

      <div style={{ border: '1px solid var(--line-strong)', borderRadius: 6, overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 0 }}>
          <div style={{ aspectRatio: '16/9', background: thumbGradient(v.id.charCodeAt(1) || 2), position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'var(--thumb-overlay)', color: '#f5ede0', fontSize: 10, padding: '2px 6px', fontFamily: 'var(--font-mono)', borderRadius: 2 }}>{v.duration}</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{v.title}</div>
            <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 10 }}>{v.creator.handle} · {v.resolution} · {v.duration}</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--amber)', textTransform: 'uppercase' }}>{order.tier} LICENSE · PERPETUAL · WORLDWIDE</div>
          </div>
        </div>

        <div style={{ padding: 20, borderTop: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>DOWNLOAD · {progress}%</div>
          <div style={{ height: 6, background: 'var(--forest-800)', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--sunset)', transition: 'width 0.09s' }}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              ['MP4 H.264', '4K', '3.4 GB'],
              ['ProRes 422 HQ', '4K', '24.8 GB'],
              ['LUT .CUBE', 'D-Log M', '12 KB'],
              ['License.pdf', 'Signed', '84 KB'],
            ].map(([fmt, q, size], i) => (
              <div key={fmt} style={{ border: '1px solid var(--line)', padding: 12, borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{fmt}</div>
                <div style={{ fontSize: 10, color: 'var(--parchment-dim)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{q} · {size}</div>
                <button className="btn secondary" style={{ fontSize: 11, padding: '6px 10px', width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          const path = v.storagePath || v.storage_path;
                          if (path) downloadSigned(path, `${v.slug || v.id}-${fmt.replace(/\s+/g,'_')}.mp4`);
                          else (window.toast||(()=>{}))('Demo clip', 'Real downloads enable for pilot-uploaded masters.', 'info');
                        }}>Download</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <button className="btn secondary" style={{ justifyContent: 'center', padding: 12 }} onClick={() => onNav('license', order.id)}>View license</button>
        <button className="btn secondary" style={{ justifyContent: 'center', padding: 12 }} data-placeholder="true">Download receipt PDF</button>
        <button className="btn" style={{ justifyContent: 'center', padding: 12 }} onClick={() => onNav('orders')}>Go to my locker</button>
      </div>

      <div style={{ marginTop: 40, padding: '18px 20px', background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--moss)', color: '#faf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{v.creator.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Pilot was paid ${(order.total * 0.85).toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v.creator.name} ({v.creator.handle}) receives 70% of every license, paid out monthly. Thanks for supporting pilots directly.</div>
        </div>
      </div>
    </div>
  );
}

export function OrdersPage({ onNav }) {
  const [filter, setFilter] = ckUseState('all');
  const [data, setData] = ckUseState(ORDERS);
  useEffect(() => {
    import('../db/commerce').then(({ fetchOrders }) => {
      fetchOrders().then(rows => { if (rows && rows.length) setData(rows); });
    });
  }, []);
  const rows = filter === 'all' ? data : data.filter(o => o.license.toLowerCase() === filter);
  const lifetime = data.reduce((s, o) => s + o.total, 0);
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 80px' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 10 }}>LICENSE LOCKER</div>
      <h1 style={{ fontSize: 36, marginBottom: 6 }}>Orders & licenses</h1>
      <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 24 }}>Every clip you've licensed, ready to re-download. Master files are held for you for 12 months after purchase.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)', borderRadius: 4, marginBottom: 28 }}>
        {[
          ['Lifetime spend', `$${lifetime.toFixed(2)}`],
          ['Licenses held', ORDERS.length],
          ['Pilots supported', new Set(ORDERS.map(o => VIDEOS.find(v => v.id === o.videoId)?.creator.handle)).size],
          ['Storage in locker', '287 GB'],
        ].map(([k, v], i) => (
          <div key={k} style={{ padding: '18px 22px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'personal', 'commercial', 'extended'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={'chip' + (filter === f ? ' active' : '')}
              style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--parchment-dim)' }}>
          <button data-placeholder="true">Export CSV</button>
          <span>·</span>
          <button data-placeholder="true">Download all receipts</button>
        </div>
      </div>

      {/* Order rows */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 2fr 1fr 1fr 110px 130px', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>
          <div>ORDER</div><div>CLIP</div><div>LICENSE</div><div>FILE</div><div style={{ textAlign: 'right' }}>TOTAL</div><div></div>
        </div>
        {rows.map((o, i) => {
          const v = VIDEOS.find(x => x.id === o.videoId);
          return (
            <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '140px 2fr 1fr 1fr 110px 130px', gap: 14, padding: '16px 18px', alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{o.id}</div>
                <div style={{ fontSize: 10, color: 'var(--parchment-dim)', marginTop: 2 }}>{o.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 56, height: 32, borderRadius: 2, background: thumbGradient(i + 2), flexShrink: 0 }}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v?.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v?.creator.handle}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{o.license}</div>
                <div style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>Non-exclusive</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{o.fileFormat}</div>
                <div style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>{o.fileSize}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>${o.total}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button className="btn secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => onNav('license', o.id)}>View</button>
                <button className="btn secondary" style={{ fontSize: 11, padding: '6px 10px' }} data-placeholder="true">↓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LicenseDetailPage({ orderId, onNav }) {
  const o = ORDERS.find(x => x.id === orderId) || ORDERS[0];
  const v = VIDEOS.find(x => x.id === o.videoId);
  const loc = LOCATIONS.find(l => l.id === v?.locationId);
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 28px 80px' }}>
      <button onClick={() => onNav('orders')} style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 20 }}>← Back to locker</button>

      {/* Certificate */}
      <div style={{ border: '1px solid var(--line-strong)', borderRadius: 8, overflow: 'hidden', background: 'var(--forest-950)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '36px 48px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg, var(--forest-950) 0%, var(--ink) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--amber)' }}><Ic.drone/></span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Drone<span style={{ color: 'var(--sunset)' }}>Icarus</span></span>
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--parchment-dim)' }}>LICENSE CERTIFICATE · v1.2</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>CERTIFICATE NO.</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{o.id}</div>
            </div>
          </div>
          <h1 style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 6 }}>{o.license} · Non-exclusive perpetual worldwide license</h1>
          <p style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>
            Issued {o.date} · Grants the below licensee the rights described in §3 to the aerial footage described in §1.
          </p>
        </div>

        <div style={{ padding: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>§1 · WORK</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 80, height: 50, background: thumbGradient(5), borderRadius: 2, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v?.title}</div>
                <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{v?.resolution} · {v?.duration} · ID {v?.id}</div>
              </div>
            </div>
            <Kv k="Location" v={`${loc?.name}, ${loc?.country}`}/>
            <Kv k="Coordinates" v={`${loc?.lat.toFixed(4)}°, ${loc?.lon.toFixed(4)}°`}/>
            <Kv k="Shot date" v="Mar 14, 2026 · 06:24 local"/>
            <Kv k="Format" v={`${o.fileFormat} · ${o.fileSize}`}/>
            <Kv k="Pilot" v={`${v?.creator.name} (${v?.creator.handle})`}/>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>§2 · LICENSEE</div>
            <Kv k="Name" v={CURRENT_USER.name}/>
            <Kv k="Email" v={CURRENT_USER.email}/>
            <Kv k="User ID" v={CURRENT_USER.id}/>
            <div className="eyebrow" style={{ margin: '22px 0 10px' }}>§4 · PAYMENT</div>
            <Kv k="Method" v={o.card}/>
            <Kv k="Subtotal" v={`$${o.subtotal}`}/>
            <Kv k="VAT" v={`$${o.tax}`}/>
            <Kv k="Total paid" v={`$${o.total}`} bold/>
          </div>
        </div>

        <div style={{ padding: '32px 48px', borderTop: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>§3 · GRANT OF RIGHTS</div>
          <p style={{ fontSize: 12, color: 'var(--parchment)', lineHeight: 1.7, marginBottom: 10 }}>
            Licensor grants Licensee a perpetual, worldwide, non-transferable, non-exclusive license to reproduce, distribute, publicly perform, and create derivative works based on the Work, subject to the {o.license} tier rights below. Credit line "<span className="mono">{v?.creator.handle} · Drone Icarus</span>" is required for the Personal tier only.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {[
              ['Broadcast / TV', o.license === 'Extended' ? 'ALLOWED' : 'NOT PERMITTED'],
              ['Advertising', o.license !== 'Personal' ? 'ALLOWED' : 'NOT PERMITTED'],
              ['Resale / sub-license', 'NOT PERMITTED'],
              ['NFT / web3', 'NOT PERMITTED'],
              ['AI training data', 'NOT PERMITTED'],
              ['Social / client edits', 'ALLOWED'],
            ].map(([k, v]) => (
              <div key={k} style={{ border: '1px solid var(--line)', padding: '10px 12px', borderRadius: 3 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: v === 'ALLOWED' ? 'var(--moss)' : 'var(--parchment-dim)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 48px 32px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>DIGITAL SIGNATURE · SHA-256</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--parchment)', wordBreak: 'break-all', maxWidth: 560 }}>
              a7f3 c841 29b5 ee07 · d4a9 3f18 6b2c 9e54 · {o.id.replace(/-/g, '').toLowerCase()} · signed by icarus.fly · rfc3161
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', fontWeight: 500, color: 'var(--bone)' }}>icarus.fly</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginTop: 4 }}>AUTHORIZED SIGNATORY</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
        <button className="btn" style={{ justifyContent: 'center', padding: 12 }} data-placeholder="true">Download PDF</button>
        <button className="btn secondary" style={{ justifyContent: 'center', padding: 12 }} data-placeholder="true">Verify signature</button>
        <button className="btn secondary" style={{ justifyContent: 'center', padding: 12 }} data-placeholder="true">Email a copy</button>
      </div>
    </div>
  );
}

function TotalRow({ k, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: bold ? 16 : 13, fontWeight: bold ? 600 : 400, color: bold ? 'var(--bone)' : 'var(--parchment)' }}>
      <span style={{ fontFamily: bold ? 'var(--font-display)' : 'inherit' }}>{k}</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
    </div>
  );
}

function Fld({ label, children }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function Kv({ k, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 12 }}>
      <span style={{ color: 'var(--parchment-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: 10 }}>{k}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: 'var(--bone)' }}>{v}</span>
    </div>
  );
}

const fstyle = {
  width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit',
  background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
  color: 'var(--bone)', borderRadius: 4, outline: 'none',
};

