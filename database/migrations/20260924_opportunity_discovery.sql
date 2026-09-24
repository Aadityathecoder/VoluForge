-- F04 pilot: a read-only, persisted opportunity catalog.
-- Run once in the Supabase SQL editor after database/schema.sql.
-- Publishing/organization verification UI comes in later milestones; only
-- trusted database administrators can insert or modify these tables for now.

create table if not exists public.volunteer_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected', 'suspended')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.volunteer_organizations(id),
  title text not null check (length(trim(title)) between 5 and 160),
  description text not null check (length(trim(description)) between 20 and 4000),
  cause text not null check (length(trim(cause)) > 0),
  skills text[] not null default '{}',
  participation_mode text not null
    check (participation_mode in ('remote', 'in_person', 'hybrid')),
  location text,
  time_commitment text not null,
  minimum_age integer check (minimum_age between 13 and 25),
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint in_person_location_required check (
    participation_mode = 'remote' or nullif(trim(location), '') is not null
  )
);

create index if not exists volunteer_opportunities_visible_idx
  on public.volunteer_opportunities (status, created_at desc)
  where status = 'open';
create index if not exists volunteer_opportunities_org_idx
  on public.volunteer_opportunities (organization_id);

alter table public.volunteer_organizations enable row level security;
alter table public.volunteer_opportunities enable row level security;

grant select on public.volunteer_organizations, public.volunteer_opportunities
  to anon, authenticated;

-- Public discovery is intentional: visitors may browse, but cannot write.
-- No INSERT/UPDATE/DELETE policy is granted to anon or authenticated users.
create policy "Public can see approved organizations"
  on public.volunteer_organizations for select to anon, authenticated
  using (verification_status = 'approved');

create policy "Public can see approved open opportunities"
  on public.volunteer_opportunities for select to anon, authenticated
  using (
    status = 'open' and exists (
      select 1 from public.volunteer_organizations org
      where org.id = organization_id and org.verification_status = 'approved'
    )
  );

-- Seeded records are fictional and visibly labeled in the UI. Replace them
-- with vetted partners before the pilot; do not issue service records for them.
insert into public.volunteer_organizations (id, name, verification_status, is_demo)
values
  ('c598b971-11ef-4904-a22f-bc5db5d41ad1', 'Demo Community Pantry', 'approved', true),
  ('fbb31660-24c8-4dcc-9f02-f80cb603eb9b', 'Demo Youth Learning Center', 'approved', true),
  ('9c3e4cc6-cb02-432c-8db5-67702651c790', 'Demo Pending Partner', 'pending', true)
on conflict (id) do nothing;

insert into public.volunteer_opportunities
  (id, organization_id, title, description, cause, skills, participation_mode,
   location, time_commitment, minimum_age, status)
values
  ('2ea39774-d910-4d6f-9c82-62996f427fd4', 'c598b971-11ef-4904-a22f-bc5db5d41ad1',
   'Build a pantry inventory spreadsheet',
   'Create a simple spreadsheet to help volunteers track food donations, expiration dates, and items needed each week.',
   'Food access', array['Spreadsheets', 'Data organization'], 'remote', null, '2–3 hours per week', 15, 'open'),
  ('940baea6-5c9a-4dc5-8a66-077011589054', 'fbb31660-24c8-4dcc-9f02-f80cb603eb9b',
   'Help students practice introductory coding',
   'Support an adult-led beginner workshop by helping students understand variables, loops, and short Python exercises.',
   'Education', array['Python', 'Tutoring'], 'in_person', 'South Florida', 'Two Saturday sessions', 16, 'open'),
  ('87d1c78d-2f2e-4e9f-9803-ce002b2d9888', '9c3e4cc6-cb02-432c-8db5-67702651c790',
   'Hidden listing for pending partner',
   'This record checks that opportunities from pending organizations cannot appear in public discovery or detail views.',
   'Education', array['Writing'], 'remote', null, 'One hour', 16, 'open'),
  ('77b0945d-d3fb-4e5a-a174-8546ec82c4bf', 'c598b971-11ef-4904-a22f-bc5db5d41ad1',
   'Hidden draft listing for pantry',
   'This draft checks that unpublished opportunities cannot appear in public discovery or detail views.',
   'Food access', array['Writing'], 'remote', null, 'One hour', 16, 'draft')
on conflict (id) do nothing;
