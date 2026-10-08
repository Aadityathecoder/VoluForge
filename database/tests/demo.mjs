import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { initializeLocalDatabase } from './local-db.mjs';

// An isolated PostgreSQL database. These fictional identities are never
// inserted into a hosted Supabase Auth service.
const db = new PGlite();
const student = '11111111-1111-1111-1111-111111111111';
const reviewer = '33333333-3333-3333-3333-333333333333';
const org = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
async function asUser(id) {
  await db.exec('reset role; set role authenticated;');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function show(label, sql, args = []) {
  const { rows } = await db.query(sql, args);
  console.log(`\n${label}\nSQL: ${sql}`);
  console.table(rows);
  return rows;
}
try {
  await initializeLocalDatabase(db);
  console.log('VoluForge query demo — isolated PostgreSQL / fictional records');
  await db.query(`insert into auth.users(id,raw_user_meta_data) values
    ($1,'{"full_name":"Demo Student"}'),($2,'{"full_name":"Demo Reviewer"}')`, [student, reviewer]);
  await db.query("insert into vf_organizations(id,name,verified) values($1,'Fictional Community Kitchen',true)", [org]);
  await db.query("insert into vf_org_staff(org_id,user_id,role) values($1,$2,'owner')", [org, reviewer]);
  await asUser(reviewer);
  const [{ id: opportunity }] = await show('1. Reviewer publishes an opportunity',
    `select id,title,address,requirements from vf_upsert_opportunity(jsonb_build_object(
      'org_id',$1::text,'title','Demo: prepare community meals',
      'description','Fictional supervised cooking session for the database demo.',
      'location','Demo community center','address','Demo kitchen room',
      'requirements',jsonb_build_array('Wear closed-toe shoes'),
      'starts_at',now()-interval '2 hours','ends_at',now()+interval '2 hours',
      'capacity',2,'status','published'))`, [org]);
  await asUser(student);
  await show('2. Student discovers opportunities and remaining capacity',
    'select o.title,o.address,s.spots_left from vf_opportunities o join vf_available_spots() s on s.opportunity_id=o.id');
  await db.query('insert into vf_saved(user_id,opportunity_id) values($1,$2)', [student, opportunity]);
  const [{ id: application }] = await show('3. Student applies',
    'select id,status from vf_apply_to_opportunity($1,$2,$3)', [opportunity, 'I would like to help prepare meals.', 'The full session']);
  await asUser(reviewer);
  await show('4. Reviewer accepts the application',
    "select status from vf_decide_application($1,'accepted')", [application]);
  await asUser(student);
  const [{ id: entry }] = await show('5. Student submits 90 minutes of service',
    'select id,minutes,status from vf_submit_service($1,current_date,90,$2)', [application, 'Prepared and packed meals alongside the team.']);
  let record = await show('6. Pending time does not count as verified service',
    'select count(*)::int as entries,coalesce(sum(minutes),0)::int as minutes from vf_verified_record()');
  assert.equal(record[0].minutes, 0);
  await asUser(reviewer);
  await show('7. Reviewer approves the service',
    "select status from vf_review_service($1,'approved','Checked by the demo reviewer')", [entry]);
  await asUser(student);
  record = await show('8. The verified record now contains 1.5 approved hours',
    'select opportunity_title,organization_name,minutes,round(minutes/60.0,2) as hours from vf_verified_record()');
  assert.equal(record[0].minutes, 90);
  await show('9. Remaining capacity reflects the accepted student', 'select spots_left from vf_available_spots()');
  console.log('\nPASS: publish → discover → save → apply → accept → submit → approve → verified record');
  console.log('Scope: SQL/RLS execution only. Hosted Auth, Storage and device integration are separate checks.');
} finally { await db.close(); }
