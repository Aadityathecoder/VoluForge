-- Shared web/native impact platform. Apply after the existing native migrations.
begin;
alter table public.vf_profiles add column service_preferences jsonb not null default '{}'::jsonb
  check (jsonb_typeof(service_preferences)='object' and octet_length(service_preferences::text)<=12000);
grant update(service_preferences) on public.vf_profiles to authenticated;
alter table public.vf_opportunities
  add column min_experience integer not null default 0 check(min_experience between 0 and 600),
  add column urgency integer not null default 1 check(urgency between 1 and 5),
  add column outcome_metric text not null default 'people served' check(length(btrim(outcome_metric)) between 2 and 100),
  add column outcome_target numeric not null default 1 check(outcome_target>0 and outcome_target<=1000000000);
create table public.vf_outcomes (
  id uuid primary key default gen_random_uuid(),
  service_entry_id uuid not null references public.vf_service_entries(id) on delete cascade,
  metric text not null check(length(btrim(metric)) between 2 and 100),
  quantity numeric not null check(quantity>0 and quantity<=1000000000),
  evidence text not null check(length(btrim(evidence)) between 10 and 5000),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '' check(length(review_note)<=2000),
  unique(service_entry_id,metric),
  check(status<>'approved' or reviewed_at is not null)
);
create index vf_outcomes_entry on public.vf_outcomes(service_entry_id);
alter table public.vf_outcomes enable row level security;
revoke all on public.vf_outcomes from public,anon,authenticated;
grant select on public.vf_outcomes to authenticated;
grant all on public.vf_outcomes to service_role;
create policy vf_outcomes_read on public.vf_outcomes for select to authenticated using (
  vf_private.active_user() and exists(select 1 from public.vf_service_entries e join public.vf_applications a on a.id=e.application_id
    join public.vf_opportunities o on o.id=a.opportunity_id where e.id=service_entry_id and (e.student_id=auth.uid() or vf_private.is_staff(o.org_id)))
);
create function public.vf_submit_impact(p_application_id uuid,p_service_date date,p_minutes integer,p_notes text,p_metric text,p_quantity numeric,p_evidence text,p_proof_path text default null)
returns public.vf_service_entries language plpgsql security definer set search_path='' as $$
declare v_entry public.vf_service_entries; v_metric text;
begin
  select o.outcome_metric into v_metric from public.vf_opportunities o join public.vf_applications a on a.opportunity_id=o.id where a.id=p_application_id;
  if btrim(p_metric) is distinct from v_metric then raise exception 'Use the outcome metric defined by the partner'; end if;
  v_entry:=public.vf_submit_service(p_application_id,p_service_date,p_minutes,p_notes,p_proof_path);
  insert into public.vf_outcomes(service_entry_id,metric,quantity,evidence) values(v_entry.id,btrim(p_metric),p_quantity,btrim(p_evidence));
  return v_entry;
end $$;
create function public.vf_review_impact(p_outcome_id uuid,p_decision text,p_note text default '')
returns public.vf_outcomes language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=vf_private.require_user(); v_row public.vf_outcomes; v_student uuid; v_org uuid; v_entry_status text;
begin
  if p_decision is null or p_decision not in ('approved','rejected') then raise exception 'Invalid outcome decision'; end if;
  if p_decision='rejected' and length(btrim(coalesce(p_note,'')))<3 then raise exception 'Explain the rejection'; end if;
  select e.student_id,o.org_id,e.status into v_student,v_org,v_entry_status from public.vf_outcomes r
    join public.vf_service_entries e on e.id=r.service_entry_id join public.vf_applications a on a.id=e.application_id
    join public.vf_opportunities o on o.id=a.opportunity_id where r.id=p_outcome_id;
  if not found then raise exception 'Outcome not found'; end if;
  perform vf_private.require_staff(v_org);
  if v_student=v_uid then raise exception 'You cannot verify your own outcome' using errcode='42501'; end if;
  -- Lock the entry before approving the outcome; service must already be verified.
  perform 1 from public.vf_service_entries e join public.vf_outcomes r on r.service_entry_id=e.id where r.id=p_outcome_id and e.status='approved' for share of e;
  if p_decision='approved' and not found then raise exception 'Verify the service entry before approving its outcome'; end if;
  select * into v_row from public.vf_outcomes where id=p_outcome_id for update;
  if v_row.status<>'pending' then raise exception 'Only pending outcomes can be reviewed'; end if;
  update public.vf_outcomes set status=p_decision,reviewer_id=v_uid,reviewed_at=now(),review_note=btrim(coalesce(p_note,'')) where id=p_outcome_id returning * into v_row;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata) values(v_uid,v_org,v_row.id,'outcome.reviewed',jsonb_build_object('status',p_decision));
  return v_row;
end $$;
create function public.vf_save_service_opportunity(p_data jsonb,p_id uuid default null)
returns public.vf_opportunities language plpgsql security definer set search_path='' as $$
declare v_row public.vf_opportunities;
begin
  v_row:=public.vf_upsert_opportunity(p_data,p_id);
  update public.vf_opportunities set
    min_experience=coalesce((p_data->>'min_experience')::integer,0),urgency=coalesce((p_data->>'urgency')::integer,1),
    outcome_metric=coalesce(p_data->>'outcome_metric','people served'),outcome_target=coalesce((p_data->>'outcome_target')::numeric,1)
    where id=v_row.id returning * into v_row;
  return v_row;
end $$;
-- Fixed coarse cause cohorts, minimum five unique volunteers. No person/org/location
-- identifiers, free text, dates or individual records are exposed publicly.
create function public.vf_research_summary()
returns table(cause text,volunteers bigint,returning_volunteers bigint,verified_hours numeric)
language sql stable security definer set search_path='' as $$
  with per_volunteer as (
    select case when o.category in ('Education','Environment','Food security','Community') then o.category else 'Other' end as cause,
      e.student_id,count(distinct e.service_date) as days,sum(e.minutes) as minutes
    from public.vf_service_entries e join public.vf_profiles p on p.id=e.student_id and p.deletion_requested_at is null
      join public.vf_applications a on a.id=e.application_id join public.vf_opportunities o on o.id=a.opportunity_id
      join public.vf_organizations g on g.id=o.org_id and g.verified
    where e.status='approved' group by 1,e.student_id
  ) select cause,count(*),count(*) filter(where days>=2),round(sum(minutes)/60.0,1)
    from per_volunteer group by cause having count(*)>=5
$$;
create function public.vf_verified_outcomes()
returns table(outcome_id uuid,service_entry_id uuid,metric text,quantity numeric,reviewed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid:=vf_private.require_user();
begin
 return query select r.id,r.service_entry_id,r.metric,r.quantity,r.reviewed_at from public.vf_outcomes r
   join public.vf_service_entries e on e.id=r.service_entry_id
   where e.student_id=v_uid and e.status='approved' and r.status='approved';
end $$;
revoke execute on function public.vf_submit_impact(uuid,date,integer,text,text,numeric,text,text),public.vf_review_impact(uuid,text,text),
 public.vf_save_service_opportunity(jsonb,uuid),public.vf_research_summary(),public.vf_verified_outcomes() from public,anon,authenticated;
grant execute on function public.vf_submit_impact(uuid,date,integer,text,text,numeric,text,text),public.vf_review_impact(uuid,text,text),
 public.vf_save_service_opportunity(jsonb,uuid),public.vf_verified_outcomes() to authenticated;
grant execute on function public.vf_research_summary() to anon,authenticated;
commit;
