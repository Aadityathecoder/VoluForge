-- Run one section at a time in Supabase SQL Editor. Synthetic fixtures only.
-- The screenshots record executed results; this file is a reproducible query source.

-- 1. BEFORE signup: must be zero.
select count(*) as test_accounts from auth.users
where email in ('vf-week3-20261011-volunteer@example.com','vf-week3-20261011-nonprofit@example.com');

-- 2. AFTER signup / BEFORE login: two profiles, nonprofit owner, verified=false, zero sessions.
select u.raw_user_meta_data->>'account_type' as account_type,p.full_name,
 (s.org_id is not null) as owner_membership,o.verified,
 (select count(*) from auth.sessions x where x.user_id=u.id) as sessions
from auth.users u join public.vf_profiles p on p.id=u.id
left join public.vf_org_staff s on s.user_id=u.id
left join public.vf_organizations o on o.id=s.org_id
where u.email in ('vf-week3-20261011-volunteer@example.com','vf-week3-20261011-nonprofit@example.com')
order by account_type;

-- 3. Classroom fixtures only: confirm these fictional email accounts for live login.
-- Does not change email-confirmation settings or any real account.
update auth.users set email_confirmed_at=now()
where email in ('vf-week3-20261011-volunteer@example.com','vf-week3-20261011-nonprofit@example.com')
 and raw_user_meta_data->>'full_name' in ('Week 3 Demo volunteer','Week 3 Demo nonprofit');

-- 4. AFTER login, BEFORE publication: one session each and zero test opportunities.
select u.raw_user_meta_data->>'account_type' as account_type,
 (select count(*) from auth.sessions x where x.user_id=u.id) as sessions,
 (select count(*) from vf_opportunities p join vf_org_staff s on s.org_id=p.org_id where s.user_id=u.id) as opportunities
from auth.users u
where u.email in ('vf-week3-20261011-volunteer@example.com','vf-week3-20261011-nonprofit@example.com')
order by account_type;

-- 5. Operator approves ONLY the synthetic classroom organization.
update public.vf_organizations o set verified=true
where o.name='Week 3 API Demo Nonprofit' and exists(
 select 1 from vf_org_staff s join auth.users u on u.id=s.user_id
 where s.org_id=o.id and u.email='vf-week3-20261011-nonprofit@example.com');

-- 6. AFTER publication / BEFORE apply: published opportunity, one audit, zero applications.
select p.title,p.status,p.capacity,o.verified,
 (select count(*) from vf_audit a where a.entity_id=p.id and a.action='opportunity.saved') as publish_audits,
 (select count(*) from vf_applications a where a.opportunity_id=p.id) as applications
from vf_opportunities p join vf_organizations o on o.id=p.org_id
where o.name='Week 3 API Demo Nonprofit';

-- 7. AFTER apply: exactly one pending application; duplicate attempts add no rows.
select p.title,a.status,a.message,a.availability,
 (a.student_id=u.id) as correct_student,
 (select count(*) from vf_applications x where x.opportunity_id=p.id) as applications
from vf_applications a join vf_opportunities p on p.id=a.opportunity_id
join auth.users u on u.id=a.student_id
where u.email='vf-week3-20261011-volunteer@example.com' and p.title='Week 3 API Demo: community supply kits';

-- 8. AFTER logout: session and active refresh-token counts both zero.
select u.raw_user_meta_data->>'account_type' as account_type,
 (select count(*) from auth.sessions s where s.user_id=u.id) as sessions,
 (select count(*) from auth.refresh_tokens t where t.user_id=u.id::text and not t.revoked) as active_refresh_tokens
from auth.users u
where u.email in ('vf-week3-20261011-volunteer@example.com','vf-week3-20261011-nonprofit@example.com')
order by account_type;

-- 9. Close the synthetic listing after tests so it does not recruit real volunteers.
update vf_opportunities p set status='closed'
from vf_organizations o where o.id=p.org_id and o.name='Week 3 API Demo Nonprofit'
 and p.title='Week 3 API Demo: community supply kits';

-- Remove synthetic organization verification after closing the listing.
update vf_organizations o set verified=false where o.name='Week 3 API Demo Nonprofit'
and exists(select 1 from vf_org_staff s join auth.users u on u.id=s.user_id
where s.org_id=o.id and u.email='vf-week3-20261011-nonprofit@example.com');
