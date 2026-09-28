-- Run as database owner on a disposable/local Supabase database AFTER migration.
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_regression.sql
-- Entire fixture and helper lifecycle is rolled back.
begin;
set local timezone = 'UTC';
-- Simulate permissive legacy storage policy: new restrictive fences must still protect proof.
create policy vf_test_legacy_broad on storage.objects for all to authenticated using(true) with check(true);
create function pg_temp.assert_true(p_ok boolean,p_label text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception 'FAIL: %',p_label; end if; end $$;
create function pg_temp.expect_error(p_sql text,p_fragment text) returns void language plpgsql as $$
begin
  begin execute p_sql;
  exception when others then
    if position(lower(p_fragment) in lower(sqlerrm))>0 then return; end if;
    raise exception 'Unexpected error for %: %',p_sql,sqlerrm;
  end;
  raise exception 'Expected error, but query succeeded: %',p_sql;
end $$;
insert into auth.users(id,raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','{"full_name":"Student One"}'),
 ('22222222-2222-2222-2222-222222222222','{"full_name":"Student Two"}'),
 ('33333333-3333-3333-3333-333333333333','{"full_name":"Partner Reviewer"}'),
 ('44444444-4444-4444-4444-444444444444','{"full_name":"Other Reviewer"}');
insert into public.vf_organizations(id,name,verified) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Verified Community Kitchen',true),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Other Verified Organization',true),
 ('cccccccc-cccc-cccc-cccc-cccccccccccc','Unverified Organization',false);
insert into public.vf_org_staff(org_id,user_id) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333'),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','44444444-4444-4444-4444-444444444444');
insert into public.vf_opportunities(id,org_id,title,description,starts_at,ends_at,capacity,status) values
 ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Meal prep','Prepare meals for neighbors.',now()-interval '1 day',now()+interval '1 day',1,'published'),
 ('aaaaaaaa-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Food packing','Pack pantry boxes with staff.',now()-interval '1 day',now()+interval '1 day',4,'published'),
 ('cccccccc-0000-0000-0000-000000000001','cccccccc-cccc-cccc-cccc-cccccccccccc','Unverified event','This event must not be accessible.',now()-interval '1 day',now()+interval '1 day',4,'published');
set local role anon;
select pg_temp.expect_error('select * from public.vf_opportunities','permission denied');
select pg_temp.expect_error('select public.vf_available_spots()','permission denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select pg_temp.assert_true((select count(*)=1 from public.vf_profiles),'students see only own profile');
select pg_temp.assert_true((select count(*)=2 from public.vf_opportunities),'unverified organizations not discovered');
select pg_temp.expect_error('update public.vf_profiles set deletion_requested_at=now()','permission denied');
select pg_temp.expect_error($q$insert into public.vf_org_staff(org_id,user_id) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',auth.uid())$q$,'permission denied');
select public.vf_apply_to_opportunity('aaaaaaaa-0000-0000-0000-000000000001','I can prepare food safely.','Saturday morning');
select public.vf_apply_to_opportunity('aaaaaaaa-0000-0000-0000-000000000002','I can organize pantry supplies.','Saturday afternoon');
select pg_temp.expect_error($q$select public.vf_apply_to_opportunity('aaaaaaaa-0000-0000-0000-000000000001','Another application','Saturday')$q$,'already applied');
select pg_temp.expect_error($q$select public.vf_apply_to_opportunity('cccccccc-0000-0000-0000-000000000001','I am interested here','Saturday')$q$,'not verified');
select pg_temp.expect_error($q$select public.vf_submit_service((select id from public.vf_applications limit 1),current_date,60,'Meaningful completed work notes.')$q$,'accepted application');
select pg_temp.assert_true((select count(*)=0 from public.vf_verified_record()),'pending applications have no approved records');
insert into public.vf_saved(user_id,opportunity_id) values(auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
select pg_temp.assert_true((select count(*)=0 from public.vf_applications),'other student applications private');
select pg_temp.assert_true((select count(*)=0 from public.vf_saved),'other student bookmarks private');
select public.vf_apply_to_opportunity('aaaaaaaa-0000-0000-0000-000000000001','I can also assist with meal prep.','Saturday morning');
select set_config('request.jwt.claim.sub','44444444-4444-4444-4444-444444444444',true);
select pg_temp.assert_true((select count(*)=0 from public.vf_applications),'unrelated staff cannot read applications');
select pg_temp.expect_error($q$select public.vf_upsert_opportunity(jsonb_build_object('org_id','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','title','Bad event'))$q$,'membership required');
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
select pg_temp.assert_true((select count(*)=3 from public.vf_applications),'staff see organization applications');
select pg_temp.assert_true((select count(*)=3 from public.vf_profiles),'staff see applicants and own profile');
select pg_temp.expect_error($q$select public.vf_apply_to_opportunity('aaaaaaaa-0000-0000-0000-000000000001','I am staff but trying to apply','Saturday')$q$,'staff cannot apply');
select public.vf_decide_application((select id from public.vf_applications where student_id='11111111-1111-1111-1111-111111111111' and opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'),'accepted');
select public.vf_decide_application((select id from public.vf_applications where student_id='11111111-1111-1111-1111-111111111111' and opportunity_id='aaaaaaaa-0000-0000-0000-000000000002'),'accepted');
select pg_temp.expect_error($q$select public.vf_decide_application((select id from public.vf_applications where student_id='22222222-2222-2222-2222-222222222222'),'accepted')$q$,'full');
select pg_temp.assert_true((select spots_left=0 from public.vf_available_spots() where opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'),'aggregate capacity correct');
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select public.vf_submit_service((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'),current_date,60,'Prepared nutritious meals with the kitchen team.');
select pg_temp.assert_true((select count(*)=0 from public.vf_verified_record()),'pending service excluded from verified records');
select pg_temp.expect_error($q$update public.vf_service_entries set status='approved'$q$,'permission denied');
select pg_temp.expect_error($q$select public.vf_submit_service((select id from public.vf_applications limit 1),current_date+1,60,'Future service should not be accepted.')$q$,'service date');
select pg_temp.expect_error($q$select public.vf_submit_service((select id from public.vf_applications limit 1),current_date,721,'Too many minutes in one service entry.')$q$,'between 1 and 720');
select pg_temp.expect_error($q$select public.vf_submit_service((select id from public.vf_applications limit 1),current_date,60,'Trying someone elses uploaded proof.','22222222-2222-2222-2222-222222222222/1234.jpg')$q$,'own private folder');
select pg_temp.expect_error($q$select public.vf_withdraw_application((select application_id from public.vf_service_entries limit 1))$q$,'service records');
-- Object metadata fixture; live production always uses Storage API for upload/delete.
insert into storage.objects(bucket_id,name,owner_id) values('vf-proofs','11111111-1111-1111-1111-111111111111/00000000-0000-0000-0000-000000000001.jpg',auth.uid()::text);
select public.vf_submit_service((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'),current_date,30,'Sorted produce and cleaned preparation area.','11111111-1111-1111-1111-111111111111/00000000-0000-0000-0000-000000000001.jpg');
delete from storage.objects where name='11111111-1111-1111-1111-111111111111/00000000-0000-0000-0000-000000000001.jpg';
select pg_temp.assert_true((select count(*)=1 from storage.objects),'submitted proof cannot be deleted');
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
select pg_temp.assert_true((select count(*)=0 from storage.objects),'another student cannot read proof');
select pg_temp.assert_true((select count(*)=0 from public.vf_service_entries),'another student cannot read hours');
reset role;
insert into public.vf_org_staff(org_id,user_id) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select pg_temp.expect_error($q$select public.vf_review_service((select id from public.vf_service_entries limit 1),'approved')$q$,'own service');
reset role;
delete from public.vf_org_staff where user_id='11111111-1111-1111-1111-111111111111';
update public.vf_org_staff set active=false where user_id='33333333-3333-3333-3333-333333333333';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
select pg_temp.assert_true((select count(*)=0 from public.vf_service_entries),'revoked staff cannot read service');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'revoked staff cannot read proof');
reset role;
do $$ declare v_id uuid; begin select id into v_id from public.vf_service_entries limit 1; perform set_config('vf.test_entry',v_id::text,true); end $$;
set local role authenticated;
select pg_temp.expect_error($q$select public.vf_review_service(current_setting('vf.test_entry')::uuid,'approved')$q$,'membership required');
reset role;
update public.vf_org_staff set active=true where user_id='33333333-3333-3333-3333-333333333333';
set local role authenticated;
select public.vf_review_service((select id from public.vf_service_entries where minutes=60),'approved');
select public.vf_review_service((select id from public.vf_service_entries where minutes=30),'changes_requested','Please clarify the pantry activities.');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'active assigned staff can read proof');
select pg_temp.expect_error($q$select public.vf_review_service((select id from public.vf_service_entries where minutes=60),'rejected','Attempt to change an approval')$q$,'Only pending');
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select pg_temp.assert_true((select sum(minutes)=60 from public.vf_verified_record()),'only approved minutes exported');
select public.vf_submit_service((select application_id from public.vf_service_entries where minutes=30),current_date,30,'Sorted produce, packed pantry boxes, and cleaned tables.','11111111-1111-1111-1111-111111111111/00000000-0000-0000-0000-000000000001.jpg',(select id from public.vf_service_entries where minutes=30));
select pg_temp.assert_true((select status='pending' and reviewer_id is null from public.vf_service_entries where minutes=30),'resubmission clears old review');
select pg_temp.expect_error($q$select public.vf_submit_service((select application_id from public.vf_service_entries where minutes=60),current_date,70,'Trying to rewrite an approved service entry.',null,(select id from public.vf_service_entries where minutes=60))$q$,'Only your returned');
select public.vf_start_timer((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'));
select public.vf_start_timer((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000001'));
select pg_temp.assert_true((select count(*)=1 from public.vf_service_timers where stopped_at is null),'timer start idempotent');
select pg_temp.expect_error($q$select public.vf_start_timer((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000002'))$q$,'current timer');
select pg_temp.expect_error($q$select public.vf_stop_timer((select id from public.vf_service_timers limit 1),'Valid completed service notes.')$q$,'at least one minute');
reset role;
update public.vf_service_timers set started_at=now()-interval '2 minutes' where student_id='11111111-1111-1111-1111-111111111111';
set local role authenticated;
select public.vf_stop_timer((select id from public.vf_service_timers limit 1),'Prepared supply bins during this timed session.');
select public.vf_stop_timer((select id from public.vf_service_timers limit 1),'Prepared supply bins during this timed session.');
select pg_temp.assert_true((select count(*)=1 from public.vf_service_entries where source='timer'),'timer retry creates exactly one entry');
select public.vf_start_timer((select id from public.vf_applications where opportunity_id='aaaaaaaa-0000-0000-0000-000000000002'));
select public.vf_cancel_timer((select id from public.vf_service_timers where stopped_at is null));
select pg_temp.assert_true((select count(*)=0 from public.vf_service_timers where stopped_at is null),'timer cancellation recoverable');
select pg_temp.expect_error($q$select public.vf_prepare_account_deletion(auth.uid())$q$,'permission denied');
reset role;
select public.vf_prepare_account_deletion('11111111-1111-1111-1111-111111111111');
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.vf_profiles),'deleting account loses access immediately');
select pg_temp.expect_error('select * from public.vf_verified_record()','active account');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name,owner_id) values('vf-proofs','11111111-1111-1111-1111-111111111111/9999.jpg',auth.uid()::text)$q$,'row-level security');
reset role;
-- Test cascades only. In production remove real objects through Storage API first.
delete from storage.objects where owner_id='11111111-1111-1111-1111-111111111111';
delete from auth.users where id='11111111-1111-1111-1111-111111111111';
select pg_temp.assert_true((select count(*)=0 from public.vf_profiles where id='11111111-1111-1111-1111-111111111111'),'profile deleted');
select pg_temp.assert_true((select count(*)=0 from public.vf_service_entries),'service removed');
select pg_temp.assert_true((select count(*)=0 from public.vf_service_timers),'timers removed');
select pg_temp.assert_true((select count(*)>0 from public.vf_audit where actor_id is null),'non-identifying audit survives deletion');
rollback;
