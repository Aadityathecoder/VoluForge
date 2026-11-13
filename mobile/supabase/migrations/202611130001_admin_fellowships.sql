-- Administrator accounts and fellowships for the shared website + Expo app.
-- Additive: no existing vf_* table, policy, or function is changed except the
-- profile columns below. All fellowship writes go through security-definer RPCs.
begin;

-- Account type. NULL means the person signed in with Google (or predates this
-- migration) and still needs to choose. Existing people are students.
alter table public.vf_profiles
  add column account_type text check (account_type in ('student','admin')),
  add column admin_organization text not null default '' check (length(admin_organization) <= 200),
  -- Operator-controlled. Only verified administrators appear in the public
  -- fellowship directory; unverified ones can still share private join codes.
  add column admin_verified boolean not null default false;
update public.vf_profiles set account_type='student' where account_type is null;

-- Signup metadata may choose student/admin; it never grants verification.
create or replace function vf_private.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_type text := new.raw_user_meta_data->>'account_type';
begin
  insert into public.vf_profiles(id,full_name,account_type,admin_organization)
  values(
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),120),
    case when v_type in ('student','admin') then v_type else null end,
    case when v_type='admin' then left(btrim(coalesce(new.raw_user_meta_data->>'organization_name','')),200) else '' end
  ) on conflict(id) do nothing;
  return new;
end $$;

create table public.vf_fellowships (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 3 and 160),
  summary text not null default '' check (length(summary) <= 280),
  description text not null default '' check (length(description) <= 8000),
  focus text not null default 'Community' check (length(focus) between 1 and 80),
  location text not null default '' check (length(location) <= 200),
  remote boolean not null default false,
  starts_on date not null,
  ends_on date not null,
  apply_by date,
  capacity integer not null default 20 check (capacity between 1 and 5000),
  weekly_hours integer not null default 3 check (weekly_hours between 1 and 60),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (apply_by is null or apply_by <= ends_on)
);
create table public.vf_fellowship_enrollments (
  fellowship_id uuid not null references public.vf_fellowships(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  message text not null default '' check (length(message) <= 2000),
  admin_note text not null default '' check (length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (fellowship_id,student_id)
);
create index vf_fellowships_admin on public.vf_fellowships(admin_id,created_at desc);
create index vf_fellowships_open on public.vf_fellowships(status,starts_on);
create index vf_enrollments_student on public.vf_fellowship_enrollments(student_id,created_at desc);

alter table public.vf_fellowships enable row level security;
alter table public.vf_fellowship_enrollments enable row level security;
revoke all on public.vf_fellowships,public.vf_fellowship_enrollments from anon,authenticated;
grant all on public.vf_fellowships,public.vf_fellowship_enrollments to service_role;
-- No direct table grants: clients read and write only through the RPCs below.

create function vf_private.require_admin() returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user();
begin
  if not exists(select 1 from public.vf_profiles where id=v_uid and account_type='admin') then
    raise exception 'Administrator account required' using errcode='42501';
  end if;
  return v_uid;
end $$;

-- One-time choice for people who signed in with Google. Cannot be changed later.
create function public.vf_choose_account_type(p_type text,p_organization text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user();
begin
  if p_type not in ('student','admin') then raise exception 'Choose student or administrator'; end if;
  if p_type='admin' and length(btrim(coalesce(p_organization,''))) not between 2 and 200 then
    raise exception 'Add the school or organization you run fellowships for';
  end if;
  update public.vf_profiles
     set account_type=p_type, admin_organization=case when p_type='admin' then btrim(p_organization) else '' end
   where id=v_uid and account_type is null;
  if not found then raise exception 'Your account type is already set'; end if;
  return p_type;
end $$;

create function public.vf_me()
returns table(id uuid,full_name text,school text,account_type text,admin_organization text,admin_verified boolean)
language sql stable security definer set search_path = '' as $$
  select p.id,p.full_name,p.school,p.account_type,p.admin_organization,p.admin_verified
  from public.vf_profiles p where p.id=auth.uid() and p.deletion_requested_at is null
$$;

-- Shared row shape for students. Join codes are never returned to students.
create function public.vf_fellowship_directory(p_code text default null)
returns table(
  id uuid,title text,summary text,description text,focus text,location text,remote boolean,
  starts_on date,ends_on date,apply_by date,capacity integer,weekly_hours integer,status text,
  host text,host_verified boolean,seats_left integer,my_status text
) language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user();
begin
  return query
  select f.id,f.title,f.summary,f.description,f.focus,f.location,f.remote,f.starts_on,f.ends_on,f.apply_by,
    f.capacity,f.weekly_hours,f.status,
    coalesce(nullif(p.admin_organization,''),nullif(p.full_name,''),'Fellowship host'),p.admin_verified,
    greatest(f.capacity-(select count(*)::int from public.vf_fellowship_enrollments e where e.fellowship_id=f.id and e.status='accepted'),0),
    (select e.status from public.vf_fellowship_enrollments e where e.fellowship_id=f.id and e.student_id=v_uid)
  from public.vf_fellowships f join public.vf_profiles p on p.id=f.admin_id
  where p.deletion_requested_at is null and (
    (f.status='open' and p.admin_verified)
    or (f.status='open' and p_code is not null and f.join_code=upper(btrim(p_code)))
    or exists(select 1 from public.vf_fellowship_enrollments e where e.fellowship_id=f.id and e.student_id=v_uid)
  )
  order by (f.status='open') desc,f.starts_on;
end $$;

create function public.vf_apply_to_fellowship(p_fellowship_id uuid,p_message text default '',p_code text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_f public.vf_fellowships; v_verified boolean; v_type text; v_existing text;
begin
  select account_type into v_type from public.vf_profiles where id=v_uid;
  if v_type is distinct from 'student' then raise exception 'Only student accounts can apply to fellowships'; end if;
  select * into v_f from public.vf_fellowships where id=p_fellowship_id for update;
  if not found or v_f.status<>'open' then raise exception 'This fellowship is not accepting applications'; end if;
  if v_f.apply_by is not null and v_f.apply_by < current_date then raise exception 'Applications for this fellowship have closed'; end if;
  select admin_verified into v_verified from public.vf_profiles where id=v_f.admin_id;
  if not coalesce(v_verified,false) and (p_code is null or upper(btrim(p_code))<>v_f.join_code) then
    raise exception 'Enter the join code from your fellowship administrator';
  end if;
  select status into v_existing from public.vf_fellowship_enrollments where fellowship_id=v_f.id and student_id=v_uid;
  if v_existing in ('pending','accepted') then raise exception 'You have already applied to this fellowship'; end if;
  if v_existing='declined' then raise exception 'This fellowship has already reviewed your application'; end if;
  insert into public.vf_fellowship_enrollments(fellowship_id,student_id,message)
    values(v_f.id,v_uid,left(btrim(coalesce(p_message,'')),2000))
    on conflict(fellowship_id,student_id) do update set status='pending',message=excluded.message,admin_note='',created_at=now(),decided_at=null;
  return 'pending';
end $$;

create function public.vf_withdraw_from_fellowship(p_fellowship_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user();
begin
  update public.vf_fellowship_enrollments set status='withdrawn',decided_at=now()
   where fellowship_id=p_fellowship_id and student_id=v_uid and status in ('pending','accepted');
  if not found then raise exception 'There is no active application to withdraw'; end if;
  return 'withdrawn';
end $$;

-- Administrator views and writes. Every function checks ownership.
create function public.vf_admin_fellowships()
returns table(
  id uuid,title text,summary text,description text,focus text,location text,remote boolean,
  starts_on date,ends_on date,apply_by date,capacity integer,weekly_hours integer,status text,join_code text,
  pending integer,accepted integer,created_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin();
begin
  return query
  select f.id,f.title,f.summary,f.description,f.focus,f.location,f.remote,f.starts_on,f.ends_on,f.apply_by,
    f.capacity,f.weekly_hours,f.status,f.join_code,
    (select count(*)::int from public.vf_fellowship_enrollments e where e.fellowship_id=f.id and e.status='pending'),
    (select count(*)::int from public.vf_fellowship_enrollments e where e.fellowship_id=f.id and e.status='accepted'),
    f.created_at
  from public.vf_fellowships f where f.admin_id=v_uid order by f.created_at desc;
end $$;

create function public.vf_admin_save_fellowship(
  p_id uuid,p_title text,p_summary text,p_description text,p_focus text,p_location text,p_remote boolean,
  p_starts_on date,p_ends_on date,p_apply_by date,p_capacity integer,p_weekly_hours integer,p_status text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin(); v_id uuid;
begin
  if p_status not in ('draft','open','closed') then raise exception 'Choose draft, open, or closed'; end if;
  if p_id is null then
    insert into public.vf_fellowships(admin_id,title,summary,description,focus,location,remote,starts_on,ends_on,apply_by,capacity,weekly_hours,status)
    values(v_uid,btrim(p_title),btrim(coalesce(p_summary,'')),btrim(coalesce(p_description,'')),coalesce(nullif(btrim(p_focus),''),'Community'),
      btrim(coalesce(p_location,'')),coalesce(p_remote,false),p_starts_on,p_ends_on,p_apply_by,p_capacity,p_weekly_hours,p_status)
    returning id into v_id;
  else
    update public.vf_fellowships set title=btrim(p_title),summary=btrim(coalesce(p_summary,'')),description=btrim(coalesce(p_description,'')),
      focus=coalesce(nullif(btrim(p_focus),''),'Community'),location=btrim(coalesce(p_location,'')),remote=coalesce(p_remote,false),
      starts_on=p_starts_on,ends_on=p_ends_on,apply_by=p_apply_by,capacity=p_capacity,weekly_hours=p_weekly_hours,status=p_status,updated_at=now()
    where id=p_id and admin_id=v_uid returning id into v_id;
    if v_id is null then raise exception 'Fellowship not found' using errcode='42501'; end if;
  end if;
  return v_id;
end $$;

create function public.vf_admin_delete_fellowship(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin();
begin
  if exists(select 1 from public.vf_fellowship_enrollments where fellowship_id=p_id and status='accepted') then
    raise exception 'Close this fellowship instead: it already has accepted fellows';
  end if;
  delete from public.vf_fellowships where id=p_id and admin_id=v_uid;
  if not found then raise exception 'Fellowship not found' using errcode='42501'; end if;
end $$;

create function public.vf_admin_new_join_code(p_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin(); v_code text;
begin
  update public.vf_fellowships set join_code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),updated_at=now()
   where id=p_id and admin_id=v_uid returning join_code into v_code;
  if v_code is null then raise exception 'Fellowship not found' using errcode='42501'; end if;
  return v_code;
end $$;

-- Roster shows only what a fellowship host needs; no email addresses.
create function public.vf_admin_roster(p_id uuid)
returns table(student_id uuid,full_name text,school text,skills text[],causes text[],message text,status text,admin_note text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin();
begin
  if not exists(select 1 from public.vf_fellowships where id=p_id and admin_id=v_uid) then
    raise exception 'Fellowship not found' using errcode='42501';
  end if;
  return query
  select e.student_id,coalesce(nullif(p.full_name,''),'Student'),p.school,p.skills,p.causes,e.message,e.status,e.admin_note,e.created_at
  from public.vf_fellowship_enrollments e join public.vf_profiles p on p.id=e.student_id
  where e.fellowship_id=p_id and p.deletion_requested_at is null
  order by case e.status when 'pending' then 0 when 'accepted' then 1 else 2 end,e.created_at;
end $$;

create function public.vf_admin_decide_enrollment(p_id uuid,p_student uuid,p_decision text,p_note text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_admin(); v_f public.vf_fellowships;
begin
  if p_decision not in ('accepted','declined') then raise exception 'Choose accept or decline'; end if;
  select * into v_f from public.vf_fellowships where id=p_id and admin_id=v_uid for update;
  if not found then raise exception 'Fellowship not found' using errcode='42501'; end if;
  if p_decision='accepted' and (select count(*) from public.vf_fellowship_enrollments where fellowship_id=p_id and status='accepted')>=v_f.capacity then
    raise exception 'This fellowship is full. Raise its capacity first.';
  end if;
  update public.vf_fellowship_enrollments set status=p_decision,admin_note=left(btrim(coalesce(p_note,'')),2000),decided_at=now()
   where fellowship_id=p_id and student_id=p_student and status in ('pending','accepted','declined');
  if not found then raise exception 'That application is no longer active'; end if;
  return p_decision;
end $$;

revoke all on function vf_private.require_admin() from public,anon,authenticated;
revoke all on function public.vf_choose_account_type(text,text),public.vf_me(),public.vf_fellowship_directory(text),
  public.vf_apply_to_fellowship(uuid,text,text),public.vf_withdraw_from_fellowship(uuid),public.vf_admin_fellowships(),
  public.vf_admin_save_fellowship(uuid,text,text,text,text,text,boolean,date,date,date,integer,integer,text),
  public.vf_admin_delete_fellowship(uuid),public.vf_admin_new_join_code(uuid),public.vf_admin_roster(uuid),
  public.vf_admin_decide_enrollment(uuid,uuid,text,text) from public,anon;
grant execute on function public.vf_choose_account_type(text,text),public.vf_me(),public.vf_fellowship_directory(text),
  public.vf_apply_to_fellowship(uuid,text,text),public.vf_withdraw_from_fellowship(uuid),public.vf_admin_fellowships(),
  public.vf_admin_save_fellowship(uuid,text,text,text,text,text,boolean,date,date,date,integer,integer,text),
  public.vf_admin_delete_fellowship(uuid),public.vf_admin_new_join_code(uuid),public.vf_admin_roster(uuid),
  public.vf_admin_decide_enrollment(uuid,uuid,text,text) to authenticated;
commit;
