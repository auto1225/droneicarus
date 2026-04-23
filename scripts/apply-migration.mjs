// Apply a SQL file to Supabase Postgres via pg library
import pg from 'pg';
import { readFile } from 'node:fs/promises';

const DSN = process.env.SUPABASE_DB_URL;
const FILE = process.argv[2];
if (!DSN || !FILE) { console.error('usage: SUPABASE_DB_URL=... node apply-migration.mjs <path.sql>'); process.exit(1); }

const sql = await readFile(FILE, 'utf8');
const client = new pg.Client({ connectionString: DSN, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log(`[apply] ${FILE} OK`);
} catch (e) {
  console.error('[apply] FAIL:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
