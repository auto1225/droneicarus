// db/lab.js — Lab section data access (raw REST pattern; Supabase JS hangs on first paint)
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eotsbncgkgewgbemaarp.supabase.co';
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

import { supabase } from '../supabase';

async function sessionHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${token || SUPA_KEY}`,
    'Content-Type': 'application/json',
  };
}

function anonHeaders() {
  return { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
}

// ─── Items ─────────────────────────────────────────────────────────────
export async function fetchLabItems({ subsection, tag, type, status = 'approved', limit = 40, order = 'published_at.desc.nullslast' } = {}) {
  const parts = [
    'select=id,title,slug,summary,cover_image_url,external_url,document_url,document_type,authors,institution,published_at,tags,level,price_min_usd,price_max_usd,brand,type,subsection,upvotes,saves,views,featured,created_at',
    `status=eq.${status}`,
    `limit=${limit}`,
    `order=${order}`,
  ];
  if (subsection) parts.push(`subsection=eq.${encodeURIComponent(subsection)}`);
  if (type)       parts.push(`type=eq.${encodeURIComponent(type)}`);
  if (tag)        parts.push(`tags=cs.{${encodeURIComponent(tag)}}`);

  const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?${parts.join('&')}`, { headers: anonHeaders() });
  if (!r.ok) { console.warn('[lab]', r.status, await r.text()); return []; }
  return r.json();
}

export async function fetchLabItem(id) {
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: anonHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] || null;
}

export async function bumpLabItemView(id) {
  // Fire-and-forget. Not perfect under RLS (admins only can update),
  // but anon views can be counted via a separate "lab_views" log table if needed.
  try {
    await fetch(`${SUPA_URL}/rest/v1/rpc/lab_bump_view`, {
      method: 'POST',
      headers: anonHeaders(),
      body: JSON.stringify({ p_item: id }),
    });
  } catch (_) {}
}

// ─── Tags ──────────────────────────────────────────────────────────────
export async function fetchLabTags() {
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_tags?select=slug,label_en,label_ko,parent_slug,icon,item_count,sort_order&order=sort_order.asc,label_en.asc&limit=200`, { headers: anonHeaders() });
  if (!r.ok) return [];
  return r.json();
}

// ─── Votes / Saves ─────────────────────────────────────────────────────
export async function toggleLabVote(itemId) {
  const h = await sessionHeaders();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to vote');

  // Try insert; on conflict, delete (toggle)
  const del = await fetch(`${SUPA_URL}/rest/v1/lab_votes?item_id=eq.${itemId}&user_id=eq.${user.id}`,
    { method: 'DELETE', headers: { ...h, Prefer: 'return=representation' } });
  const delRows = del.ok ? await del.json().catch(() => []) : [];
  if (delRows && delRows.length > 0) return { voted: false };

  const ins = await fetch(`${SUPA_URL}/rest/v1/lab_votes`, {
    method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ item_id: itemId, user_id: user.id, vote: 1 }),
  });
  if (!ins.ok) throw new Error(`vote failed: ${ins.status}`);
  return { voted: true };
}

export async function toggleLabSave(itemId) {
  const h = await sessionHeaders();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to save');

  const del = await fetch(`${SUPA_URL}/rest/v1/lab_saves?item_id=eq.${itemId}&user_id=eq.${user.id}`,
    { method: 'DELETE', headers: { ...h, Prefer: 'return=representation' } });
  const delRows = del.ok ? await del.json().catch(() => []) : [];
  if (delRows && delRows.length > 0) return { saved: false };

  const ins = await fetch(`${SUPA_URL}/rest/v1/lab_saves`, {
    method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ item_id: itemId, user_id: user.id }),
  });
  if (!ins.ok) throw new Error(`save failed: ${ins.status}`);
  return { saved: true };
}

export async function fetchMyVotes() {
  const h = await sessionHeaders();
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_votes?select=item_id`, { headers: h });
  if (!r.ok) return new Set();
  const rows = await r.json();
  return new Set(rows.map(x => x.item_id));
}

export async function fetchMySaves() {
  const h = await sessionHeaders();
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_saves?select=item_id`, { headers: h });
  if (!r.ok) return new Set();
  const rows = await r.json();
  return new Set(rows.map(x => x.item_id));
}

// ─── Admin ops (require admin session) ─────────────────────────────────
export async function adminListLabItems({ status, subsection, limit = 100, offset = 0 } = {}) {
  const h = await sessionHeaders();
  const parts = [
    'select=*',
    `limit=${limit}`,
    `offset=${offset}`,
    'order=created_at.desc',
  ];
  if (status)     parts.push(`status=eq.${status}`);
  if (subsection) parts.push(`subsection=eq.${subsection}`);
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?${parts.join('&')}`, { headers: h });
  if (!r.ok) return [];
  return r.json();
}

export async function adminUpsertLabItem(item) {
  const h = await sessionHeaders();
  const url = item.id
    ? `${SUPA_URL}/rest/v1/lab_items?id=eq.${item.id}`
    : `${SUPA_URL}/rest/v1/lab_items`;
  const r = await fetch(url, {
    method: item.id ? 'PATCH' : 'POST',
    headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify(item.id ? item : { ...item, status: item.status || 'approved' }),
  });
  if (!r.ok) throw new Error(await r.text());
  const rows = await r.json();
  return rows?.[0] || null;
}

export async function adminDeleteLabItem(id) {
  const h = await sessionHeaders();
  const r = await fetch(`${SUPA_URL}/rest/v1/lab_items?id=eq.${id}`, { method: 'DELETE', headers: h });
  if (!r.ok) throw new Error(await r.text());
  return true;
}

export async function adminSetLabStatus(id, status) {
  return adminUpsertLabItem({ id, status });
}
