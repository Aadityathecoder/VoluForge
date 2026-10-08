-- Nonprofit ownership comes from this trigger; metadata never grants verification.
begin;
create function vf_private.create_signup_organization()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_name text;
begin
  if new.raw_user_meta_data->>'account_type' = 'nonprofit' then
    v_name := btrim(new.raw_user_meta_data->>'organization_name');
    if v_name is null or length(v_name) not between 2 and 200 then
      raise exception 'Nonprofit signup requires an organization name';
    end if;
    insert into public.vf_organizations(name,verified) values(v_name,false) returning id into v_org;
    insert into public.vf_org_staff(org_id,user_id,role) values(v_org,new.id,'owner');
  end if;
  return new;
end $$;
revoke all on function vf_private.create_signup_organization() from public,anon,authenticated;
create trigger vf_signup_organization after insert on auth.users
for each row execute function vf_private.create_signup_organization();
commit;
