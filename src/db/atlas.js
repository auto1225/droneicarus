// src/db/atlas.js — Atlas bounty system data access via raw REST
// Follows the same pattern as src/db/videos.js (avoids Supabase JS hang).
// Auth-required mutations send the user's bearer token.

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function authHeaders(accessToken) {
  return {
    apikey: SUPA_KEY,
    Authorization: 'Bearer ' + (accessToken || SUPA_KEY),
    'Content-Type': 'application/json',
  };
}

// ——— Read ———

export async function fetchBounties({ sort = 'votes', difficulty = 'all' } = {}) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const parts = ['select=*'];
  if (difficulty && difficulty !== 'all' && ['easy','moderate','hard','extreme'].includes(difficulty)) {
    parts.push(`difficulty=eq.${encodeURIComponent(difficulty)}`);
  }
  parts.push('order=created_at.desc');
  const res = await fetch(`${SUPA_URL}/rest/v1/bounties?${parts.join('&')}`, {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
  });
  if (!res.ok) {
    console.warn('[atlas] fetchBounties', res.status, (await res.text()).slice(0, 120));
    return [];
  }
  const bounties = await res.json();
  if (!Array.isArray(bounties) || bounties.length === 0) return [];

  // Pull stats for these bounties in one go
  const ids = bounties.map(b => b.id);
  const idList = ids.map(encodeURIComponent).join(',');
  const sres = await fetch(`${SUPA_URL}/rest/v1/bounty_stats?id=in.(${idList})`, {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
  });
  const stats = sres.ok ? await sres.json() : [];
  const sMap = new Map(stats.map(s => [s.id, s]));

  const merged = bounties.map(b => ({
    ...b,
    purse_total: sMap.get(b.id)?.purse_total ?? 0,
    votes_count: sMap.get(b.id)?.votes_count ?? 0,
    active_claims: sMap.get(b.id)?.active_claims ?? 0,
  }));

  if (sort === 'bounty')   merged.sort((a, b) => b.purse_total  - a.purse_total);
  else /* votes */         merged.sort((a, b) => b.votes_count  - a.votes_count);
  return merged;
}

export async function fetchBounty(id) {
  if (!SUPA_URL || !SUPA_KEY || !id) return null;
  const res = await fetch(`${SUPA_URL}/rest/v1/bounties?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  if (!rows.length) return null;
  const sres = await fetch(`${SUPA_URL}/rest/v1/bounty_stats?id=eq.${encodeURIComponent(id)}&limit=1`, {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
  });
  const stats = sres.ok ? (await sres.json())[0] : null;
  return { ...rows[0], purse_total: stats?.purse_total ?? 0, votes_count: stats?.votes_count ?? 0, active_claims: stats?.active_claims ?? 0 };
}

// ——— Aggregate stats panel ———

export async function fetchAtlasStats() {
  if (!SUPA_URL || !SUPA_KEY) {
    return { openCount: 0, totalPurse: 0, claimsThisMonth: 0, avgDaysToSubmit: 0, medianPurse: 0 };
  }
  const H = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };
  const [bRes, sRes, cRes] = await Promise.all([
    fetch(`${SUPA_URL}/rest/v1/bounties?select=id,status&status=eq.open`, { headers: H }),
    fetch(`${SUPA_URL}/rest/v1/bounty_stats?select=purse_total`, { headers: H }),
    fetch(`${SUPA_URL}/rest/v1/bounty_claims?select=claimed_at,submission_video_id,status,bounty_claims_with_video:videos(published_at)`, { headers: H }),
  ]);
  const open = bRes.ok ? await bRes.json() : [];
  const stats = sRes.ok ? await sRes.json() : [];
  const claims = cRes.ok ? await cRes.json() : [];

  const totalPurse = stats.reduce((s, r) => s + Number(r.purse_total || 0), 0);
  const purses = stats.map(r => Number(r.purse_total || 0)).sort((a, b) => a - b);
  const medianPurse = purses.length ? (purses.length % 2 === 0 ? (purses[purses.length/2 - 1] + purses[purses.length/2]) / 2 : purses[(purses.length - 1) / 2]) : 0;

  const monthAgo = Date.now() - 30 * 86400000;
  const claimsThisMonth = claims.filter(c => c.claimed_at && new Date(c.claimed_at).getTime() > monthAgo).length;

  // avg days from claimed_at -> submission's published_at, only for submitted/approved
  let totalDays = 0, count = 0;
  for (const c of claims) {
    if (!c.bounty_claims_with_video?.published_at || !c.claimed_at) continue;
    const days = (new Date(c.bounty_claims_with_video.published_at) - new Date(c.claimed_at)) / 86400000;
    if (days > 0 && days < 365) { totalDays += days; count++; }
  }
  const avgDaysToSubmit = count ? Math.round(totalDays / count) : 0;

  return {
    openCount: open.length,
    totalPurse,
    claimsThisMonth,
    avgDaysToSubmit,
    medianPurse: Math.round(medianPurse),
  };
}

// ——— Mutations (require auth) ———

export async function createBounty({ place, country, brief, lat, lon, difficulty, tags, deadline }, userId, accessToken) {
  if (!userId) throw new Error('Sign in to suggest a place');
  const body = {
    place, country, brief,
    lat: lat ?? null, lon: lon ?? null,
    difficulty,
    tags: tags || [],
    deadline: deadline || null,
    created_by: userId,
    is_demo: false,
  };
  const res = await fetch(`${SUPA_URL}/rest/v1/bounties`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('createBounty failed: ' + await res.text());
  return (await res.json())[0];
}

export async function voteBounty(bountyId, userId, accessToken) {
  if (!userId) throw new Error('Sign in to vote');
  const res = await fetch(`${SUPA_URL}/rest/v1/bounty_votes`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({ bounty_id: bountyId, voter_id: userId }),
  });
  if (!res.ok && res.status !== 409) throw new Error('voteBounty failed: ' + await res.text());
  return true;
}

export async function unvoteBounty(bountyId, userId, accessToken) {
  if (!userId) throw new Error('Sign in to unvote');
  const res = await fetch(
    `${SUPA_URL}/rest/v1/bounty_votes?bounty_id=eq.${encodeURIComponent(bountyId)}&voter_id=eq.${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: authHeaders(accessToken) }
  );
  if (!res.ok) throw new Error('unvoteBounty failed: ' + await res.text());
  return true;
}

export async function addToPurse(bountyId, amountUsd, userId, accessToken) {
  if (!userId) throw new Error('Sign in to contribute');
  const amt = Math.max(5, Math.floor(Number(amountUsd) || 0));
  const res = await fetch(`${SUPA_URL}/rest/v1/bounty_purses`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), Prefer: 'return=representation' },
    body: JSON.stringify({
      bounty_id: bountyId,
      contributor_id: userId,
      amount_usd: amt,
      is_demo: false,
    }),
  });
  if (!res.ok) throw new Error('addToPurse failed: ' + await res.text());
  return (await res.json())[0];
}

export async function claimBounty(bountyId, userId, accessToken, deadlineDays = 30) {
  if (!userId) throw new Error('Sign in to claim');
  const dl = new Date(Date.now() + deadlineDays * 86400000).toISOString();
  const res = await fetch(`${SUPA_URL}/rest/v1/bounty_claims`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), Prefer: 'return=representation' },
    body: JSON.stringify({
      bounty_id: bountyId,
      claimer_id: userId,
      deadline: dl,
      status: 'active',
    }),
  });
  if (!res.ok) throw new Error('claimBounty failed: ' + await res.text());
  return (await res.json())[0];
}

export async function submitClaim(claimId, videoId, accessToken) {
  const res = await fetch(`${SUPA_URL}/rest/v1/bounty_claims?id=eq.${encodeURIComponent(claimId)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(accessToken), Prefer: 'return=representation' },
    body: JSON.stringify({ submission_video_id: videoId, status: 'submitted' }),
  });
  if (!res.ok) throw new Error('submitClaim failed: ' + await res.text());
  return (await res.json())[0];
}

export async function hasUserVoted(bountyId, userId, accessToken) {
  if (!userId) return false;
  const res = await fetch(
    `${SUPA_URL}/rest/v1/bounty_votes?bounty_id=eq.${encodeURIComponent(bountyId)}&voter_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`,
    { headers: authHeaders(accessToken) }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return rows.length > 0;
}

export async function hasUserClaimed(bountyId, userId, accessToken) {
  if (!userId) return null;
  const res = await fetch(
    `${SUPA_URL}/rest/v1/bounty_claims?bounty_id=eq.${encodeURIComponent(bountyId)}&claimer_id=eq.${encodeURIComponent(userId)}&status=in.(active,submitted)&select=*&limit=1`,
    { headers: authHeaders(accessToken) }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}
