-- Phase 2-A: announcement targeting and database-level audience isolation.
-- Supported target values: all, students, parents, teachers, batch:<batch_id>.

create or replace function public.announcement_visible(p_target text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select case
    when public.app_role() = 'admin' then true
    when lower(coalesce(p_target,'all')) in ('all','everyone') then public.app_role() in ('student','parent','teacher')
    when lower(p_target) in ('student','students') then public.app_role() = 'student'
    when lower(p_target) in ('parent','parents') then public.app_role() = 'parent'
    when lower(p_target) in ('teacher','teachers') then public.app_role() = 'teacher'
    when lower(p_target) like 'batch:%' then
      case public.app_role()
        when 'student' then public.student_can_access_batch(split_part(p_target,':',2), public.current_ref())
        when 'teacher' then public.teacher_can_access_batch(split_part(p_target,':',2), public.current_ref())
        when 'parent' then exists (
          select 1
          from public.parent_student_links psl
          join public.batch_students bs on bs.student_id = psl.student_id and coalesce(bs.status,'active')='active'
          where psl.parent_auth_id = auth.uid()
            and psl.status='active'
            and bs.batch_id = split_part(p_target,':',2)
        )
        else false
      end
    else false
  end;
$$;

revoke all on function public.announcement_visible(text) from public;
grant execute on function public.announcement_visible(text) to authenticated;

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
for select to authenticated
using (public.announcement_visible(target));

alter table public.announcements drop constraint if exists announcements_target_check;
alter table public.announcements add constraint announcements_target_check
check (lower(coalesce(target,'all')) = any (array['all','everyone','student','students','parent','parents','teacher','teachers']) or lower(target) like 'batch:%');

alter table public.announcements enable row level security;
