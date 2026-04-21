// src/db/useSettings.js — React hook to read site_settings with fallback
import { useState, useEffect } from 'react';
import { getSetting } from './admin';

export function useSiteSetting(key, fallback) {
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    let alive = true;
    getSetting(key, fallback).then(v => { if (alive) setVal(v ?? fallback); });
    return () => { alive = false; };
  }, [key]);
  return val;
}
