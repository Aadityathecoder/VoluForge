-- Cohort roster, mission links, and invite-based enrollment for the legacy web app.
-- Membership/profile visibility is deliberately limited to people in the same cohort.
begin;

create table public.fellowships (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 3 and 160),
  cohort text not null check (length(btrim(cohort)) between 2 and 100),
  description text not null default '' check (length(description) <= 3000),
  starts_on date,
  ends_on date,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.fellowship_members (
  fellowship_id uuid not null references public.fellowships(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'fellow' check (member_role in ('fellow','mentor','advisor','partner')),
  member_status text not null default 'active' check (member_status in ('active','alumni')),
  joined_at timestamptz not null default now(),
  primary key (fellowship_id,user_id)
);

create table public.fellowship_projects (
  fellowship_id uuid not null references public.fellowships(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (fellowship_id,project_id)
);

-- A random invitation UUID is a bearer credential; clients cannot read its table.
create table public.fellowship_invites (
  code uuid primary key default gen_random_uuid(),
  fellowship_id uuid not null references public.fellowships(id) on delete cascade,
  member_role text not null default 'fellow' check (member_role in ('fellow','mentor','advisor','partner')),
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (use_count between 0 and max_uses),
  disabled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index fellowship_members_user on public.fellowship_members(user_id,fellowship_id);
create index fellowship_projects_project on public.fellowship_projects(project_id);
alter table public.fellowships enable row level security;
alter table public.fellowship_members enable row level security;
alter table public.fellowship_projects enable row level security;
alter table public.fellowship_invites enable row level security;

grant select on public.fellowships,public.fellowship_members,public.fellowship_projects to authenticated;
revoke all on public.fellowship_invites from anon,authenticated;
grant all on public.fellowships,public.fellowship_members,public.fellowship_projects,public.fellowship_invites to service_role;

create policy fellowship_member_can_read on public.fellowships for select to authenticated using (
  exists(select 1 from public.fellowship_members fm where fm.fellowship_id=id and fm.user_id=auth.uid())
);
create policy fellowship_own_membership_read on public.fellowship_members for select to authenticated using (user_id=auth.uid());
create policy fellowship_project_member_read on public.fellowship_projects for select to authenticated using (
  exists(select 1 from public.fellowship_members fm where fm.fellowship_id=fellowship_projects.fellowship_id and fm.user_id=auth.uid())
);

create function public.fellowship_network()
returns table(
  fellowship_id uuid,name text,cohort text,description text,starts_on date,ends_on date,
  member_role text,members jsonb,projects jsonb
)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists(select 1 from public.profiles p where p.id=v_uid) then
    raise exception 'Sign in to view your fellowship network' using errcode='42501';
  end if;
  return query
    select f.id,f.name,f.cohort,f.description,f.starts_on,f.ends_on,own.member_role,
      coalesce((select jsonb_agg(jsonb_build_object(
        'id',fm.user_id,'name',coalesce(nullif(p.full_name,''),'VoluForge member'),
        'profile_role',p.role,'school_or_org',coalesce(p.school_or_org,''),
        'location',coalesce(p.location,''),'bio',coalesce(p.bio,''),
        'member_role',fm.member_role,'member_status',fm.member_status
      ) order by case fm.member_role when 'mentor' then 0 when 'advisor' then 1 else 2 end,p.full_name)
      from public.fellowship_members fm join public.profiles p on p.id=fm.user_id
      where fm.fellowship_id=f.id and fm.member_status in ('active','alumni')), '[]'::jsonb),
      coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'title',pr.title,'status',pr.status) order by pr.title)
      from public.fellowship_projects fp join public.projects pr on pr.id=fp.project_id
      where fp.fellowship_id=f.id), '[]'::jsonb)
    from public.fellowships f join public.fellowship_members own on own.fellowship_id=f.id
    where own.user_id=v_uid and own.member_status in ('active','alumni') and f.status in ('active','completed')
    order by f.starts_on desc nulls last,f.created_at desc;
end $$;

create function public.join_fellowship(p_invite_code uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_invite public.fellowship_invites; v_fellowship_id uuid;
begin
  if v_uid is null or not exists(select 1 from public.profiles p where p.id=v_uid) then
    raise exception 'Sign in before joining a fellowship' using errcode='42501';
  end if;
  select * into v_invite from public.fellowship_invites i where i.code=p_invite_code for update;
  if not found or v_invite.disabled_at is not null or v_invite.expires_at<=now() or v_invite.use_count>=v_invite.max_uses then
    raise exception 'This fellowship invitation is expired or has no spaces left';
  end if;
  if not exists(select 1 from public.fellowships f where f.id=v_invite.fellowship_id and f.status='active') then
    raise exception 'This fellowship is not accepting members';
  end if;
  if exists(select 1 from public.fellowship_members fm where fm.fellowship_id=v_invite.fellowship_id and fm.user_id=v_uid) then
    return v_invite.fellowship_id;
  end if;
  insert into public.fellowship_members(fellowship_id,user_id,member_role)
    values(v_invite.fellowship_id,v_uid,v_invite.member_role);
  update public.fellowship_invites set use_count=use_count+1 where code=p_invite_code;
  return v_invite.fellowship_id;
end $$;

revoke all on function public.fellowship_network() from public,anon;
revoke all on function public.join_fellowship(uuid) from public,anon;
grant execute on function public.fellowship_network() to authenticated;
grant execute on function public.join_fellowship(uuid) to authenticated;
commit;
