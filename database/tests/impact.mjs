import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { initializeLocalDatabase } from './local-db.mjs';
const db=new PGlite();
const staff='11111111-1111-4111-8111-111111111111',student='22222222-2222-4222-8222-222222222222',stranger='33333333-3333-4333-8333-333333333333',org='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',opp='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',app='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const asUser=async(id,fn)=>{await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn()}finally{await db.exec('reset role')}};
const denied=async(fn,pattern)=>{await assert.rejects(fn,pattern)};
try {
 await initializeLocalDatabase(db);
 await db.exec(`insert into auth.users(id) values('${staff}'),('${student}'),('${stranger}');
 insert into public.vf_organizations(id,name,verified) values('${org}','Test organization',true);
 insert into public.vf_org_staff(org_id,user_id) values('${org}','${staff}');
 insert into public.vf_opportunities(id,org_id,title,description,category,location,starts_at,ends_at,capacity,status,outcome_metric,outcome_target)
 values('${opp}','${org}','Reading session','Read books with a group of students.','Education','City',now()-interval '1 day',now()+interval '2 days',5,'published','students tutored',10);
 insert into public.vf_applications(id,student_id,opportunity_id,message,availability,status) values('${app}','${student}','${opp}','I can help students read.','Available this week','accepted');`);
 const {rows:[entry]}=await asUser(student,()=>db.query(`select * from public.vf_submit_impact($1,current_date,60,'Read with four students.','students tutored',4,'Attendance confirmed by coordinator.')`,[app]));
 const {rows:[outcome]}=await db.query('select * from public.vf_outcomes where service_entry_id=$1',[entry.id]);
 assert.equal(outcome.status,'pending');assert.equal(Number((await db.query('select count(*) from public.vf_service_entries')).rows[0].count),1);
 await asUser(student,()=>denied(()=>db.query("select public.vf_review_impact($1,'approved')",[outcome.id]),/membership|own outcome/));
 await asUser(stranger,()=>denied(()=>db.query("select public.vf_review_impact($1,'approved')",[outcome.id]),/membership/));
 await asUser(staff,()=>denied(()=>db.query("select public.vf_review_impact($1,'approved')",[outcome.id]),/Verify the service/));
 assert.equal((await asUser(student,()=>db.query('select * from public.vf_verified_outcomes()'))).rows.length,0);
 assert.equal((await asUser(stranger,()=>db.query('select * from public.vf_outcomes'))).rows.length,0);
 await asUser(student,()=>denied(()=>db.query('update public.vf_outcomes set quantity=999 where id=$1',[outcome.id]),/permission denied/));
 await asUser(staff,()=>db.query("select public.vf_review_service($1,'approved','Attendance verified')",[entry.id]));
 await asUser(staff,()=>db.query("select public.vf_review_impact($1,'approved','Attendance verified')",[outcome.id]));
 const verified=await asUser(student,()=>db.query('select * from public.vf_verified_outcomes()'));assert.equal(verified.rows.length,1);assert.equal(Number(verified.rows[0].quantity),4);
 await asUser(staff,()=>denied(()=>db.query("select public.vf_review_impact($1,'approved')",[outcome.id]),/Only pending/));
 await asUser(student,()=>denied(()=>db.query(`select public.vf_submit_impact($1,current_date,60,'Read with four students.','wrong metric',4,'Attendance confirmed by coordinator.')`,[app]),/metric/));
 const count=(await db.query('select count(*) from public.vf_service_entries')).rows[0].count;
 await asUser(student,()=>denied(()=>db.query(`select public.vf_submit_impact($1,current_date,60,'Read with four students.','students tutored',-1,'Attendance confirmed by coordinator.')`,[app]),/check constraint/));
 assert.equal((await db.query('select count(*) from public.vf_service_entries')).rows[0].count,count,'Invalid outcome rolls back the service entry');
 await db.exec('set role anon');assert.equal((await db.query('select * from public.vf_research_summary()')).rows.length,0);await denied(()=>db.query('select * from public.vf_outcomes'),/permission denied/);await db.exec('reset role');
 await db.exec(`insert into public.vf_org_staff(org_id,user_id) values('${org}','${student}');`);
 await asUser(student,()=>denied(()=>db.query("select public.vf_review_impact($1,'approved')",[outcome.id]),/own outcome/));
 await asUser(stranger,()=>denied(()=>db.query("select public.vf_save_service_opportunity(jsonb_build_object('org_id',$1::text,'title','A new project','description','Make a contribution to service.','starts_at',now(),'ends_at',now()+interval '2 hours','capacity',1))",[org]),/membership/));

 const posted=await asUser(staff,()=>db.query("select * from public.vf_save_service_opportunity(jsonb_build_object('org_id',$1::text,'title','Design a resource guide','description','Create a literacy resource guide for the center.','starts_at',now()+interval '3 days','ends_at',now()+interval '3 days 2 hours','capacity',3,'status','published','skills',jsonb_build_array('Design'),'min_experience',6,'urgency',5,'outcome_metric','guides published','outcome_target',2))",[org]));
 assert.equal(posted.rows[0].min_experience,6);assert.equal(posted.rows[0].urgency,5);assert.equal(posted.rows[0].outcome_metric,'guides published');assert.equal(Number(posted.rows[0].outcome_target),2);
 // Add four more participants to exercise the anonymous cohort threshold.
 for(let i=4;i<=7;i++) {
   const id=`${String(i).repeat(8)}-${String(i).repeat(4)}-4${String(i).repeat(3)}-8${String(i).repeat(3)}-${String(i).repeat(12)}`;
   await db.query('insert into auth.users(id) values($1)',[id]);
   const {rows:[a]}=await db.query("insert into public.vf_applications(student_id,opportunity_id,message,availability,status) values($1,$2,'I can support the reading group.','Available','accepted') returning id",[id,opp]);
   await db.query("insert into public.vf_service_entries(student_id,application_id,service_date,minutes,notes,status,reviewer_id,reviewed_at) values($1,$2,current_date,60,'Tutored readers for one hour.','approved',$3,now())",[id,a.id,staff]);
 }
 await db.exec('set role anon');const cohorts=await db.query('select * from public.vf_research_summary()');await db.exec('reset role');
 assert.equal(cohorts.rows.length,1);assert.equal(Number(cohorts.rows[0].volunteers),5);assert.deepEqual(Object.keys(cohorts.rows[0]).sort(),['cause','returning_volunteers','verified_hours','volunteers']);
 await db.query('update public.vf_profiles set deletion_requested_at=now() where id=$1',[student]);
 await asUser(student,()=>denied(()=>db.query('select * from public.vf_verified_outcomes()'),/active account/));
 console.log('PASS: outcome isolation, separate review, self-review prevention, atomic submission, verified export, cohort suppression, deletion freeze');
} finally {await db.close()}
