-- Allow a fellowship member to open projects deliberately linked to their cohort.
-- Existing project ownership policies remain in place for every other project.
begin;

create policy fellowship_members_can_read_linked_projects on public.projects
  for select to authenticated using (
    exists (
      select 1 from public.fellowship_projects fp
      join public.fellowship_members fm on fm.fellowship_id=fp.fellowship_id
      where fp.project_id=projects.id and fm.user_id=auth.uid()
    )
  );

commit;
