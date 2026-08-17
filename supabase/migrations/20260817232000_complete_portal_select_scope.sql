-- Complete the SELECT scope required by hydrateForRole().

drop policy if exists batches_select on public.batches;
create policy batches_select on public.batches
for select to authenticated
using (
  public.app_role() = 'admin'
  or public.app_role() = 'teacher'
  or (public.app_role() = 'student' and public.student_can_access_batch(id, public.current_ref()))
  or (public.app_role() = 'parent' and public.parent_can_access_batch(id))
);

drop policy if exists examschedule_select on public.examschedule;
create policy examschedule_select on public.examschedule
for select to authenticated
using (
  (public.app_role() = 'admin')
  or (public.app_role() = 'teacher')
  or ((public.app_role() = 'student') and exists (
    select 1 from public.students s
    where s.id = public.current_ref()
      and s.cls = examschedule.cls
      and (examschedule.sec is null or examschedule.sec = s.sec)
  ))
  or ((public.app_role() = 'parent') and exists (
    select 1
    from public.parent_student_links psl
    join public.students s on s.id = psl.student_id
    where psl.parent_auth_id = auth.uid()
      and psl.status = 'active'
      and s.cls = examschedule.cls
      and (examschedule.sec is null or examschedule.sec = s.sec)
  ))
);

drop policy if exists rooms_teacher_select on public.rooms;
create policy rooms_teacher_select on public.rooms
for select to authenticated
using (public.app_role() in ('admin', 'teacher'));

grant execute on function public.parent_can_access_batch(text) to authenticated;
grant execute on function public.student_can_access_batch(text, text) to authenticated;
