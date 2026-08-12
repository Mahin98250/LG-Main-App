-- Stage B T3/T4: enforce teacher -> batch -> student scope at the database layer.
create or replace function public.teacher_can_access_student(p_teacher_id text, p_student_id text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.timetable_entries te
    join public.batch_students bs on bs.batch_id = te.batch_id
    where te.teacher_id = p_teacher_id
      and bs.student_id = p_student_id
      and coalesce(bs.status,'active') = 'active'
      and coalesce(te.status,'active') = 'active'
  );
$$;

grant execute on function public.teacher_can_access_student(text,text) to authenticated;

drop policy if exists batch_students_teacher_read on public.batch_students;
create policy batch_students_teacher_read on public.batch_students for select
using ("current_role"()='teacher' and teacher_can_access_student(current_ref(),student_id));

drop policy if exists students_select on public.students;
create policy students_select on public.students for select using (
  "current_role"()='admin'
  or ("current_role"()='teacher' and teacher_can_access_student(current_ref(),id))
  or (("current_role"()='student' or "current_role"()='parent') and id=current_ref())
);

drop policy if exists students_write on public.students;
drop policy if exists students_admin_write on public.students;
create policy students_admin_write on public.students for all
using ("current_role"()='admin') with check ("current_role"()='admin');

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select using (
  "current_role"()='admin'
  or ("current_role"()='teacher' and teacher_can_access_student(current_ref(),sid))
  or (("current_role"()='student' or "current_role"()='parent') and sid=current_ref())
);

drop policy if exists attendance_teacher_write on public.attendance;
drop policy if exists attendance_admin_write on public.attendance;
drop policy if exists attendance_teacher_write_scoped on public.attendance;
create policy attendance_admin_write on public.attendance for all
using ("current_role"()='admin') with check ("current_role"()='admin');
create policy attendance_teacher_write_scoped on public.attendance for all
using (
  "current_role"()='teacher'
  and coalesce("by",current_ref())=current_ref()
  and teacher_can_access_student(current_ref(),sid)
)
with check (
  "current_role"()='teacher'
  and coalesce("by",current_ref())=current_ref()
  and teacher_can_access_student(current_ref(),sid)
);

create index if not exists idx_batch_students_student_active on public.batch_students(student_id) where status='active';
create index if not exists idx_batch_students_batch_active on public.batch_students(batch_id) where status='active';
create index if not exists idx_timetable_entries_teacher_batch_active on public.timetable_entries(teacher_id,batch_id) where status='active';
create index if not exists idx_attendance_student_date on public.attendance(sid,date);
