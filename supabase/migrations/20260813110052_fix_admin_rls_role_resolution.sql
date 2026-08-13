-- Fix admin authorization resolution for RLS.
-- Some admin records are present in public.users while auth app_metadata can be stale.
-- Resolve the server-side role from auth.users first, then the linked public.users row,
-- then the JWT claim. This keeps RLS authoritative without weakening access rules.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (select u.raw_app_meta_data ->> 'role' from auth.users u where u.id = auth.uid()),
    (select pu.role from public.users pu
      where (pu.auth_id is not null and pu.auth_id = auth.uid())
         or (pu.email is not null and lower(pu.email)=lower((select u.email from auth.users u where u.id=auth.uid())))
      order by case when pu.auth_id is not null and pu.auth_id=auth.uid() then 0 else 1 end
      limit 1),
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select public.app_role();
$$;

drop policy if exists admin_full_access_batches on public.batches;
create policy admin_full_access_batches on public.batches for all to authenticated
using (public.app_role()='admin') with check (public.app_role()='admin');

drop policy if exists admin_full_access_timetable_entries on public.timetable_entries;
create policy admin_full_access_timetable_entries on public.timetable_entries for all to authenticated
using (public.app_role()='admin') with check (public.app_role()='admin');

drop policy if exists admin_full_access_batch_students on public.batch_students;
create policy admin_full_access_batch_students on public.batch_students for all to authenticated
using (public.app_role()='admin') with check (public.app_role()='admin');

drop policy if exists admin_full_access_batch_teachers on public.batch_teachers;
create policy admin_full_access_batch_teachers on public.batch_teachers for all to authenticated
using (public.app_role()='admin') with check (public.app_role()='admin');
