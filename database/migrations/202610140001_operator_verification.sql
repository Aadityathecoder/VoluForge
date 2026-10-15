-- Trusted operator verification. Keep vf_private outside exposed API schemas.
begin;
create table vf_private.operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table vf_private.organization_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.vf_organizations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  decision text not null check (decision in ('approved','rejected')),
  previous_verified boolean not null,
  reason_code text not null check (reason_code in ('identity_confirmed','identity_unconfirmed','ineligible','verification_revoked')),
  created_at timestamptz not null default now()
);
create index vf_org_decisions_history on vf_private.organization_decisions(org_id,created_at desc);
alter table vf_private.operators enable row level security;
alter table vf_private.organization_decisions enable row level security;
revoke all on vf_private.operators,vf_private.organization_decisions from public,anon,authenticated,service_role;

create function public.vf_review_organization(p_org_id uuid,p_decision text,p_reason_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := vf_private.require_user(); v_previous boolean; v_id uuid;
begin
  -- Lock the allowlist row so revocation cannot race a privileged review.
  perform 1 from vf_private.operators where user_id=v_uid and active for share;
  if not found then raise exception 'Active verification operator required' using errcode='42501'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') then
    raise exception 'Decision must be approved or rejected' using errcode='22023';
  end if;
  if p_reason_code is null or
    (p_decision='approved' and p_reason_code<>'identity_confirmed') or
    (p_decision='rejected' and p_reason_code not in ('identity_unconfirmed','ineligible','verification_revoked')) then
    raise exception 'Reason code does not match decision' using errcode='22023';
  end if;
  -- Operators may not approve organizations they belong to.
  if exists(select 1 from public.vf_org_staff where org_id=p_org_id and user_id=v_uid and active) then
    raise exception 'Operators cannot review their own organization' using errcode='42501';
  end if;
  select verified into v_previous from public.vf_organizations where id=p_org_id for update;
  if not found then raise exception 'Organization not found' using errcode='P0002'; end if;
  update public.vf_organizations set verified=(p_decision='approved') where id=p_org_id;
  insert into vf_private.organization_decisions(org_id,actor_id,decision,previous_verified,reason_code)
    values(p_org_id,v_uid,p_decision,v_previous,p_reason_code) returning id into v_id;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata)
    values(v_uid,p_org_id,v_id,'organization.reviewed',jsonb_build_object('decision',p_decision,'previous_verified',v_previous,'reason_code',p_reason_code));
  return v_id;
end $$;
revoke all on function public.vf_review_organization(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.vf_review_organization(uuid,text,text) to authenticated;
commit;
