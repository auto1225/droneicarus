const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fs = await import('node:fs/promises');
const sql = await fs.readFile('supabase/migrations/0014_analytics_page_views.sql', 'utf8');
const r = await fetch(`${SUPA_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
console.log('status', r.status, await r.text());
