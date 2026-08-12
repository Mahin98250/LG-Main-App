create table if not exists public.parent_student_links (
  parent_auth_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  primary key (parent_auth_id, student_id)
);

create index if not exists idx_parent_student_links_student on public.parent_student_links(student_id);
alter table public.parent_student_links enable row level security;

create or replace function public.parent_can_access_student(target_student_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() = 'admin'
  or (public.app_role() = 'parent' and exists (
    select 1 from public.parent_student_links psl
    where psl.parent_auth_id = auth.uid() and psl.student_id = target_student_id and psl.status = 'active'
  ))
  or (public.app_role() = 'parent' and target_student_id = public.current_ref());
$$;

create or replace function public.parent_can_access_batch(target_batch_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.batch_students bs
    where bs.batch_id = target_batch_id and bs.status = 'active' and public.parent_can_access_student(bs.student_id)
  );
$$;

create policy parent_student_links_self_read on public.parent_student_links for select to authenticated using (parent_auth_id = auth.uid());
create policy parent_student_links_admin_all on public.parent_student_links for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy students_parent_linked_read on public.students for select to authenticated using (public.parent_can_access_student(id));
create policy batch_students_parent_linked_read on public.batch_students for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_student(student_id));
create policy timetable_parent_linked_read on public.timetable_entries for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_batch(batch_id));
create policy attendance_parent_linked_read on public.attendance for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_student(sid));
create policy homework_parent_linked_read on public.homework for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_batch(batch_id));
create policy materials_parent_linked_read on public.materials for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_batch(batch_id));
create policy material_folders_parent_linked_read on public.material_folders for select to authenticated using (
  public.app_role() = 'parent' and exists (
    select 1 from public.materials m where m.folder_id = material_folders.id and public.parent_can_access_batch(m.batch_id)
  )
);
create policy fees_parent_linked_read on public.fees for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_student(sid));
create policy marks_parent_linked_read on public.marks for select to authenticated using (public.app_role() = 'parent' and public.parent_can_access_student(sid));

insert into public.parent_student_links(parent_auth_id, student_id)
select u.id, (u.raw_app_meta_data->>'ref')
from auth.users u
join public.students s on s.id = (u.raw_app_meta_data->>'ref')
where u.raw_app_meta_data->>'role' = 'parent'
on conflict (parent_auth_id, student_id) do nothing;
