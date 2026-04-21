// src/db/admin.js — admin CRUD helpers (site_settings, audit log, moderation ops)
import { supabase } from '../supabase';

// ───────────────────────── site_settings ─────────────────────────
// Key/JSONB store. Public read, admin write (enforced by RLS).
const _cache = new Map();
const _subs = new Set();

export async function getSetting(key, fallback = null) {
  if (_cache.has(key)) return _cache.get(key);
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) { console.warn('[settings]', key, error.message); return fallback; }
  const val = data?.value ?? fallback;
  _cache.set(key, val);
  return val;
}

export async function getAllSettings() {
  const { data, error } = await supabase.from('site_settings').select('key, value, updated_at');
  if (error) { console.warn('[settings] all', error.message); return []; }
  for (const r of data) _cache.set(r.key, r.value);
  return data;
}

export async function setSetting(key, value) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('site_settings').upsert({
    key, value, updated_by: user?.id, updated_at: new Date().toISOString()
  });
  if (error) throw error;
  _cache.set(key, value);
  _subs.forEach(fn => { try { fn(key, value); } catch {} });
  await logAction('setting.update', 'site_settings', key, { value });
}

export function onSettingChange(fn) { _subs.add(fn); return () => _subs.delete(fn); }

// ───────────────────────── audit log ─────────────────────────
export async function logAction(action, targetType, targetId, diff) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_audit_log').insert({
      admin_id: user?.id, action, target_type: targetType, target_id: String(targetId || ''), diff
    });
  } catch (e) { console.warn('[audit]', e.message); }
}

export async function fetchAuditLog({ limit = 50 } = {}) {
  const { data, error } = await supabase.from('admin_audit_log')
    .select('*, admin:profiles!admin_id(handle, display_name)')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) { console.warn('[audit] fetch', error.message); return []; }
  return data ?? [];
}

// ───────────────────────── users CRM ─────────────────────────
export async function adminListUsers({ q = '', limit = 50, offset = 0 } = {}) {
  let query = supabase.from('profiles')
    .select('id, handle, display_name, email, role, pilot_verified, followers_count, created_at, avatar_url, location, bio', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error, count } = await query;
  if (error) { console.warn('[users]', error.message); return { rows: [], total: 0 }; }
  return { rows: data ?? [], total: count ?? 0 };
}

export async function adminUpdateUser(id, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
  await logAction('user.update', 'profiles', id, patch);
}

export async function adminDeleteUser(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
  await logAction('user.delete', 'profiles', id, null);
}

// ───────────────────────── video moderation ─────────────────────────
export async function adminListVideos({ status, limit = 50, offset = 0 } = {}) {
  let q = supabase.from('videos')
    .select('id, title, status, category, resolution, price_usd, views, likes, created_at, location_id, owner:profiles!owner_id(handle, display_name)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) { console.warn('[videos]', error.message); return { rows: [], total: 0 }; }
  return { rows: data ?? [], total: count ?? 0 };
}

export async function adminSetVideoStatus(id, status) {
  const patch = { status };
  if (status === 'published') patch.published_at = new Date().toISOString();
  const { error } = await supabase.from('videos').update(patch).eq('id', id);
  if (error) throw error;
  await logAction('video.status', 'videos', id, { status });
}

export async function adminDeleteVideo(id) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
  await logAction('video.delete', 'videos', id, null);
}

// ───────────────────────── orders ─────────────────────────
export async function adminListOrders({ status, limit = 50, offset = 0 } = {}) {
  let q = supabase.from('orders')
    .select('id, total, subtotal, tax, license, status, created_at, payment_brand, buyer:profiles!buyer_id(handle, display_name), video:videos!video_id(title)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) { console.warn('[orders]', error.message); return { rows: [], total: 0 }; }
  return { rows: data ?? [], total: count ?? 0 };
}

export async function adminRefundOrder(id) {
  const { error } = await supabase.from('orders').update({ status: 'refunded' }).eq('id', id);
  if (error) throw error;
  await logAction('order.refund', 'orders', id, null);
}

// ───────────────────────── payouts ─────────────────────────
export async function adminListPayouts({ status, limit = 50, offset = 0 } = {}) {
  let q = supabase.from('payouts')
    .select('*, pilot:profiles!pilot_id(handle, display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  if (error) { console.warn('[payouts]', error.message); return { rows: [], total: 0 }; }
  return { rows: data ?? [], total: count ?? 0 };
}

export async function adminMarkPayoutPaid(id) {
  const { error } = await supabase.from('payouts').update({
    status: 'paid', paid_at: new Date().toISOString()
  }).eq('id', id);
  if (error) throw error;
  await logAction('payout.paid', 'payouts', id, null);
}

// ───────────────────────── dashboard stats ─────────────────────────
export async function adminDashboardStats() {
  const [u, v, o, p] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total, status', { count: 'exact' }),
    supabase.from('payouts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ]);
  const orders = o.data || [];
  const completed = orders.filter(x => x.status === 'complete' || x.status === 'processing');
  const revenue = completed.reduce((s, r) => s + Number(r.total || 0), 0);
  const platformFee = revenue * 0.30;
  return {
    usersTotal: u.count ?? 0,
    videosTotal: v.count ?? 0,
    ordersTotal: o.count ?? 0,
    revenueTotal: revenue,
    platformFeeTotal: platformFee,
    payoutsScheduled: p.count ?? 0,
  };
}

// ───────────────────────── location CRUD ─────────────────────────
export async function adminListLocations() {
  const { data, error } = await supabase.from('locations').select('*').order('featured', { ascending: false }).order('name');
  if (error) { console.warn('[locations]', error.message); return []; }
  return data ?? [];
}

export async function adminUpsertLocation(row) {
  const { id, ...rest } = row;
  const { error } = await supabase.from('locations').upsert({ id, ...rest });
  if (error) throw error;
  await logAction('location.upsert', 'locations', id, row);
}

export async function adminDeleteLocation(id) {
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw error;
  await logAction('location.delete', 'locations', id, null);
}
