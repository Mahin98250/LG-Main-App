create index if not exists notifications_uid_created_at_idx on public.notifications(uid, created_at desc);

create or replace function public.notification_insert_for_auth(p_auth_id uuid, p_title text, p_desc text, p_type text)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if p_auth_id is null then return; end if;
  insert into public.notifications(id,title,"desc","time",type,read,uid,created_at)
  values (gen_random_uuid()::text, coalesce(p_title,'Notification'), coalesce(p_desc,''), to_char(now(),'DD Mon YYYY HH24:MI'), coalesce(p_type,'message'), false, p_auth_id::text, now());
end; $$;

create or replace function public.notification_insert_for_refs(p_refs text[], p_title text, p_desc text, p_type text)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
declare r record;
begin
  for r in select distinct u.id from auth.users u where (u.raw_app_meta_data->>'ref') = any(coalesce(p_refs,array[]::text[])) loop
    perform public.notification_insert_for_auth(r.id,p_title,p_desc,p_type);
  end loop;
end; $$;

create or replace function public.notification_refs_for_batch(p_batch_id text)
returns text[] language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(array_agg(distinct x.ref),array[]::text[]) from (
    select bs.student_id::text as ref from public.batch_students bs where bs.batch_id=p_batch_id and coalesce(bs.status,'active')='active'
    union
    select psl.student_id::text as ref from public.parent_student_links psl join public.batch_students bs on bs.student_id=psl.student_id where bs.batch_id=p_batch_id and coalesce(bs.status,'active')='active' and psl.status='active'
  ) x;
$$;

create or replace function public.emit_announcement_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare aud text := lower(trim(coalesce(new.target,'all'))); refs text[]; r record; role_name text;
begin
  if aud in ('all','everyone','*') then
    for r in select id from auth.users where (raw_app_meta_data->>'role') in ('student','parent','teacher') loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  elsif aud in ('students','student','parents','parent','teachers','teacher') then
    role_name := case when aud like 'student%' then 'student' when aud like 'parent%' then 'parent' else 'teacher' end;
    for r in select id from auth.users where (raw_app_meta_data->>'role')=role_name loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  else
    if aud like 'batch:%' then aud := substr(aud,7); end if;
    refs := public.notification_refs_for_batch(aud);
    perform public.notification_insert_for_refs(refs,new.title,coalesce(new.desc,''),'announcement');
    for r in select u.id from auth.users u where (u.raw_app_meta_data->>'role')='teacher' and exists(select 1 from public.timetable_entries te where te.batch_id=aud and te.teacher_id=(u.raw_app_meta_data->>'ref') and te.status='active') loop
      perform public.notification_insert_for_auth(r.id,new.title,coalesce(new.desc,''),'announcement');
    end loop;
  end if;
  return new;
end; $$;
drop trigger if exists notifications_announcements_insert on public.announcements;
create trigger notifications_announcements_insert after insert on public.announcements for each row execute function public.emit_announcement_notifications();

create or replace function public.emit_homework_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare refs text[];
begin
  refs := public.notification_refs_for_batch(new.batch_id);
  perform public.notification_insert_for_refs(refs,'New homework: '||coalesce(new.subject,'Homework'),coalesce(new.desc,'New homework has been assigned.'),'homework');
  return new;
end; $$;
drop trigger if exists notifications_homework_insert on public.homework;
create trigger notifications_homework_insert after insert on public.homework for each row when (new.batch_id is not null) execute function public.emit_homework_notifications();

create or replace function public.emit_material_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare refs text[];
begin
  refs := public.notification_refs_for_batch(new.batch_id);
  perform public.notification_insert_for_refs(refs,'New study material: '||coalesce(new.title,new.name,'Material'),coalesce(new.desc,'New study material is available.'),'material');
  return new;
end; $$;
drop trigger if exists notifications_materials_insert on public.materials;
create trigger notifications_materials_insert after insert on public.materials for each row when (new.batch_id is not null) execute function public.emit_material_notifications();

create or replace function public.emit_attendance_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare r record; sid text := new.sid::text;
begin
  for r in select distinct u.id from auth.users u where u.raw_app_meta_data->>'ref'=sid and u.raw_app_meta_data->>'role'='student' loop
    perform public.notification_insert_for_auth(r.id,'Attendance updated','Your attendance for '||coalesce(new.date,'today')||' is marked '||coalesce(new.status,'updated')||'.','attendance');
  end loop;
  for r in select distinct psl.parent_auth_id from public.parent_student_links psl where psl.student_id=sid and psl.status='active' loop
    perform public.notification_insert_for_auth(r.parent_auth_id,'Attendance updated','Attendance for your linked student on '||coalesce(new.date,'today')||' is '||coalesce(new.status,'updated')||'.','attendance');
  end loop;
  return new;
end; $$;
drop trigger if exists notifications_attendance_insert on public.attendance;
create trigger notifications_attendance_insert after insert on public.attendance for each row execute function public.emit_attendance_notifications();

create or replace function public.emit_timetable_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare refs text[]; r record; changed boolean := (tg_op='INSERT');
begin
  if tg_op='UPDATE' then changed := (old.batch_id is distinct from new.batch_id or old.teacher_id is distinct from new.teacher_id or old.subject_name is distinct from new.subject_name or old.day_of_week is distinct from new.day_of_week or old.start_time is distinct from new.start_time or old.end_time is distinct from new.end_time or old.room_id is distinct from new.room_id or old.status is distinct from new.status); end if;
  if not changed or coalesce(new.status,'active')<>'active' then return new; end if;
  refs := public.notification_refs_for_batch(new.batch_id);
  perform public.notification_insert_for_refs(refs,'Timetable updated',coalesce(new.subject_name,'Class')||' timetable has been updated.','timetable');
  for r in select u.id from auth.users u where u.raw_app_meta_data->>'role'='teacher' and u.raw_app_meta_data->>'ref'=new.teacher_id loop
    perform public.notification_insert_for_auth(r.id,'Timetable updated',coalesce(new.subject_name,'Class')||' timetable has been updated.','timetable');
  end loop;
  return new;
end; $$;
drop trigger if exists notifications_timetable_change on public.timetable_entries;
create trigger notifications_timetable_change after insert or update on public.timetable_entries for each row execute function public.emit_timetable_notifications();

revoke all on function public.notification_insert_for_auth(uuid,text,text,text) from public;
revoke all on function public.notification_insert_for_refs(text[],text,text,text) from public;
revoke all on function public.notification_refs_for_batch(text) from public;
revoke all on function public.emit_announcement_notifications() from public;
revoke all on function public.emit_homework_notifications() from public;
revoke all on function public.emit_material_notifications() from public;
revoke all on function public.emit_attendance_notifications() from public;
revoke all on function public.emit_timetable_notifications() from public;
