alter table public.materials add column if not exists name text;

update public.materials
set name = coalesce(nullif(name, ''), title)
where name is null or name = '';

create or replace function public."current_role"()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (
      select u.raw_app_meta_data ->> 'role'
      from auth.users u
      where u.id = auth.uid()
    ),
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

create or replace function public.current_ref()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (
      select u.raw_app_meta_data ->> 'ref'
      from auth.users u
      where u.id = auth.uid()
    ),
    auth.jwt() -> 'app_metadata' ->> 'ref',
    ''
  );
$$;

drop policy if exists material_folders_admin_all on public.material_folders;
create policy material_folders_admin_all
on public.material_folders
as permissive
for all
to authenticated
using (public."current_role"() = 'admin')
with check (public."current_role"() = 'admin');
