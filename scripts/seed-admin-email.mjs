const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('missing env'); process.exit(1); }

const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };
const EMAIL = 'droneicarusadmin@gmail.com';

async function upsertContent(key, value, category = 'footer', type = 'text') {
  const body = JSON.stringify({ key, value: typeof value === 'string' ? value : JSON.stringify(value), category, type });
  const r = await fetch(`${SUPA_URL}/rest/v1/site_content?on_conflict=key`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body,
  });
  console.log(`  ${key} → ${r.status}`);
}

async function upsertSetting(key, value) {
  const r = await fetch(`${SUPA_URL}/rest/v1/site_settings?on_conflict=key`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key, value: { v: value } }),
  });
  console.log(`  setting:${key} → ${r.status}`);
}

(async () => {
  console.log('[seed-admin-email] starting');
  await upsertContent('footer.contact_email', EMAIL, 'footer', 'text');
  await upsertContent('legal.contact_email', EMAIL, 'legal', 'text');
  await upsertContent('legal.dmca_email',    EMAIL, 'legal', 'text');
  await upsertSetting('support_email', EMAIL);
  console.log('[seed-admin-email] DONE');
})();
