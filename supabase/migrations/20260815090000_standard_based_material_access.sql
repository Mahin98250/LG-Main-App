-- Study materials are shared by standard, not by batch, section, or subject.
-- Existing Class N roots are backfilled so the current folder tree keeps working.

alter table public.material_folders
  add column if not exists access_standards text[] not null default '{}';

create index if not exists idx_material_folders_access_standards
  on public.material_folders using gin (access_standards);

update public.material_folders
set access_standards = array[regexp_replace(name, '[^0-9]', '', 'g')]
where parent_id is null
  and regexp_replace(name, '[^0-9]', '', 'g') in ('9','10','11','12')
  and coalesce(array_length(access_standards, 1), 0) = 0;

create or replace function public.material_folder_standard_accessible(
  p_folder_id uuid,
  p_user_ref text default public.current_ref()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive ancestors as (
    select mf.id, mf.parent_id, mf.access_standards, mf.name
    from public.material_folders mf
    where mf.id = p_folder_id
    union all
    select parent.id, parent.parent_id, parent.access_standards, parent.name
    from public.material_folders parent
    join ancestors child on child.parent_id = parent.id
  ),
  student_standards as (
    select regexp_replace(lower(coalesce(s.cls, '')), '[^0-9]', '', 'g') as standard
    from public.students s
    where public.app_role() = 'student'
      and s.id = p_user_ref
    union
    select regexp_replace(lower(coalesce(s.cls, '')), '[^0-9]', '', 'g') as standard
    from public.students s
    join public.parent_student_links psl on psl.student_id = s.id
    where public.app_role() = 'parent'
      and psl.parent_auth_id = auth.uid()
      and psl.status = 'active'
    union
    select regexp_replace(lower(coalesce(s.cls, '')), '[^0-9]', '', 'g') as standard
    from public.students s
    where public.app_role() = 'parent'
      and s.id = p_user_ref
  )
  select
    public.app_role() in ('student', 'parent')
    and exists (
      select 1
      from ancestors a
      cross join student_standards ss
      where ss.standard <> ''
        and ss.standard = any(a.access_standards)
    );
$$;

revoke all on function public.material_folder_standard_accessible(uuid, text) from public;
grant execute on function public.material_folder_standard_accessible(uuid, text) to authenticated;

-- Replace the previous batch-derived student/parent folder rule.
drop policy if exists material_folders_authorized_read on public.material_folders;
drop policy if exists material_folders_parent_linked_read on public.material_folders;
create policy material_folders_authorized_read
on public.material_folders
for select to authenticated
using (
  public.app_role() = 'admin'
  or (public.app_role() in ('student','parent') and public.material_folder_standard_accessible(id, public.current_ref()))
  or (public.app_role() = 'teacher' and exists (
    select 1
    from public.materials m
    where m.folder_id = material_folders.id
      and public.material_row_readable(m.batch_id, m.cls, m.sec)
  ))
);

-- A material inside a standard-scoped folder inherits that folder's access.
drop policy if exists materials_read on public.materials;
drop policy if exists materials_parent_linked_read on public.materials;
create policy materials_read
on public.materials
for select to authenticated
using (
  public.app_role() = 'admin'
  or (
    public.app_role() = 'teacher'
    and public.material_row_readable(batch_id, cls, sec)
  )
  or (
    public.app_role() in ('student','parent')
    and (
      (folder_id is not null and public.material_folder_standard_accessible(folder_id, public.current_ref()))
      or (folder_id is null and public.material_row_readable(batch_id, cls, sec))
    )
  )
);

-- Keep legacy un-foldered materials working. New folder-based uploads should use folder access.
comment on column public.material_folders.access_standards is
  'Standards allowed to access this folder. Descendant folders inherit access from ancestors. Batch/section/subject do not affect study-material access.';
