// src/db/admin.js — admin CRUD helpers via raw REST (bypasses Supabase JS hang).
//
// Everything admin-facing reads/writes through PostgREST directly, using the
// current admin session's access token. This avoids the startup hang that
// the Supabase JS client has with .from().select() on this project.

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function token() {
  try {
    const keys = Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k));
    for (const k of keys) {
      const v = JSON.parse(localStorage.getItem(k) || 'null');
      if (v?.access_token) return v.access_token;
    }
  } catch (_) {}
  return null;
}

async function req(path, { method = 'GET', body, prefer, count } = {}) {
  const t = token();
  const headers = {
    apikey: SUPA_KEY,
    Authorization: 'Bearer ' + (t || SUPA_KEY),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  if (count) headers.Prefer = (headers.Prefer ? headers.Prefer + ',' : '') + 'count=' + count;
  const res = await fetch(SUPA_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  const contentRange = res.headers.get('content-range');
  const total = contentRange ? Number(contentRange.split('/')[1]) : undefined;
  try { return { data: text ? JSON.parse(text) : null, total }; }
  catch (_) { return { data: text, total }; }
}

// ───────────────────────── site_settings ─────────────────────────
const _cache = new Map();
const _subs = new Set();

export async function getSetting(key, fallback = null) {
  if (_cache.has(key)) return _cache.get(key);
  try {
    const { data } = await req(`/rest/v1/site_settings?select=value&key=eq.${encodeURIComponent(key)}&limit=1`);
    const val = data?.[0]?.value ?? fallback;
    _cache.set(key, val);
    return val;
  } catch (e) { console.warn('[settings]', key, e.message); return fallback; }
}

export async function getAllSettings() {
  try {
    const { data } = await req('/rest/v1/site_settings?select=key,value,updated_at');
    for (const r of (data || [])) _cache.set(r.key, r.value);
    return data ?? [];
  } catch (e) { console.warn('[settings] all', e.message); return []; }
}

export async function setSetting(key, value) {
  await req('/rest/v1/site_settings?on_conflict=key', {
    method: 'POST',
    body: { key, value, updated_at: new Date().toISOString() },
    prefer: 'return=minimal,resolution=merge-duplicates',
  });
  _cache.set(key, value);
  _subs.forEach(fn => { try { fn(key, value); } catch {} });
  await logAction('setting.update', 'site_settings', key, { value });
}

export function onSettingChange(fn) { _subs.add(fn); return () => _subs.delete(fn); }

// ───────────────────────── audit log ─────────────────────────
export async function logAction(action, targetType, targetId, diff) {
  try {
    await req('/rest/v1/admin_audit_log', {
      method: 'POST',
      body: { action, target_type: targetType, target_id: String(targetId || ''), diff },
      prefer: 'return=minimal',
    });
  } catch (e) { console.warn('[audit]', e.message); }
}

export async function fetchAuditLog({ limit = 50 } = {}) {
  try {
    const { data } = await req(`/rest/v1/admin_audit_log?select=*,admin:profiles!admin_id(handle,display_name)&order=created_at.desc&limit=${limit}`);
    return data ?? [];
  } catch (e) { console.warn('[audit] fetch', e.message); return []; }
}

// ───────────────────────── users CRM ─────────────────────────
export async function adminListUsers({ q = '', role = '', verified = '', since = '', limit = 50, offset = 0 } = {}) {
  const parts = [
    'select=id,handle,display_name,email,role,pilot_verified,followers_count,created_at,avatar_url,location,bio',
    `order=created_at.desc`,
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (q) parts.push(`or=(handle.ilike.*${q}*,display_name.ilike.*${q}*,email.ilike.*${q}*)`);
  if (role) parts.push(`role=eq.${encodeURIComponent(role)}`);
  if (verified === 'true' || verified === 'false') parts.push(`pilot_verified=eq.${verified}`);
  if (since) parts.push(`created_at=gte.${encodeURIComponent(since)}`);
  try {
    const { data, total } = await req('/rest/v1/profiles?' + parts.join('&'), { count: 'exact' });
    return { rows: data ?? [], total: total ?? 0 };
  } catch (e) { console.warn('[users]', e.message); return { rows: [], total: 0 }; }
}

export async function adminUpdateUser(id, patch) {
  await req(`/rest/v1/profiles?id=eq.${id}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
  await logAction('user.update', 'profiles', id, patch);
}

export async function adminBulkUpdateUsers(ids, patch) {
  if (!ids?.length) return;
  const idList = '(' + ids.map(id => `"${id}"`).join(',') + ')';
  await req(`/rest/v1/profiles?id=in.${encodeURIComponent(idList)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
  await logAction('user.bulk_update', 'profiles', `${ids.length} rows`, patch);
}

export async function adminDeleteUser(id) {
  await req(`/rest/v1/profiles?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
  await logAction('user.delete', 'profiles', id, null);
}

// ───────────────────────── video moderation ─────────────────────────
export async function adminListVideos({ status, q = '', limit = 50, offset = 0 } = {}) {
  const parts = [
    'select=id,title,status,category,resolution,price_usd,views,likes,created_at,location_id,thumb_path,owner:profiles!owner_id(handle,display_name,avatar_url)',
    'order=created_at.desc',
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (status) parts.push(`status=eq.${encodeURIComponent(status)}`);
  if (q) parts.push(`or=(title.ilike.*${q}*,category.ilike.*${q}*)`);
  try {
    const { data, total } = await req('/rest/v1/videos?' + parts.join('&'), { count: 'exact' });
    return { rows: data ?? [], total: total ?? 0 };
  } catch (e) { console.warn('[videos]', e.message); return { rows: [], total: 0 }; }
}

export async function adminSetVideoStatus(id, status) {
  const patch = { status };
  if (status === 'published') patch.published_at = new Date().toISOString();
  await req(`/rest/v1/videos?id=eq.${id}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
  await logAction('video.status', 'videos', id, { status });
}

export async function adminBulkSetVideoStatus(ids, status) {
  if (!ids?.length) return;
  const patch = { status };
  if (status === 'published') patch.published_at = new Date().toISOString();
  const idList = '(' + ids.map(id => `"${id}"`).join(',') + ')';
  await req(`/rest/v1/videos?id=in.${encodeURIComponent(idList)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
  await logAction('video.bulk_status', 'videos', `${ids.length} rows`, { status });
}

export async function adminDeleteVideo(id) {
  await req(`/rest/v1/videos?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
  await logAction('video.delete', 'videos', id, null);
}

// ───────────────────────── orders ─────────────────────────
export async function adminListOrders({ status, q = '', from = '', to = '', limit = 50, offset = 0 } = {}) {
  const parts = [
    'select=id,total,subtotal,tax,license,status,created_at,payment_brand,buyer:profiles!buyer_id(handle,display_name,email),video:videos!video_id(title)',
    'order=created_at.desc',
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (status) parts.push(`status=eq.${encodeURIComponent(status)}`);
  if (from) parts.push(`created_at=gte.${encodeURIComponent(from)}`);
  if (to) parts.push(`created_at=lte.${encodeURIComponent(to)}`);
  try {
    const { data, total } = await req('/rest/v1/orders?' + parts.join('&'), { count: 'exact' });
    let rows = data ?? [];
    if (q) {
      const qq = q.toLowerCase();
      rows = rows.filter(r =>
        (r.buyer?.handle || '').toLowerCase().includes(qq) ||
        (r.buyer?.display_name || '').toLowerCase().includes(qq) ||
        (r.buyer?.email || '').toLowerCase().includes(qq) ||
        (r.video?.title || '').toLowerCase().includes(qq) ||
        String(r.id).includes(qq)
      );
    }
    return { rows, total: total ?? 0 };
  } catch (e) { console.warn('[orders]', e.message); return { rows: [], total: 0 }; }
}

export async function adminRefundOrder(id) {
  await req(`/rest/v1/orders?id=eq.${id}`, { method: 'PATCH', body: { status: 'refunded' }, prefer: 'return=minimal' });
  await logAction('order.refund', 'orders', id, null);
}

// ───────────────────────── payouts ─────────────────────────
export async function adminListPayouts({ status, limit = 50, offset = 0 } = {}) {
  const parts = [
    'select=*,pilot:profiles!pilot_id(handle,display_name,email)',
    'order=created_at.desc',
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (status) parts.push(`status=eq.${encodeURIComponent(status)}`);
  try {
    const { data, total } = await req('/rest/v1/payouts?' + parts.join('&'), { count: 'exact' });
    return { rows: data ?? [], total: total ?? 0 };
  } catch (e) { console.warn('[payouts]', e.message); return { rows: [], total: 0 }; }
}

export async function adminMarkPayoutPaid(id) {
  await req(`/rest/v1/payouts?id=eq.${id}`, { method: 'PATCH', body: { status: 'paid', paid_at: new Date().toISOString() }, prefer: 'return=minimal' });
  await logAction('payout.paid', 'payouts', id, null);
}

// ───────────────────────── dashboard stats ─────────────────────────
export async function adminDashboardStats() {
  const head = async (table, extra = '') => {
    try {
      const t = token();
      const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*${extra}`, {
        method: 'HEAD',
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + (t || SUPA_KEY), Prefer: 'count=exact' },
      });
      return Number((r.headers.get('content-range') || '0/0').split('/')[1] || 0);
    } catch (_) { return 0; }
  };
  const ordersRes = await req('/rest/v1/orders?select=total,status');
  const orders = ordersRes.data || [];
  const completed = orders.filter(x => x.status === 'complete' || x.status === 'processing');
  const revenue = completed.reduce((s, r) => s + Number(r.total || 0), 0);
  const platformFee = revenue * 0.30;
  const [usersTotal, videosTotal, payoutsScheduled] = await Promise.all([
    head('profiles'),
    head('videos'),
    head('payouts', '&status=eq.scheduled'),
  ]);
  return {
    usersTotal,
    videosTotal,
    ordersTotal: orders.length,
    revenueTotal: revenue,
    platformFeeTotal: platformFee,
    payoutsScheduled,
  };
}

// Monthly breakdown for the dashboard chart.
export async function adminMonthlyRevenue(months = 6) {
  try {
    const since = new Date(); since.setMonth(since.getMonth() - months);
    const { data } = await req(`/rest/v1/orders?select=total,status,created_at&created_at=gte.${since.toISOString()}&order=created_at.asc`);
    const buckets = {};
    for (const o of data || []) {
      if (!(o.status === 'complete' || o.status === 'processing')) continue;
      const d = new Date(o.created_at);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      buckets[k] = (buckets[k] || 0) + Number(o.total || 0);
    }
    return Object.entries(buckets).map(([label, total]) => ({ label, total }));
  } catch (e) { console.warn('[monthly]', e.message); return []; }
}

export async function adminUserGrowth(months = 6) {
  try {
    const since = new Date(); since.setMonth(since.getMonth() - months);
    const { data } = await req(`/rest/v1/profiles?select=created_at&created_at=gte.${since.toISOString()}&order=created_at.asc`);
    const buckets = {};
    for (const p of data || []) {
      const d = new Date(p.created_at);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      buckets[k] = (buckets[k] || 0) + 1;
    }
    return Object.entries(buckets).map(([label, count]) => ({ label, count }));
  } catch (e) { console.warn('[growth]', e.message); return []; }
}

export async function adminTopCreators(limit = 8) {
  try {
    const { data } = await req(`/rest/v1/profiles?select=id,handle,display_name,avatar_url,followers_count&role=eq.pilot&order=followers_count.desc&limit=${limit}`);
    return data ?? [];
  } catch (e) { return []; }
}

// ───────────────────────── location CRUD ─────────────────────────
export async function adminListLocations() {
  try {
    const { data } = await req('/rest/v1/locations?select=*&order=featured.desc.nullslast,name.asc');
    return data ?? [];
  } catch (e) { console.warn('[locations]', e.message); return []; }
}

export async function adminUpsertLocation(row) {
  const { id, ...rest } = row;
  const payload = id ? { id, ...rest } : rest;
  await req('/rest/v1/locations?on_conflict=id', {
    method: 'POST',
    body: payload,
    prefer: 'return=minimal,resolution=merge-duplicates',
  });
  await logAction('location.upsert', 'locations', id, row);
}

export async function adminDeleteLocation(id) {
  await req(`/rest/v1/locations?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
  await logAction('location.delete', 'locations', id, null);
}

// ───────────────────────── CSV helper ─────────────────────────
export function rowsToCsv(rows, columns) {
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = columns.map(c => c.label || c.key).join(',');
  const lines = rows.map(r => columns.map(c => {
    const v = typeof c.get === 'function' ? c.get(r) : r[c.key];
    return escape(v);
  }).join(','));
  return header + '\n' + lines.join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
