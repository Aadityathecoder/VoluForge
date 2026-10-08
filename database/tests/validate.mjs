import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { initializeLocalDatabase } from './local-db.mjs';

const read = (path) => fs.readFile(new URL(path, import.meta.url), 'utf8');
const db = new PGlite();
try {
  await initializeLocalDatabase(db);
  const { rows } = await db.query(`
    select c.relname, c.relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and starts_with(c.relname, 'vf_')
    order by c.relname
  `);
  assert.equal(rows.length, 10, 'All ten application tables must exist');
  assert.ok(rows.every(row => row.relrowsecurity), 'RLS must protect every application table');
  const regression = await read('../../mobile/supabase/tests/rls_regression.sql');
  await db.exec(regression);
  await db.exec(await read('../../mobile/supabase/tests/opportunity_details.sql'));
  const checks = (regression.match(/select pg_temp\.(?:assert_true|expect_error)\(/g) || []).length;
  console.log(`PASS: baseline parity, ten RLS tables, and ${checks} workflow/security checks plus opportunity detail checks`);
} finally {
  await db.close();
}
