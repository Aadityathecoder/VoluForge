-- Disposable database only. Does not create Auth accounts on a hosted project.
begin;
insert into auth.users(id) values ('55555555-5555-5555-5555-555555555555');
insert into public.vf_organizations(id,name,verified)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd','Fictional test organization',true);
insert into public.vf_org_staff(org_id,user_id)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd','55555555-5555-5555-5555-555555555555');
set local role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
do $$
declare v_data jsonb; v_row public.vf_opportunities;
begin
  v_data := jsonb_build_object('org_id','dddddddd-dddd-dddd-dddd-dddddddddddd',
    'title','Fictional teaching session','description','A supervised session for database tests.',
    'location','Community center','address','Example meeting room',
    'latitude',26.1,'longitude',-80.1,'requirements',jsonb_build_array('Bring water','Complete orientation'),
    'starts_at',now(),'ends_at',now()+interval '2 hours','capacity',10,'status','published');
  v_row := public.vf_upsert_opportunity(v_data);
  if v_row.address <> 'Example meeting room' or v_row.requirements <> array['Bring water','Complete orientation']
    or v_row.latitude <> 26.1 or v_row.longitude <> -80.1 then raise exception 'Details were not persisted'; end if;
  -- Older clients must not clear new fields when updating core data.
  v_row := public.vf_upsert_opportunity(v_data - array['address','requirements','latitude','longitude'],v_row.id);
  if v_row.address <> 'Example meeting room' or cardinality(v_row.requirements) <> 2 or v_row.latitude <> 26.1
    then raise exception 'Legacy update cleared detail fields'; end if;
  begin
    perform public.vf_upsert_opportunity(v_data || '{"latitude":91}',v_row.id);
    raise exception 'Invalid latitude was accepted';
  exception when check_violation then null; end;
  begin
    perform public.vf_upsert_opportunity(v_data || '{"longitude":null}',v_row.id);
    raise exception 'Unpaired coordinates were accepted';
  exception when check_violation then null; end;
end $$;
rollback;
