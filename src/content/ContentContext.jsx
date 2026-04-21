// src/content/ContentContext.jsx — Global CMS-string provider.
//
// Loads every public.site_content row at app startup and exposes them through
// useContent(key, fallback). Uses a direct fetch to the Supabase REST endpoint
// (not the Supabase JS client) so the initial paint isn't blocked waiting for
// auth session hydration, token refresh, or schema validation.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ContentCtx = createContext({
  content: {},
  loading: true,
  get: (k, fb) => fb ?? k,
  refresh: async () => {},
});

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fetchAllContent() {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const url = `${SUPA_URL}/rest/v1/site_content?select=key,value,type`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
    },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.__content = window.__content || { steps: [] };
      window.__content.steps.push('load:start:' + Date.now());
    }
    try {
      const rows = await fetchAllContent();
      const map = {};
      for (const row of rows) {
        if (row.type === 'json' && row.value) {
          try { map[row.key] = JSON.parse(row.value); }
          catch (_) { map[row.key] = row.value; }
        } else {
          map[row.key] = row.value ?? '';
        }
      }
      setContent(map);
      if (typeof window !== 'undefined') {
        window.__content.loaded = true;
        window.__content.count = Object.keys(map).length;
        window.__content.sample = map['header.logo'];
        window.__content.steps.push('load:ok:' + Object.keys(map).length);
      }
    } catch (e) {
      console.warn('[content] load failed:', e?.message);
      if (typeof window !== 'undefined') {
        window.__content.error = String(e?.message || e);
        window.__content.steps.push('load:err:' + (e?.message || e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const get = useCallback((key, fallback) => {
    const v = content[key];
    if (v === undefined || v === null || v === '') return fallback ?? key;
    return v;
  }, [content]);

  const value = useMemo(() => ({ content, loading, get, refresh: load }), [content, loading, get, load]);

  if (typeof window !== 'undefined') {
    window.__refreshContent = load;
  }

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}

export function useContent(key, fallback) {
  const { get } = useContext(ContentCtx);
  return get(key, fallback);
}

export function useAllContent() {
  return useContext(ContentCtx);
}

export function tpl(value, vars = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
