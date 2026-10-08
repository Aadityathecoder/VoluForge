-- Complete the opportunity detail screen's persisted data.
-- Existing rows and access controls are preserved.
begin;
alter table public.vf_opportunities
  add column address text not null default '' check(length(address) <= 500),
  add column latitude double precision check(latitude between -90 and 90),
  add column longitude double precision check(longitude between -180 and 180),
  add column requirements text[] not null default '{}' check(cardinality(requirements) <= 30 and length(array_to_string(requirements, ' ')) <= 10000),
  add constraint vf_coordinate_pair check ((latitude is null) = (longitude is null));
update public.vf_opportunities set address=location;

create or replace function public.vf_upsert_opportunity(p_data jsonb,p_id uuid default null)
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
    insert into public.vf_opportunities(org_id,title,description,category,location,remote,image_url,starts_at,ends_at,capacity,min_age,skills,proof_required,status,address,latitude,longitude,requirements)
    values(v_org,p_data->>'title',p_data->>'description',coalesce(p_data->>'category','Community'),coalesce(p_data->>'location',''),coalesce((p_data->>'remote')::boolean,false),p_data->>'image_url',
      (p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,v_capacity,coalesce((p_data->>'min_age')::integer,13),
      array(select jsonb_array_elements_text(coalesce(p_data->'skills','[]'))),coalesce((p_data->>'proof_required')::boolean,false),coalesce(p_data->>'status','draft'),coalesce(p_data->>'address',p_data->>'location',''),
      (p_data->>'latitude')::double precision,(p_data->>'longitude')::double precision,
      array(select jsonb_array_elements_text(coalesce(p_data->'requirements','[]')))) returning * into v_row;
  else
    update public.vf_opportunities set title=p_data->>'title',description=p_data->>'description',category=coalesce(p_data->>'category','Community'),location=coalesce(p_data->>'location',''),
      remote=coalesce((p_data->>'remote')::boolean,false),image_url=p_data->>'image_url',starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz,
      capacity=v_capacity,min_age=coalesce((p_data->>'min_age')::integer,13),skills=array(select jsonb_array_elements_text(coalesce(p_data->'skills','[]'))),
      proof_required=coalesce((p_data->>'proof_required')::boolean,false),status=coalesce(p_data->>'status','draft'),
      address=coalesce(p_data->>'address',v_row.address),
      latitude=case when p_data ? 'latitude' then (p_data->>'latitude')::double precision else v_row.latitude end,
      longitude=case when p_data ? 'longitude' then (p_data->>'longitude')::double precision else v_row.longitude end,
      requirements=case when p_data ? 'requirements' then array(select jsonb_array_elements_text(p_data->'requirements')) else v_row.requirements end where id=p_id returning * into v_row;
  end if;
  insert into public.vf_audit(actor_id,org_id,entity_id,action,metadata) values(v_uid,v_org,v_row.id,'opportunity.saved',jsonb_build_object('status',v_row.status));
  return v_row;
end $$;

commit;
