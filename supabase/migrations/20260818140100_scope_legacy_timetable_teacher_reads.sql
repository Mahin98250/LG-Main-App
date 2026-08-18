-- Scope legacy timetable reads to the authenticated teacher's own timetable rows.
-- Students and parents retain their class/section visibility; admins retain full access.

drop policy if exists timetable_read on public.timetable;

create policy timetable_read on public.timetable
for select to authenticated
using (
  public.app_role() = 'admin'
  or (
    public.app_role() = 'teacher'
    and tid = public.current_ref()
  )
  or exists (
    select 1
    from public.students s
    where s.id = public.current_ref()
      and s.cls = timetable.cls
      and s.sec = timetable.sec
  )
  or exists (
    select 1
    from public.parent_student_links psl
    join public.students ps on ps.id = psl.student_id
    where psl.parent_auth_id = auth.uid()
      and psl.status = 'active'
      and ps.cls = timetable.cls
      and ps.sec = timetable.sec
  )
);
