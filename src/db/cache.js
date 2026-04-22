// db/cache.js — trigger the JIT cache worker after purchase
// Reads VITE_CACHE_WORKER_URL from env. If unset (e.g. local dev / worker not yet deployed),
// silently no-ops with a console warning so the rest of the purchase flow is unaffected.
import { supabase } from './supabase';

const WORKER_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CACHE_WORKER_URL) || '';

export async function triggerCachePurchase(orderId) {
  if (!WORKER_URL) {
    console.warn('[cache] VITE_CACHE_WORKER_URL not set — skipping JIT cache. Buyer will see "Preparing download…" until cache worker is configured.');
    return { ok: false, skipped: true };
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, error: 'no session' };

    const r = await fetch(`${WORKER_URL}/cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.warn('[cache] worker error:', r.status, j);
      return { ok: false, status: r.status, ...j };
    }
    return { ok: true, ...j };
  } catch (e) {
    console.warn('[cache] worker call failed:', e.message);
    return { ok: false, error: e.message };
  }
}
