// src/auth/RequireAdmin.jsx — gate admin routes
import React from 'react';
import { useAuth } from './AuthContext';

export function RequireAdmin({ onNav, children }) {
  const { loading, profile } = useAuth();
  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading…</div>;
  const isAdmin = profile?.role === 'admin';
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 28px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 12 }}>ADMIN ONLY</div>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>You don't have access.</h1>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 22 }}>This area is for Drone Icarus operators. If that's supposed to be you, sign in with the admin account.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => onNav('signin')} className="btn">Sign in</button>
          <button onClick={() => onNav('home')} className="btn secondary">Back to site</button>
        </div>
      </div>
    );
  }
  return children;
}
