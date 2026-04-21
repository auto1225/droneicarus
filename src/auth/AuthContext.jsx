// src/auth/AuthContext.jsx — Supabase session + profile context
//
// Profile loading uses raw REST (not supabase.from) because the Supabase JS
// client's table queries can hang during initial startup waiting on session
// restore/refresh. The raw path hits PostgREST directly with the already-
// available session token and resolves immediately.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function restProfile(userId, accessToken) {
  if (!userId || !SUPA_URL || !SUPA_KEY) return null;
  const url = `${SUPA_URL}/rest/v1/profiles?select=*&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + (accessToken || SUPA_KEY),
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] ?? null;
}

const AuthCtx = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId, accessToken) => {
    if (!userId) { setProfile(null); return; }
    try {
      const p = await restProfile(userId, accessToken);
      setProfile(p);
    } catch (e) {
      console.warn('[auth] profile load:', e?.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      await loadProfile(session?.user?.id, session?.access_token);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      setSession(newSession);
      await loadProfile(newSession?.user?.id, newSession?.access_token);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async ({ email, password, handle, displayName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        data: {
          handle: handle?.startsWith('@') ? handle : `@${handle}`,
          display_name: displayName,
          pending_role: role || 'viewer',
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
    return data;
  };

  const refreshProfile = async () => loadProfile(session?.user?.id, session?.access_token);

  return (
    <AuthCtx.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn, signUp, signOut, signInOAuth, refreshProfile,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
