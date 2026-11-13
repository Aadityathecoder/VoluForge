import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL with Supabase auth stand-ins. Fictional identities only.
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon, service_role;
  grant execute on function auth.uid() to authenticated, anon, service_role;
  create schema storage;
  create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text, unique(bucket_id, name));
  alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated, anon, service_role;
  grant select, insert, update, delete on storage.objects to authenticated;`);
const dir = new URL('../../mobile/supabase/migrations/', import.meta.url);
for (const name of (await fs.readdir(dir)).filter(n => n.endsWith('.sql')).sort()) await db.exec(await fs.readFile(new URL(name, dir), 'utf8'));

const ids = { admin: 'a0000000-0000-0000-0000-000000000001', verified: 'a0000000-0000-0000-0000-000000000002', s1: '50000000-0000-0000-0000-000000000001', s2: '50000000-0000-0000-0000-000000000002', google: '50000000-0000-0000-0000-000000000003' };
await db.query(`insert into auth.users(id,raw_user_meta_data) values
 ($1,'{"full_name":"Ada Admin","account_type":"admin","organization_name":"Northside High"}'),
 ($2,'{"full_name":"Vera Verified","account_type":"admin","organization_name":"Harbor Lab"}'),
 ($3,'{"full_name":"Sam Student","account_type":"student"}'),
 ($4,'{"full_name":"Lee Student","account_type":"student"}'),
 ($5,'{"name":"Gia Google"}')`, [ids.admin, ids.verified, ids.s1, ids.s2, ids.google]);
await db.query('update vf_profiles set admin_verified=true where id=$1', [ids.verified]);
const as = async id => { await db.exec('reset role; set role authenticated;'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); };
const rejects = async (sql, args, fragment) => { await assert.rejects(db.query(sql, args), e => e.message.toLowerCase().includes(fragment.toLowerCase()) || assert.fail(`${sql}: ${e.message}`)); };
const save = `select vf_admin_save_fellowship($1,$2,'Short summary','Long description','Education','Boston',false,current_date+7,current_date+60,current_date+5,$3,4,$4) id`;
let passed = 0; const ok = (c, l) => { assert.ok(c, l); passed++; };

// Account types from signup metadata; Google sign-ins must choose.
await as(ids.google);
ok((await db.query('select * from vf_me()')).rows[0].account_type === null, 'google user has no type yet');
await rejects(save, [null, 'Nope', 5, 'open'], 'administrator account required');
await db.query("select vf_choose_account_type('student')"); ok(true, 'choose type');
await rejects("select vf_choose_account_type('admin','X Org')", [], 'already set');
await rejects('update vf_profiles set account_type=$1 where id=$2', ['admin', ids.google], 'permission denied');
await rejects('update vf_profiles set admin_verified=true where id=$1', [ids.google], 'permission denied');
await rejects('select * from vf_fellowships', [], 'permission denied');

// Students cannot create fellowships; admins can.
await as(ids.s1); await rejects(save, [null, 'Student made', 5, 'open'], 'administrator account required');
await as(ids.admin); const priv = (await db.query(save, [null, 'Private cohort', 1, 'open'])).rows[0].id;
const draft = (await db.query(save, [null, 'Draft cohort', 5, 'draft'])).rows[0].id;
const code = (await db.query('select join_code from vf_admin_fellowships() where id=$1', [priv])).rows[0].join_code;
ok(/^[A-F0-9]{8}$/.test(code), 'join code generated');
await as(ids.verified); const pub = (await db.query(save, [null, 'Public cohort', 2, 'open'])).rows[0].id;
await as(ids.admin); await rejects(save, [pub, 'Hijack', 2, 'open'], 'not found');
await rejects('select * from vf_admin_roster($1)', [pub], 'not found');

// Directory: verified+open is public; unverified needs a code; drafts hidden; codes never exposed.
await as(ids.s1);
let dir1 = (await db.query('select * from vf_fellowship_directory()')).rows;
ok(dir1.length === 1 && dir1[0].id === pub, 'only verified open fellowship is public');
ok(!('join_code' in dir1[0]), 'no join code in student rows');
dir1 = (await db.query('select * from vf_fellowship_directory($1)', [code.toLowerCase()])).rows;
ok(dir1.some(r => r.id === priv) && !dir1.some(r => r.id === draft), 'code reveals private, not drafts');
await rejects("select vf_apply_to_fellowship($1,'hi')", [priv], 'join code');
await rejects("select vf_apply_to_fellowship($1,'hi')", [draft], 'not accepting');
await db.query("select vf_apply_to_fellowship($1,'I love tutoring',$2)", [priv, code]);
await db.query("select vf_apply_to_fellowship($1,'hello')", [pub]);
await rejects("select vf_apply_to_fellowship($1,'again')", [pub], 'already applied');
ok((await db.query('select * from vf_fellowship_directory()')).rows.some(r => r.id === priv && r.my_status === 'pending'), 'applied private stays visible');
await as(ids.verified); await rejects("select vf_apply_to_fellowship($1,'x')", [pub], 'only student');

// Admin reviews; capacity enforced; roster scoped.
await as(ids.s2); await db.query("select vf_apply_to_fellowship($1,'me too',$2)", [priv, code]);
await as(ids.admin);
const roster = (await db.query('select * from vf_admin_roster($1)', [priv])).rows;
ok(roster.length === 2 && roster[0].full_name && !('email' in roster[0]), 'roster');
await db.query("select vf_admin_decide_enrollment($1,$2,'accepted','Welcome')", [priv, ids.s1]);
await rejects("select vf_admin_decide_enrollment($1,$2,'accepted')", [priv, ids.s2], 'full');
ok((await db.query('select pending,accepted from vf_admin_fellowships() where id=$1', [priv])).rows[0].accepted === 1, 'counts');
await rejects('select vf_admin_delete_fellowship($1)', [priv], 'close this fellowship');
await db.query('select vf_admin_delete_fellowship($1)', [draft]); ok(true, 'delete draft');
const newCode = (await db.query('select vf_admin_new_join_code($1) c', [priv])).rows[0].c; ok(newCode !== code, 'rotate code');

// Student withdraws; seats free up.
await as(ids.s1); await db.query('select vf_withdraw_from_fellowship($1)', [priv]);
ok((await db.query('select seats_left,my_status from vf_fellowship_directory() where id=$1', [priv])).rows[0].my_status === 'withdrawn', 'withdrawn');
await db.exec('reset role; set role anon;');
await rejects('select * from vf_fellowship_directory()', [], 'permission denied');
console.log(`Fellowship database checks passed: ${passed}`);
