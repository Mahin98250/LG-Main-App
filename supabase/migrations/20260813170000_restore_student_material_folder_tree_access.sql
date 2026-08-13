create or replace function public.student_can_access_material_folder(p_folder_id uuid, p_student_id text default current_ref())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive tree as (
    select mf.id, mf.parent_id, mf.name
    from public.material_folders mf
    where mf.id = p_folder_id
    union all
    select parent.id, parent.parent_id, parent.name
    from public.material_folders parent
    join tree child on child.parent_id = parent.id
  ),
  descendants as (
    select mf.id
    from public.material_folders mf
    where mf.id = p_folder_id
    union all
    select child.id
    from public.material_folders child
    join descendants parent on child.parent_id = parent.id
  )
  select
    public.app_role() in ('student','parent')
    and (
      (
        public.app_role() = 'student'
        and exists (
          select 1
          from public.students s
          join tree root on root.parent_id is null
          where s.id = p_student_id
            and root.name = 'Class ' || s.cls
        )
      )
      or exists (
        select 1
        from public.materials m
        join descendants d on d.id = m.folder_id
        where public.material_row_readable(m.batch_id, m.cls, m.sec)
      )
    );
$$;
