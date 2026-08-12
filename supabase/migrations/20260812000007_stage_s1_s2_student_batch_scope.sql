create or replace function public.student_can_access_batch(p_batch_id text, p_student_id text default public.current_ref())
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.batch_students bs
    where bs.batch_id=p_batch_id
      and bs.student_id=p_student_id
      and coalesce(bs.status,'active')='active'
  );
$$;

create or replace function public.student_can_access_material_folder(p_folder_id uuid, p_student_id text default public.current_ref())
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  with recursive tree as (
    select mf.id from public.material_folders mf where mf.id=p_folder_id
    union all
    select child.id from public.material_folders child join tree parent on child.parent_id=parent.id
  )
  select exists (
    select 1
    from public.materials m
    join tree t on t.id=m.folder_id
    where public.material_row_readable(m.batch_id,m.cls,m.sec)
      and public.app_role() in ('student','parent')
  );
$$;

drop policy if exists material_folders_authorized_read on public.material_folders;
create policy material_folders_authorized_read
on public.material_folders
for select
to authenticated
using (
  public.app_role()='admin'
  or (public.app_role() in ('student','parent') and public.student_can_access_material_folder(id,public.current_ref()))
  or (public.app_role()='teacher' and exists (
    select 1 from public.materials m
    where m.folder_id=material_folders.id
      and public.material_row_readable(m.batch_id,m.cls,m.sec)
  ))
);

create index if not exists idx_batch_students_student_active on public.batch_students(student_id,batch_id) where status='active';
create index if not exists idx_timetable_entries_batch_active on public.timetable_entries(batch_id,day_of_week,start_time) where status='active';
create index if not exists idx_materials_batch_folder on public.materials(batch_id,folder_id);
create index if not exists idx_homework_batch_created on public.homework(batch_id,created_at desc);
create index if not exists idx_attendance_student_date on public.attendance(sid,date desc);
