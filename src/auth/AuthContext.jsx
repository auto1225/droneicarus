// src/auth/AuthContext.jsx — Supabase session + profile context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthCtx = createContext({
  session: null,
  user: null,       // auth.users row
  profile: null,    // profiles row (our app's data)
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

  const loadProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.warn('[auth] profile load:', error.message);
    setProfile(data ?? null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      await loadProfile(session?.user?.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      setSession(newSession);
      await loadProfile(newSession?.user?.id);
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
        emailRedirectTo: window.location.origin + window.location.pathname + '#home',
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
        redirectTo: window.location.origin + window.location.pathname + '#home',
      },
    });
    if (error) throw error;
    return data;
  };

  const refreshProfile = async () => loadProfile(session?.user?.id);

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
