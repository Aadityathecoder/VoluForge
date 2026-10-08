-- Read-only SQL Editor examples for the hosted VoluForge database.
-- The SQL Editor normally runs as postgres; these queries do not prove RLS.
-- Run individually to show each result. No private names/emails are selected.

-- 1. Nine mobile tables, each with row-level security enabled.
select c.relname as table_name,c.relrowsecurity as row_security_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and starts_with(c.relname,'vf_')
order by c.relname;

-- 2. Discovery/detail data, with capacity derived from accepted applications.
select o.title,g.name as organization,o.category,o.remote,o.address,o.requirements,
       o.capacity-count(a.id) filter(where a.status='accepted') as places_available
from public.vf_opportunities o
join public.vf_organizations g on g.id=o.org_id
left join public.vf_applications a on a.opportunity_id=o.id
where o.status='published' and g.verified
group by o.id,g.id order by o.starts_at;

-- 3. Application and review state totals (no personal data).
select status,count(*) from public.vf_applications group by status;
select status,count(*),sum(minutes)/60.0 as hours
from public.vf_service_entries group by status;

-- 4. Proof files are stored in a private bucket.
select id,public,file_size_limit from storage.buckets where id='vf-proofs';

-- For RLS/workflow execution use the isolated pnpm demo and pnpm test runners
-- under database/tests. Never run their synthetic Auth fixtures in production.
