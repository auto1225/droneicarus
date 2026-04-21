// src/auth/RequireAuth.jsx — gate component for pages requiring sign-in
import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '../toast';

export function RequireAuth({ children, onNav, message = 'Sign in to continue' }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      toast?.('Sign in required', message, 'error');
      onNav?.('signin');
    }
  }, [user, loading, onNav, message]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)' }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Checking session…
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Sign-in required</div>
        <div style={{ color: 'var(--parchment-dim)', marginBottom: 20 }}>{message}</div>
        <button className="btn" onClick={() => onNav?.('signin')}>Sign in</button>
      </div>
    );
  }
  return children;
}
