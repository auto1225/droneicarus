// src/toast.jsx — global toast notification system (ES module)
import React, { useState, useEffect } from 'react';
import { Ic } from './components';

// The `toast` function is populated by ToastStack's effect (keeps existing API).
// Call as: toast('Title', 'description', 'success'|'error'|'info')
export let toast = (title, desc, kind) => {
  // no-op until ToastStack mounts; queue could be added later
  if (typeof window !== 'undefined') {
    console.warn('[toast] called before ToastStack mounted:', title);
  }
};

export function ToastStack() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const recent = new Map(); // key → timestamp
    const fn = (title, desc, kind = 'success') => {
      const key = String(title) + '|' + String(desc || '');
      const now = Date.now();
      const last = recent.get(key) || 0;
      if (now - last < 1200) return; // dedupe identical toast within 1.2s
      recent.set(key, now);
      // Trim the map occasionally so it doesn't grow
      if (recent.size > 50) { const oldest = [...recent.entries()].sort((a,b)=>a[1]-b[1])[0]; recent.delete(oldest[0]); }
      const id = Date.now() + Math.random();
      setToasts(ts => [...ts, { id, title, desc, kind, leaving: false }]);
      setTimeout(() => {
        setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 220);
      }, 4200);
    };
    toast = fn;
    if (typeof window !== 'undefined') window.toast = fn;
  }, []);

  const close = (id) => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 220);
  };

  const iconFor = (k) => {
    if (k === 'success') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l6 6L20 6"/></svg>;
    if (k === 'error') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18"/></svg>;
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 8v5M12 17v0.01"/></svg>;
  };

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={'toast ' + t.kind + (t.leaving ? ' leaving' : '')}>
          <span className="toast-icon">{iconFor(t.kind)}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.desc && <div className="toast-desc">{t.desc}</div>}
          </div>
          <button className="toast-close" onClick={() => close(t.id)}><Ic.close/></button>
        </div>
      ))}
    </div>
  );
}
