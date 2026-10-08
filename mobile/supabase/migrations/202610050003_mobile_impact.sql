-- Native service resubmission and outcome logging for timed/existing entries.
begin;
create function public.vf_record_outcome(p_entry_id uuid,p_metric text,p_quantity numeric,p_evidence text)
returns public.vf_outcomes language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=vf_private.require_user(); v_entry public.vf_service_entries; v_metric text; v_row public.vf_outcomes;
begin
 select * into v_entry from public.vf_service_entries where id=p_entry_id for update;
 if not found or v_entry.student_id<>v_uid then raise exception 'Service entry unavailable' using errcode='42501'; end if;
 if v_entry.status not in ('pending','approved') then raise exception 'Submit the service entry before its outcome'; end if;
 select o.outcome_metric into v_metric from public.vf_applications a join public.vf_opportunities o on o.id=a.opportunity_id where a.id=v_entry.application_id;
 if btrim(p_metric) is distinct from v_metric then raise exception 'Use the outcome metric defined by the partner'; end if;
 select * into v_row from public.vf_outcomes where service_entry_id=p_entry_id and metric=v_metric for update;
 if found and v_row.status<>'rejected' then raise exception 'Outcome already submitted'; end if;
 insert into public.vf_outcomes(service_entry_id,metric,quantity,evidence) values(p_entry_id,v_metric,p_quantity,btrim(p_evidence))
 on conflict(service_entry_id,metric) do update set quantity=excluded.quantity,evidence=excluded.evidence,status='pending',reviewer_id=null,reviewed_at=null,review_note=''
 returning * into v_row;
 return v_row;
end $$;
create function public.vf_submit_mobile_impact(p_application_id uuid,p_service_date date,p_minutes integer,p_notes text,p_metric text,p_quantity numeric,p_evidence text,p_proof_path text default null,p_entry_id uuid default null)
returns public.vf_service_entries language plpgsql security definer set search_path='' as $$
declare v_entry public.vf_service_entries;
begin
 v_entry:=public.vf_submit_service(p_application_id,p_service_date,p_minutes,p_notes,p_proof_path,p_entry_id);
 -- Returned service is pending again. Replace only an unverified outcome in this transaction.
 if exists(select 1 from public.vf_outcomes where service_entry_id=v_entry.id and status='approved') then raise exception 'Verified outcomes cannot be revised'; end if;
 delete from public.vf_outcomes where service_entry_id=v_entry.id and status in ('pending','rejected');
 perform public.vf_record_outcome(v_entry.id,p_metric,p_quantity,p_evidence);
 return v_entry;
end $$;
revoke execute on function public.vf_record_outcome(uuid,text,numeric,text),public.vf_submit_mobile_impact(uuid,date,integer,text,text,numeric,text,text,uuid) from public,anon,authenticated;
grant execute on function public.vf_record_outcome(uuid,text,numeric,text),public.vf_submit_mobile_impact(uuid,date,integer,text,text,numeric,text,text,uuid) to authenticated;
create function public.vf_mobile_impact_ready() returns boolean language sql stable set search_path='' as $$ select true $$;
revoke execute on function public.vf_mobile_impact_ready() from public,anon,authenticated;
grant execute on function public.vf_mobile_impact_ready() to authenticated;
commit;
