-- VoluForge native backend. Additive: no legacy tables, grants, or policies are altered.
-- Apply with a database-owner connection. All workflow writes are authenticated RPCs.
begin;

create schema if not exists vf_private;
revoke all on schema vf_private from public;
grant usage on schema vf_private to authenticated, service_role;

create table public.vf_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  school text not null default '' check (length(school) <= 200),
  bio text not null default '' check (length(bio) <= 1000),
  skills text[] not null default '{}' check (cardinality(skills) <= 30),
  causes text[] not null default '{}' check (cardinality(causes) <= 20),
  goal_hours integer not null default 50 check (goal_hours between 1 and 10000),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.vf_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 200),
  description text not null default '' check (length(description) <= 10000),
  website text check (website is null or website ~ '^https://'),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.vf_org_staff (
  org_id uuid not null references public.vf_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'reviewer' check (role in ('owner','reviewer')),
  active boolean not null default true,
  primary key (org_id,user_id)
);
create table public.vf_opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.vf_organizations(id) on delete restrict,
  title text not null check (length(btrim(title)) between 3 and 160),
  description text not null check (length(btrim(description)) between 10 and 12000),
  category text not null default 'Community' check (length(category) between 1 and 80),
  location text not null default '' check (length(location) <= 300),
  remote boolean not null default false,
  image_url text check (image_url is null or image_url ~ '^https://'),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity between 1 and 10000),
  min_age integer not null default 13 check (min_age between 13 and 100),
  skills text[] not null default '{}' check (cardinality(skills) <= 30),
  proof_required boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table public.vf_saved (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.vf_opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,opportunity_id)
);
create table public.vf_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.vf_opportunities(id) on delete restrict,
  message text not null check (length(btrim(message)) between 10 and 3000),
  availability text not null check (length(btrim(availability)) between 2 and 1000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  decision_note text not null default '' check (length(decision_note) <= 2000),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id,opportunity_id),
  unique(id,student_id)
);
create table public.vf_service_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null,
  service_date date not null,
  minutes integer not null check (minutes between 1 and 720),
  notes text not null check (length(btrim(notes)) between 10 and 5000),
  proof_path text,
  source text not null default 'manual' check (source in ('manual','timer')),
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested','rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '' check (length(review_note) <= 2000),
  created_at timestamptz not null default now(),
  foreign key(application_id,student_id) references public.vf_applications(id,student_id) on delete cascade,
  check ((source = 'manual' and started_at is null and ended_at is null) or
         (source = 'timer' and started_at is not null and ended_at > started_at)),
  check (status <> 'approved' or reviewed_at is not null),
  check (reviewer_id is null or reviewer_id <> student_id)
);
create table public.vf_service_timers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null,
  started_at timestamptz not null default now(),
  stopped_at timestamptz,
  entry_id uuid unique references public.vf_service_entries(id) on delete set null,
  foreign key(application_id,student_id) references public.vf_applications(id,student_id) on delete cascade,
  check (stopped_at is null or stopped_at >= started_at)
);
create unique index vf_one_active_timer on public.vf_service_timers(student_id) where stopped_at is null;
create table public.vf_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  org_id uuid references public.vf_organizations(id) on delete set null,
  entity_id uuid,
  action text not null,
  -- Status-only metadata. Never copy names, emails, notes, proof paths, or tokens here.
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index vf_opportunities_discover on public.vf_opportunities(status,starts_at);
create index vf_opportunities_org on public.vf_opportunities(org_id);
create index vf_applications_opportunity_status on public.vf_applications(opportunity_id,status);
create index vf_applications_student on public.vf_applications(student_id,created_at desc);
create index vf_entries_student_status on public.vf_service_entries(student_id,status,service_date);
create index vf_entries_application on public.vf_service_entries(application_id);
create index vf_entries_proof on public.vf_service_entries(proof_path) where proof_path is not null;
create index vf_staff_user on public.vf_org_staff(user_id);

-- A live profile blocks already-issued access tokens while account deletion is in progress.
create function vf_private.active_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vf_profiles p where p.id=auth.uid() and p.deletion_requested_at is null)
$$;
create function vf_private.is_staff(p_org_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select vf_private.active_user() and exists(
    select 1 from public.vf_org_staff s join public.vf_organizations o on o.id=s.org_id
    where s.org_id=p_org_id and s.user_id=auth.uid() and s.active and o.verified)
$$;
create function vf_private.has_application(p_opportunity_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vf_applications where opportunity_id=p_opportunity_id and student_id=auth.uid())
$$;
-- SHARE lock coordinates new proof metadata with account-deletion freezing.
create function vf_private.can_upload_proof() returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.vf_profiles where id=auth.uid() and deletion_requested_at is null for share;
  return found;
end $$;
create function vf_private.require_user() returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not vf_private.active_user() then
    raise exception 'Sign in to an active account to continue' using errcode='42501';
  end if;
  return v_uid;
end $$;
-- Hold membership and organization locks so revocation cannot race a privileged write.
create function vf_private.require_staff(p_org_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform vf_private.require_user();
  perform 1 from public.vf_organizations o where o.id=p_org_id and o.verified for share;
  if not found then raise exception 'Organization is not verified' using errcode='42501'; end if;
  perform 1 from public.vf_org_staff s where s.org_id=p_org_id and s.user_id=auth.uid() and s.active for share;
  if not found then raise exception 'Active organization membership required' using errcode='42501'; end if;
end $$;
create function vf_private.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.vf_profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120));
  return new;
end $$;
create trigger vf_auth_profile after insert on auth.users for each row execute function vf_private.new_profile();
insert into public.vf_profiles(id,full_name)
select id,left(coalesce(raw_user_meta_data->>'full_name',''),120) from auth.users on conflict(id) do nothing;

-- Explicitly enable RLS and remove inherited/default Supabase table privileges.
alter table public.vf_profiles enable row level security;
alter table public.vf_organizations enable row level security;
alter table public.vf_org_staff enable row level security;
alter table public.vf_opportunities enable row level security;
alter table public.vf_saved enable row level security;
alter table public.vf_applications enable row level security;
alter table public.vf_service_entries enable row level security;
alter table public.vf_service_timers enable row level security;
alter table public.vf_audit enable row level security;
revoke all on public.vf_profiles,public.vf_organizations,public.vf_org_staff,public.vf_opportunities,
  public.vf_saved,public.vf_applications,public.vf_service_entries,public.vf_service_timers,public.vf_audit from anon,authenticated;
grant select on public.vf_profiles,public.vf_organizations,public.vf_org_staff,public.vf_opportunities,
  public.vf_saved,public.vf_applications,public.vf_service_entries,public.vf_service_timers,public.vf_audit to authenticated;
grant insert(id,full_name,school,bio,skills,causes,goal_hours),update(full_name,school,bio,skills,causes,goal_hours) on public.vf_profiles to authenticated;
grant insert(user_id,opportunity_id),delete on public.vf_saved to authenticated;
grant all on public.vf_profiles,public.vf_organizations,public.vf_org_staff,public.vf_opportunities,
  public.vf_saved,public.vf_applications,public.vf_service_entries,public.vf_service_timers,public.vf_audit to service_role;
grant usage,select on sequence public.vf_audit_id_seq to service_role;

create policy vf_profile_select on public.vf_profiles for select to authenticated using (
  vf_private.active_user() and (id=auth.uid() or exists(
    select 1 from public.vf_applications a join public.vf_opportunities o on o.id=a.opportunity_id
    where a.student_id=vf_profiles.id and vf_private.is_staff(o.org_id))));
create policy vf_profile_insert on public.vf_profiles for insert to authenticated with check(id=auth.uid() and vf_private.active_user());
create policy vf_profile_update on public.vf_profiles for update to authenticated using(id=auth.uid() and vf_private.active_user()) with check(id=auth.uid());
create policy vf_organizations_select on public.vf_organizations for select to authenticated using(
  vf_private.active_user() and (verified or exists(select 1 from public.vf_org_staff s where s.org_id=id and s.user_id=auth.uid())));
create policy vf_staff_select on public.vf_org_staff for select to authenticated using(user_id=auth.uid() and vf_private.active_user());
create policy vf_opportunities_select on public.vf_opportunities for select to authenticated using(
  vf_private.active_user() and (
    (status in ('published','closed') and exists(select 1 from public.vf_organizations o where o.id=org_id and o.verified))
    or vf_private.is_staff(org_id)
    or vf_private.has_application(id)
  ));
create policy vf_saved_select on public.vf_saved for select to authenticated using(user_id=auth.uid() and vf_private.active_user());
create policy vf_saved_insert on public.vf_saved for insert to authenticated with check(user_id=auth.uid() and vf_private.active_user() and exists(
  select 1 from public.vf_opportunities o where o.id=opportunity_id and o.status='published'));
create policy vf_saved_delete on public.vf_saved for delete to authenticated using(user_id=auth.uid() and vf_private.active_user());
create policy vf_applications_select on public.vf_applications for select to authenticated using(
  vf_private.active_user() and (student_id=auth.uid() or exists(select 1 from public.vf_opportunities o where o.id=opportunity_id and vf_private.is_staff(o.org_id))));
create policy vf_entries_select on public.vf_service_entries for select to authenticated using(
  vf_private.active_user() and (student_id=auth.uid() or exists(
    select 1 from public.vf_applications a join public.vf_opportunities o on o.id=a.opportunity_id
    where a.id=application_id and vf_private.is_staff(o.org_id))));
create policy vf_timers_select on public.vf_service_timers for select to authenticated using(student_id=auth.uid() and vf_private.active_user());
create policy vf_audit_select on public.vf_audit for select to authenticated using(vf_private.active_user() and (actor_id=auth.uid() or vf_private.is_staff(org_id)));

create function public.vf_apply_to_opportunity(p_opportunity_id uuid,p_message text,p_availability text)
returns public.vf_applications language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_opp public.vf_opportunities; v_row public.vf_applications;
begin
  select * into v_opp from public.vf_opportunities where id=p_opportunity_id for update;
  if not found or v_opp.status <> 'published' or v_opp.ends_at <= now() then raise exception 'This opportunity is no longer accepting applications'; end if;
  perform 1 from public.vf_organizations where id=v_opp.org_id and verified for share;
  if not found then raise exception 'Organization is not verified'; end if;
  if vf_private.is_staff(v_opp.org_id) then raise exception 'Organization staff cannot apply to their own opportunity'; end if;
  if (select count(*) from public.vf_applications where opportunity_id=v_opp.id and status='accepted') >= v_opp.capacity then raise exception 'This opportunity is full'; end if;
  select * into v_row from public.vf_applications where student_id=v_uid and opportunity_id=v_opp.id;
  if found then raise exception 'You have already applied to this opportunity'; end if;
  insert into public.vf_applications(student_id,opportunity_id,message,availability)
    values(v_uid,v_opp.id,btrim(p_message),btrim(p_availability)) returning * into v_row;
  insert into public.vf_audit(actor_id,org_id,entity_id,action) values(v_uid,v_opp.org_id,v_row.id,'application.created');
  return v_row;
end $$;

create function public.vf_decide_application(p_application_id uuid,p_decision text,p_note text default '')
returns public.vf_applications language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_applications; v_opp public.vf_opportunities; v_opp_id uuid;
begin
  if p_decision is null or p_decision not in ('accepted','declined') then raise exception 'Invalid application decision'; end if;
  select opportunity_id into v_opp_id from public.vf_applications where id=p_application_id;
  select * into v_opp from public.vf_opportunities where id=v_opp_id for update;
  if not found then raise exception 'Application not found'; end if;
  perform vf_private.require_staff(v_opp.org_id);
  select * into v_row from public.vf_applications where id=p_application_id for update;
  if v_row.student_id=v_uid then raise exception 'You cannot decide your own application' using errcode='42501'; end if;
  if v_row.status <> 'pending' then raise exception 'Only pending applications can be decided'; end if;
  if p_decision='accepted' then
    if v_opp.status <> 'published' or v_opp.ends_at <= now() then raise exception 'Opportunity is not open'; end if;
    if (select count(*) from public.vf_applications where opportunity_id=v_opp.id and status='accepted') >= v_opp.capacity then raise exception 'This opportunity is full'; end if;
  end if;
  update public.vf_applications set status=p_decision,decision_note=btrim(coalesce(p_note,'')),decided_by=v_uid,decided_at=now()
    where id=p_application_id returning * into v_row;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata)
    values(v_uid,v_opp.org_id,v_row.id,'application.decided',jsonb_build_object('status',p_decision));
  return v_row;
end $$;

create function public.vf_withdraw_application(p_application_id uuid)
returns public.vf_applications language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_applications; v_opp_id uuid; v_org uuid;
begin
  select opportunity_id into v_opp_id from public.vf_applications where id=p_application_id and student_id=v_uid;
  select org_id into v_org from public.vf_opportunities where id=v_opp_id for update;
  select * into v_row from public.vf_applications where id=p_application_id and student_id=v_uid for update;
  if not found then raise exception 'Application not found'; end if;
  if v_row.status='withdrawn' then return v_row; end if;
  if v_row.status not in ('pending','accepted') then raise exception 'This application cannot be withdrawn'; end if;
  if exists(select 1 from public.vf_service_entries where application_id=p_application_id) or
     exists(select 1 from public.vf_service_timers where application_id=p_application_id and stopped_at is null)
     then raise exception 'An application with service records or a running timer cannot be withdrawn'; end if;
  update public.vf_applications set status='withdrawn' where id=p_application_id returning * into v_row;
  insert into public.vf_audit(actor_id,org_id,entity_id,action) values(v_uid,v_org,v_row.id,'application.withdrawn');
  return v_row;
end $$;

-- A shared validator prevents inventing proof links or exceeding one day's time budget.
create function vf_private.validate_service(p_application_id uuid,p_service_date date,p_minutes integer,p_notes text,p_proof_path text,p_exclude uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_app public.vf_applications; v_opp public.vf_opportunities;
begin
  -- Serializes submissions for this student, making the daily cap race-safe.
  perform 1 from public.vf_profiles where id=v_uid for update;
  select * into v_app from public.vf_applications where id=p_application_id and student_id=v_uid for share;
  if not found or v_app.status <> 'accepted' then raise exception 'An accepted application is required to log service'; end if;
  select * into v_opp from public.vf_opportunities where id=v_app.opportunity_id;
  if p_service_date is null or p_service_date > (now() at time zone 'UTC')::date or p_service_date < (v_opp.starts_at at time zone 'UTC')::date then raise exception 'Choose a service date between the opportunity start date and today (UTC)'; end if;
  if p_minutes is null or p_minutes not between 1 and 720 then raise exception 'Log between 1 and 720 minutes per entry'; end if;
  if p_notes is null or length(btrim(p_notes)) not between 10 and 5000 then raise exception 'Add a description of your work (10 to 5,000 characters)'; end if;
  if coalesce((select sum(minutes) from public.vf_service_entries where student_id=v_uid and service_date=p_service_date and status <> 'rejected' and (p_exclude is null or id<>p_exclude)),0)+p_minutes > 1440 then raise exception 'Service entries cannot exceed 24 hours for one date'; end if;
  if v_opp.proof_required and p_proof_path is null then raise exception 'This opportunity requires a proof attachment'; end if;
  if p_proof_path is not null then
    if split_part(p_proof_path,'/',1) <> v_uid::text or not exists(select 1 from storage.objects where bucket_id='vf-proofs' and name=p_proof_path and owner_id=v_uid::text) then
      raise exception 'Upload your proof to your own private folder before submitting' using errcode='42501';
    end if;
  end if;
  return v_opp.org_id;
end $$;

create function public.vf_submit_service(p_application_id uuid,p_service_date date,p_minutes integer,p_notes text,p_proof_path text default null,p_entry_id uuid default null)
returns public.vf_service_entries language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_service_entries; v_org uuid;
begin
  -- Keep lock order profile -> application -> entry, also used by timers/review.
  perform 1 from public.vf_profiles where id=v_uid for update;
  if p_entry_id is not null then
    select * into v_row from public.vf_service_entries where id=p_entry_id and student_id=v_uid for update;
    if not found or v_row.status<>'changes_requested' or v_row.application_id<>p_application_id then raise exception 'Only your returned entries can be resubmitted'; end if;
    if v_row.source='timer' and (v_row.minutes<>p_minutes or v_row.service_date<>p_service_date) then raise exception 'Recorded timer duration and date cannot be changed'; end if;
  end if;
  v_org := vf_private.validate_service(p_application_id,p_service_date,p_minutes,p_notes,p_proof_path,p_entry_id);
  if p_entry_id is null then
    insert into public.vf_service_entries(student_id,application_id,service_date,minutes,notes,proof_path)
      values(v_uid,p_application_id,p_service_date,p_minutes,btrim(p_notes),p_proof_path) returning * into v_row;
  else
    update public.vf_service_entries set service_date=p_service_date,minutes=p_minutes,notes=btrim(p_notes),proof_path=p_proof_path,
      status='pending',reviewer_id=null,reviewed_at=null,review_note='' where id=p_entry_id returning * into v_row;
  end if;
  insert into public.vf_audit(actor_id,org_id,entity_id,action) values(v_uid,v_org,v_row.id,case when p_entry_id is null then 'service.submitted' else 'service.resubmitted' end);
  return v_row;
end $$;

create function public.vf_review_service(p_entry_id uuid,p_decision text,p_note text default '')
returns public.vf_service_entries language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_service_entries; v_org uuid;
begin
  if p_decision is null or p_decision not in ('approved','changes_requested','rejected') then raise exception 'Invalid service decision'; end if;
  if p_decision<>'approved' and length(btrim(coalesce(p_note,'')))<3 then raise exception 'Explain the change request or rejection'; end if;
  select o.org_id into v_org from public.vf_service_entries e join public.vf_applications a on a.id=e.application_id join public.vf_opportunities o on o.id=a.opportunity_id where e.id=p_entry_id;
  if not found then raise exception 'Service entry not found'; end if;
  perform vf_private.require_staff(v_org);
  select * into v_row from public.vf_service_entries where id=p_entry_id for update;
  if v_row.student_id=v_uid then raise exception 'You cannot review your own service' using errcode='42501'; end if;
  if v_row.status <> 'pending' then raise exception 'Only pending service can be reviewed'; end if;
  update public.vf_service_entries set status=p_decision,reviewer_id=v_uid,reviewed_at=now(),review_note=btrim(coalesce(p_note,''))
    where id=p_entry_id returning * into v_row;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata) values(v_uid,v_org,v_row.id,'service.reviewed',jsonb_build_object('status',p_decision));
  return v_row;
end $$;

create function public.vf_start_timer(p_application_id uuid)
returns public.vf_service_timers language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_service_timers; v_starts timestamptz;
begin
  perform 1 from public.vf_profiles where id=v_uid for update;
  select * into v_row from public.vf_service_timers where student_id=v_uid and stopped_at is null;
  if found then
    if v_row.application_id=p_application_id then return v_row; end if;
    raise exception 'Finish or cancel your current timer first';
  end if;
  select o.starts_at into v_starts from public.vf_applications a join public.vf_opportunities o on o.id=a.opportunity_id where a.id=p_application_id and a.student_id=v_uid and a.status='accepted' for share of a;
  if not found then raise exception 'An accepted application is required to start a timer'; end if;
  if v_starts>now() then raise exception 'This opportunity has not started yet'; end if;
  insert into public.vf_service_timers(student_id,application_id) values(v_uid,p_application_id) returning * into v_row;
  return v_row;
end $$;

create function public.vf_stop_timer(p_timer_id uuid,p_notes text,p_proof_path text default null)
returns public.vf_service_entries language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_timer public.vf_service_timers; v_row public.vf_service_entries;
  v_minutes integer; v_org uuid; v_stopped timestamptz := clock_timestamp();
begin
  perform 1 from public.vf_profiles where id=v_uid for update;
  select * into v_timer from public.vf_service_timers where id=p_timer_id and student_id=v_uid for update;
  if not found then raise exception 'Timer not found'; end if;
  if v_timer.entry_id is not null then select * into v_row from public.vf_service_entries where id=v_timer.entry_id; return v_row; end if;
  if v_timer.stopped_at is not null then raise exception 'This timer was cancelled'; end if;
  v_minutes:=floor(extract(epoch from (v_stopped-v_timer.started_at))/60)::integer;
  if v_minutes<1 then raise exception 'Record at least one minute before submitting'; end if;
  if v_minutes>720 then raise exception 'This timer exceeds 12 hours. Cancel it, then enter the actual service time manually'; end if;
  v_org:=vf_private.validate_service(v_timer.application_id,(v_timer.started_at at time zone 'UTC')::date,v_minutes,p_notes,p_proof_path);
  if exists(select 1 from public.vf_service_entries where student_id=v_uid and source='timer' and status<>'rejected' and started_at<v_stopped and ended_at>v_timer.started_at) then raise exception 'This timer overlaps an existing service entry'; end if;
  insert into public.vf_service_entries(student_id,application_id,service_date,minutes,notes,proof_path,source,started_at,ended_at)
    values(v_uid,v_timer.application_id,(v_timer.started_at at time zone 'UTC')::date,v_minutes,btrim(p_notes),p_proof_path,'timer',v_timer.started_at,v_stopped) returning * into v_row;
  update public.vf_service_timers set stopped_at=v_stopped,entry_id=v_row.id where id=p_timer_id;
  insert into public.vf_audit(actor_id,org_id,entity_id,action) values(v_uid,v_org,v_row.id,'service.timer_submitted');
  return v_row;
end $$;
create function public.vf_cancel_timer(p_timer_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user();
begin
  perform 1 from public.vf_profiles where id=v_uid for update;
  update public.vf_service_timers set stopped_at=clock_timestamp() where id=p_timer_id and student_id=v_uid and stopped_at is null;
end $$;

-- Only approved entries are returned. Native exports must use this RPC, not client totals.
create function public.vf_verified_record(p_from date default null,p_to date default null)
returns table(entry_id uuid,service_date date,minutes integer,notes text,opportunity_title text,organization_name text,reviewed_at timestamptz,reviewer_id uuid)
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=vf_private.require_user();
begin
  if p_from is not null and p_to is not null and p_from>p_to then raise exception 'Invalid date range'; end if;
  return query select e.id,e.service_date,e.minutes,e.notes,o.title,g.name,e.reviewed_at,e.reviewer_id
    from public.vf_service_entries e join public.vf_applications a on a.id=e.application_id
    join public.vf_opportunities o on o.id=a.opportunity_id join public.vf_organizations g on g.id=o.org_id
    where e.student_id=v_uid and e.status='approved' and (p_from is null or e.service_date>=p_from) and (p_to is null or e.service_date<=p_to)
    order by e.service_date desc,e.created_at desc;
end $$;

create function public.vf_available_spots()
returns table(opportunity_id uuid,spots_left integer) language plpgsql security definer set search_path = '' as $$
begin
  perform vf_private.require_user();
  return query select o.id,greatest(0,o.capacity-(select count(*)::integer from public.vf_applications a where a.opportunity_id=o.id and a.status='accepted'))
  from public.vf_opportunities o join public.vf_organizations g on g.id=o.org_id where o.status='published' and g.verified;
end $$;

-- Publishing is an RPC so organization identity and occupied capacity stay immutable.
create function public.vf_upsert_opportunity(p_data jsonb,p_id uuid default null)
returns public.vf_opportunities language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_row public.vf_opportunities; v_org uuid; v_capacity integer;
begin
  if p_id is not null then
    select * into v_row from public.vf_opportunities where id=p_id for update;
    if not found then raise exception 'Opportunity not found'; end if;
    v_org:=v_row.org_id;
    if p_data ? 'org_id' and (p_data->>'org_id')::uuid<>v_org then raise exception 'Organization cannot be changed'; end if;
  else v_org:=(p_data->>'org_id')::uuid;
  end if;
  perform vf_private.require_staff(v_org);
  v_capacity:=(p_data->>'capacity')::integer;
  if p_id is not null and v_capacity<(select count(*) from public.vf_applications where opportunity_id=p_id and status='accepted') then raise exception 'Capacity cannot be lower than accepted volunteers'; end if;
  if p_id is null then
    insert into public.vf_opportunities(org_id,title,description,category,location,remote,image_url,starts_at,ends_at,capacity,min_age,skills,proof_required,status)
    values(v_org,p_data->>'title',p_data->>'description',coalesce(p_data->>'category','Community'),coalesce(p_data->>'location',''),coalesce((p_data->>'remote')::boolean,false),p_data->>'image_url',
      (p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,v_capacity,coalesce((p_data->>'min_age')::integer,13),
      array(select jsonb_array_elements_text(coalesce(p_data->'skills','[]'))),coalesce((p_data->>'proof_required')::boolean,false),coalesce(p_data->>'status','draft')) returning * into v_row;
  else
    update public.vf_opportunities set title=p_data->>'title',description=p_data->>'description',category=coalesce(p_data->>'category','Community'),location=coalesce(p_data->>'location',''),
      remote=coalesce((p_data->>'remote')::boolean,false),image_url=p_data->>'image_url',starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz,
      capacity=v_capacity,min_age=coalesce((p_data->>'min_age')::integer,13),skills=array(select jsonb_array_elements_text(coalesce(p_data->'skills','[]'))),
      proof_required=coalesce((p_data->>'proof_required')::boolean,false),status=coalesce(p_data->>'status','draft') where id=p_id returning * into v_row;
  end if;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata) values(v_uid,v_org,v_row.id,'opportunity.saved',jsonb_build_object('status',v_row.status));
  return v_row;
end $$;

-- Freeze account before deleting storage; only the Edge Function's service client can call.
create function public.vf_prepare_account_deletion(p_user_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.vf_profiles set deletion_requested_at=coalesce(deletion_requested_at,now()) where id=p_user_id;
  if not found then raise exception 'Account not found'; end if;
  insert into public.vf_audit(actor_id,action) values(p_user_id,'account.deletion_requested');
end $$;

-- Helpers and workflows are never executable anonymously. Explicit grants avoid global privilege changes.
revoke execute on all functions in schema vf_private from public,anon,authenticated;
grant execute on function vf_private.active_user(),vf_private.is_staff(uuid),vf_private.has_application(uuid),vf_private.can_upload_proof() to authenticated;
revoke execute on function public.vf_apply_to_opportunity(uuid,text,text),public.vf_decide_application(uuid,text,text),
 public.vf_withdraw_application(uuid),public.vf_submit_service(uuid,date,integer,text,text,uuid),public.vf_review_service(uuid,text,text),
 public.vf_start_timer(uuid),public.vf_stop_timer(uuid,text,text),public.vf_cancel_timer(uuid),public.vf_verified_record(date,date),
 public.vf_upsert_opportunity(jsonb,uuid),public.vf_available_spots(),public.vf_prepare_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.vf_apply_to_opportunity(uuid,text,text),public.vf_decide_application(uuid,text,text),
 public.vf_withdraw_application(uuid),public.vf_submit_service(uuid,date,integer,text,text,uuid),public.vf_review_service(uuid,text,text),
 public.vf_start_timer(uuid),public.vf_stop_timer(uuid,text,text),public.vf_cancel_timer(uuid),public.vf_verified_record(date,date),
 public.vf_upsert_opportunity(jsonb,uuid),public.vf_available_spots() to authenticated;
grant execute on function public.vf_prepare_account_deletion(uuid) to service_role;

-- The bucket is private, single-folder paths only, 10 MB max, no arbitrary executable types.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('vf-proofs','vf-proofs',false,10485760,array['image/jpeg','image/png','image/heic','image/webp','application/pdf']);
create policy vf_proof_upload on storage.objects for insert to authenticated with check(
  bucket_id='vf-proofs' and vf_private.can_upload_proof() and owner_id=auth.uid()::text
  and name ~ ('^'||auth.uid()::text||'/[0-9a-fA-F-]+\.(jpg|jpeg|png|heic|webp|pdf)$'));
create policy vf_proof_read on storage.objects for select to authenticated using(
  bucket_id='vf-proofs' and vf_private.active_user() and (owner_id=auth.uid()::text or exists(
    select 1 from public.vf_service_entries e join public.vf_applications a on a.id=e.application_id
    join public.vf_opportunities o on o.id=a.opportunity_id where e.proof_path=name and vf_private.is_staff(o.org_id))));
create policy vf_proof_delete_unsubmitted on storage.objects for delete to authenticated using(
  bucket_id='vf-proofs' and vf_private.active_user() and owner_id=auth.uid()::text
  and not exists(select 1 from public.vf_service_entries e where e.proof_path=name));
-- Restrictive fences keep unrelated broad legacy storage policies from exposing this bucket.
create policy vf_proof_anon_fence on storage.objects as restrictive for all to anon
  using(bucket_id<>'vf-proofs') with check(bucket_id<>'vf-proofs');
create policy vf_proof_insert_fence on storage.objects as restrictive for insert to authenticated with check(
  bucket_id<>'vf-proofs' or (vf_private.can_upload_proof() and owner_id=auth.uid()::text
    and name ~ ('^'||auth.uid()::text||'/[0-9a-fA-F-]+\.(jpg|jpeg|png|heic|webp|pdf)$')));
create policy vf_proof_select_fence on storage.objects as restrictive for select to authenticated using(
  bucket_id<>'vf-proofs' or (vf_private.active_user() and (owner_id=auth.uid()::text or exists(
    select 1 from public.vf_service_entries e join public.vf_applications a on a.id=e.application_id
    join public.vf_opportunities o on o.id=a.opportunity_id where e.proof_path=name and vf_private.is_staff(o.org_id)))));
create policy vf_proof_delete_fence on storage.objects as restrictive for delete to authenticated using(
  bucket_id<>'vf-proofs' or (vf_private.active_user() and owner_id=auth.uid()::text
    and not exists(select 1 from public.vf_service_entries e where e.proof_path=name)));
create policy vf_proof_update_fence on storage.objects as restrictive for update to authenticated
  using(bucket_id<>'vf-proofs') with check(bucket_id<>'vf-proofs');
-- No UPDATE access to proof objects: submitted files cannot be replaced under the same name.
commit;
