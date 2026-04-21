// src/content/ContentContext.jsx — Global CMS-string provider.
//
// Loads every public.site_content row at app startup (single query), exposes
// them through useContent(key, fallback). Editors in AdminShell call
// `refresh()` after saving so public pages see new values without reload.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../supabase';

const ContentCtx = createContext({
  content: {},
  loading: true,
  get: (k, fb) => fb ?? k,
  refresh: async () => {},
});

export function ContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // runtime debug breadcrumb — survives minification
    if (typeof window !== 'undefined') {
      window.__content = window.__content || { steps: [] };
      window.__content.steps.push('load:start:' + Date.now());
    }
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value, type');
      if (error) throw error;
      const map = {};
      for (const row of data || []) {
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

  // Expose refresh globally so CMS editors elsewhere can trigger a reload
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
