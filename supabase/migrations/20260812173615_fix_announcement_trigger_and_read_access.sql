create or replace function public.emit_announcement_notifications()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_audience text := lower(trim(coalesce(new.target,'all')));
  refs text[];
  r record;
  role_name text;
begin
  if v_audience in ('all','everyone','*') then
    for r in select id from auth.users where (raw_app_meta_data->>'role') in ('student','parent','teacher') loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  elsif v_audience in ('students','student','parents','parent','teachers','teacher') then
    role_name := case when v_audience like 'student%' then 'student' when v_audience like 'parent%' then 'parent' else 'teacher' end;
    for r in select id from auth.users where (raw_app_meta_data->>'role')=role_name loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  else
    if v_audience like 'batch:%' then v_audience := substr(v_audience,7); end if;
    refs := public.notification_refs_for_batch(v_audience);
    perform public.notification_insert_for_refs(refs,new.title,coalesce(new.desc,''),'announcement');
    for r in select u.id from auth.users u where (u.raw_app_meta_data->>'role')='teacher' and exists(select 1 from public.timetable_entries te where te.batch_id=v_audience and te.teacher_id=(u.raw_app_meta_data->>'ref') and te.status='active') loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  end if;
  return new;
end;
$$;

drop policy if exists teachers_student_read on public.teachers;
create policy teachers_student_read on public.teachers for select to authenticated using (
  (select public.app_role())='student'
  and exists (
    select 1 from public.timetable_entries te
    join public.batch_students bs on bs.batch_id=te.batch_id
    where te.teacher_id=teachers.id and bs.student_id=public.current_ref() and coalesce(bs.status,'active')='active'
  )
);

drop policy if exists teachers_parent_read on public.teachers;
create policy teachers_parent_read on public.teachers for select to authenticated using (
  (select public.app_role())='parent'
  and exists (
    select 1 from public.timetable_entries te
    join public.batch_students bs on bs.batch_id=te.batch_id
    where te.teacher_id=teachers.id and public.parent_can_access_student(bs.student_id) and coalesce(bs.status,'active')='active'
  )
);

grant select on table public.announcements, public.attendance, public.batches, public.fees, public.homework, public.messages, public.students, public.teachers to anon;
