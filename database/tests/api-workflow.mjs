import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { initializeLocalDatabase } from './local-db.mjs';
const db = new PGlite();
const volunteer = '11111111-1111-4111-8111-111111111111';
const nonprofit = '22222222-2222-4222-8222-222222222222';
const scalar = async (sql, values = []) => (await db.query(sql, values)).rows[0];
async function asUser(uid, query, values = []) {
  await db.exec('begin; set local role authenticated');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [uid]);
    const result = await db.query(query, values);
    await db.exec('commit'); return result;
  } catch (error) { await db.exec('rollback'); throw error; }
}
try {
  await initializeLocalDatabase(db);
  assert.equal((await scalar('select count(*)::int n from vf_profiles')).n, 0);
  await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', [volunteer, { full_name: 'Test Volunteer', account_type: 'volunteer' }]);
  assert.equal((await scalar('select full_name from vf_profiles where id=$1', [volunteer])).full_name, 'Test Volunteer');
  assert.equal((await scalar('select count(*)::int n from vf_organizations')).n, 0);
  await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', [nonprofit, { full_name: 'Test Owner', account_type: 'nonprofit', organization_name: 'Test Nonprofit', verified: true, role: 'admin' }]);
  const org = await scalar('select o.id,o.verified,s.role from vf_organizations o join vf_org_staff s on s.org_id=o.id where s.user_id=$1', [nonprofit]);
  assert.equal(org.verified, false); assert.equal(org.role, 'owner');
  assert.equal((await scalar('select count(*)::int n from vf_profiles')).n, 2);
  await assert.rejects(db.query('insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),$1)', [{ account_type: 'nonprofit' }]));
  assert.equal((await scalar('select count(*)::int n from auth.users')).n, 2, 'Invalid signup rolls back account and organization');
  const payload = { org_id: org.id, title: 'API workflow opportunity', description: 'Help distribute community supplies.', starts_at: '2099-01-01T12:00:00Z', ends_at: '2099-01-01T15:00:00Z', capacity: 10, status: 'published' };
  await assert.rejects(asUser(nonprofit, 'select (vf_upsert_opportunity($1)).id', [payload]));
  assert.equal((await scalar('select count(*)::int n from vf_opportunities')).n, 0);
  await db.query('update vf_organizations set verified=true where id=$1', [org.id]);
  await assert.rejects(asUser(volunteer, 'select (vf_upsert_opportunity($1)).id', [payload]));
  const opportunity = (await asUser(nonprofit, 'select (vf_upsert_opportunity($1)).id', [payload])).rows[0].id;
  assert.equal((await scalar('select count(*)::int n from vf_opportunities')).n, 1);
  assert.equal((await asUser(volunteer, "select id from vf_opportunities where status='published'")).rows[0].id, opportunity);
  assert.equal((await scalar('select count(*)::int n from vf_applications')).n, 0);
  const application = (await asUser(volunteer, 'select (vf_apply_to_opportunity($1,$2,$3)).id', [opportunity, 'I can help distribute supplies.', 'Saturday afternoon'])).rows[0].id;
  const stored = await scalar('select student_id,status from vf_applications where id=$1', [application]);
  assert.equal(stored.student_id, volunteer); assert.equal(stored.status, 'pending');
  await assert.rejects(asUser(volunteer, 'select vf_apply_to_opportunity($1,$2,$3)', [opportunity, 'Duplicate application request.', 'Saturday']));
  await assert.rejects(asUser(nonprofit, 'select vf_apply_to_opportunity($1,$2,$3)', [opportunity, 'Staff must not self apply here.', 'Saturday']));
  assert.equal((await scalar('select count(*)::int n from vf_applications')).n, 1);
  assert.equal((await asUser(nonprofit, 'select id from vf_applications where opportunity_id=$1', [opportunity])).rows[0].id, application);
  await db.query('update vf_org_staff set active=false where user_id=$1', [nonprofit]);
  assert.equal((await asUser(nonprofit, 'select id from vf_applications where opportunity_id=$1', [opportunity])).rows.length, 0);
  console.log('PASS: direct PostgreSQL signup, atomic rollback, verification, publishing, volunteer visibility, application, duplicate rejection, staff review and revocation. Auth HTTP remains separate.');
} finally { await db.close(); }
