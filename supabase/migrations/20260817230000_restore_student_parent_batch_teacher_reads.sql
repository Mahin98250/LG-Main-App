-- Student/parent portals hydrate batch_teachers as part of their live data set.
-- The previous SELECT policy allowed only admins and teachers, causing the
-- portal-wide hydrateForRole() Promise.allSettled() gate to report a failure.

drop policy if exists batch_teachers_select on public.batch_teachers;

create policy batch_teachers_select on public.batch_teachers
for select to authenticated
using (
  public.app_role() = 'admin'
  or (public.app_role() = 'teacher' and teacher_id = public.current_ref())
  or (public.app_role() in ('student', 'parent') and public.student_can_access_batch(batch_id, public.current_ref()))
);

grant execute on function public.student_can_access_batch(text, text) to authenticated;
