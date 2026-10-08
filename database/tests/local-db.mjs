import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
export async function applyMigrations(db) {
  const names = (await fs.readdir(new URL('../migrations/', import.meta.url))).filter(name => name.endsWith('.sql')).sort();
  for (const name of names) {
    const shared = await fs.readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8');
    const mobile = await fs.readFile(new URL(`../../mobile/supabase/migrations/${name}`, import.meta.url), 'utf8');
    assert.equal(shared, mobile, `Shared/mobile migration mismatch: ${name}`);
    await db.exec(shared);
  }
}
export async function initializeLocalDatabase(db) {
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
  await applyMigrations(db);
}
