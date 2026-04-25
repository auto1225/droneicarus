// src/db/commissions.js — REST + supabase-client helpers for the
// reverse-auction commission flow. Reads use the public REST endpoint
// (matches the videos.js pattern); writes use the supabase JS client so
// auth.uid() is sent through and RLS policies apply.
import { supabase } from '../supabase';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function restGet(path) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const res = await fetch(SUPA_URL + path, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      'Range-Unit': 'items',
      Range: '0-9999',
    },
  });
  if (!res.ok) {
    console.warn('[db.commissions]', path, res.status, (await res.text()).slice(0, 160));
    return [];
  }
  return await res.json();
}

// Browse open commissions. Filters: status (open/awarded/all), category, sort.
export async function fetchOpenCommissions({ status = 'open', category, sort = 'newest' } = {}) {
  const cols = 'id,buyer_id,title,brief,category,region,target_lat,target_lon,budget_max_usd,deadline,license_required,resolution_required,status,awarded_bid_id,bids_count,created_at,is_demo';
  const parts = [`select=${cols}`];
  if (status && status !== 'all') parts.push(`status=eq.${encodeURIComponent(status)}`);
  if (category && category !== 'all') parts.push(`category=eq.${encodeURIComponent(category)}`);
  let order;
  if (sort === 'closing') order = 'deadline.asc.nullslast';
  else if (sort === 'budget') order = 'budget_max_usd.desc';
  else order = 'created_at.desc';
  parts.push(`order=${order}`);
  return await restGet('/rest/v1/commission_requests?' + parts.join('&'));
}

// Detail page: request + its bids + pilot profiles for each bid.
export async function fetchCommission(id) {
  if (!id) return null;
  const reqRows = await restGet(`/rest/v1/commission_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!reqRows.length) return null;
  const req = reqRows[0];
  const bids = await restGet(`/rest/v1/commission_bids?select=*&request_id=eq.${encodeURIComponent(id)}&order=price_usd.asc`);

  // Hydrate pilot profiles in one round-trip
  const pilotIds = Array.from(new Set(bids.map(b => b.pilot_id).filter(Boolean)));
  let pilots = [];
  if (pilotIds.length > 0) {
    const inList = pilotIds.map(p => `"${p}"`).join(',');
    pilots = await restGet(`/rest/v1/profiles?select=id,handle,display_name,avatar_url,pilot_verified&id=in.(${inList})`);
  }
  const pilotById = Object.fromEntries(pilots.map(p => [p.id, p]));
  const bidsWithPilot = bids.map(b => ({ ...b, pilot: pilotById[b.pilot_id] || null }));
  return { ...req, bids: bidsWithPilot };
}

export async function createCommission(payload) {
  const { data, error } = await supabase
    .from('commission_requests')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function placeBid(payload) {
  const { data, error } = await supabase
    .from('commission_bids')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Buyer accepts a bid — mark this bid 'accepted', the rest 'rejected',
// and flip the request to 'awarded' with awarded_bid_id set.
export async function acceptBid(bidId, requestId) {
  // Accept this bid
  const { error: e1 } = await supabase
    .from('commission_bids')
    .update({ status: 'accepted' })
    .eq('id', bidId);
  if (e1) throw e1;

  // Reject the rest in this request that are still pending
  const { error: e2 } = await supabase
    .from('commission_bids')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .eq('status', 'pending')
    .neq('id', bidId);
  if (e2) throw e2;

  // Flip the request status
  const { error: e3 } = await supabase
    .from('commission_requests')
    .update({ status: 'awarded', awarded_bid_id: bidId })
    .eq('id', requestId);
  if (e3) throw e3;

  return true;
}
