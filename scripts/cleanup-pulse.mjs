// scripts/cleanup-pulse.mjs — remove Reddit pulse + re-sanitize remaining summaries
const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

async function sb(path, opts = {}) {
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(SUPA_URL + path, {
    method: opts.method || 'GET', headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status} ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : null;
}

function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x?\d+;/g, ' ')
    .replace(/submitted by[\s\S]*$/i, '')
    .replace(/\[link\][\s\S]*$/i, '')
    .replace(/\s+/g, ' ').trim();
}

(async () => {
  // 1) Delete all Reddit-sourced pulse items (institution starts with "r/")
  const reddits = await sb('/rest/v1/lab_items?subsection=eq.pulse&institution=like.r/*&select=id&limit=2000');
  console.log(`[cleanup-pulse] Reddit items to delete: ${reddits.length}`);
  if (reddits.length) {
    for (let k = 0; k < reddits.length; k += 100) {
      const chunk = reddits.slice(k, k + 100);
      const ids = chunk.map(r => `"${r.id}"`).join(',');
      await sb(`/rest/v1/lab_items?id=in.(${ids})`, { method: 'DELETE', prefer: 'return=minimal' });
    }
    console.log(`[cleanup-pulse] deleted ${reddits.length}`);
  }

  // 2) Re-sanitize summaries on remaining pulse items
  const remaining = await sb('/rest/v1/lab_items?subsection=eq.pulse&select=id,summary&limit=2000');
  let cleaned = 0;
  for (const it of remaining) {
    const cleanSummary = decode(it.summary || '').slice(0, 500);
    if (cleanSummary !== (it.summary || '').trim()) {
      await sb(`/rest/v1/lab_items?id=eq.${encodeURIComponent(it.id)}`, {
        method: 'PATCH',
        body: { summary: cleanSummary },
        prefer: 'return=minimal',
      });
      cleaned++;
    }
  }
  console.log(`[cleanup-pulse] re-sanitized ${cleaned} remaining items`);
  console.log(`[cleanup-pulse] DONE — pulse left: ${remaining.length - 0}`);
})();
