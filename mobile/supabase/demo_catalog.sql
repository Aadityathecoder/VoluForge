-- Optional fictional catalog for an owner-authorized demo project.
-- Does not insert Auth users, staff privileges, applications or verified hours.
-- Re-running does not overwrite existing records or shift scheduled dates.
begin;
insert into public.vf_organizations(id,name,description,verified)
values ('f0000000-0000-4000-8000-000000000001','VoluForge Demo Organization',
  'Fictional organization for demonstrating the app. No real volunteering placements are offered.',true)
on conflict (id) do nothing;
insert into public.vf_opportunities(id,org_id,title,description,category,location,address,remote,
  starts_at,ends_at,capacity,min_age,skills,requirements,status)
values
 ('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001',
  'DEMO: Community meal packing','Fictional demo only. Practice applying for a supervised meal-packing session. Do not travel to this event.',
  'Food security','Demo community center','Fictional kitchen — demo only',false,
  now()-interval '1 hour',now()+interval '7 days',20,14,array['Teamwork'],array['Demo only; no real event','Wear closed-toe shoes'],'published'),
 ('f1000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',
  'DEMO: Coastal cleanup','Fictional demo only. Explore the details of a supervised beach cleanup. Do not travel to this event.',
  'Environment','Demo beach','Fictional beach — demo only',false,
  now()+interval '3 days',now()+interval '3 days 3 hours',30,14,array['Teamwork','Environmental care'],array['Demo only; no real event','Bring water'],'published'),
 ('f1000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001',
  'DEMO: Online study club','Fictional demo only. Explore a supervised remote tutoring opportunity. No real meeting link is provided.',
  'Education','Remote','Online — demo only',true,
  now()+interval '5 days',now()+interval '5 days 2 hours',10,16,array['Communication','Math'],array['Demo only; no real event','Reliable internet'],'published')
on conflict (id) do nothing;
commit;
