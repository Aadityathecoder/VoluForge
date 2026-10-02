import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const read = (path) => fs.readFile(new URL(path, import.meta.url), 'utf8');
const migration = await read('../migrations/202609280001_voluforge_native.sql');
assert.equal(migration, await read('../../mobile/supabase/migrations/202609280001_voluforge_native.sql'),
  'Shared and mobile baselines must match; add new migrations for schema changes.');

const db = new PGlite();
try {
  // Minimal substitutes only; no hosted Auth or Storage services are simulated.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),
      bucket_id text, name text, owner_id text, unique(bucket_id, name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated, anon, service_role;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  await db.exec(migration);
  const { rows } = await db.query(`
    select c.relname, c.relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and starts_with(c.relname, 'vf_')
    order by c.relname
  `);
  assert.equal(rows.length, 9, 'All nine application tables must exist');
  assert.ok(rows.every(row => row.relrowsecurity), 'RLS must protect every application table');
  const regression = await read('../../mobile/supabase/tests/rls_regression.sql');
  await db.exec(regression);
  const checks = (regression.match(/select pg_temp\.(?:assert_true|expect_error)\(/g) || []).length;
  console.log(`PASS: baseline parity, nine RLS tables, and ${checks} workflow/security checks`);
} finally {
  await db.close();
}
