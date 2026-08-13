create or replace function public.can_message_user(sender_ref text, recipient_ref text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  sr text;
  rr text;
begin
  if sender_ref is null or recipient_ref is null or sender_ref = recipient_ref then return false; end if;
  select role into sr from public.users where ref = sender_ref limit 1;
  select role into rr from public.users where ref = recipient_ref limit 1;
  if sr is null or rr is null then return false; end if;
  if sr = 'admin' then return true; end if;
  if sr not in ('student','parent','teacher') or rr not in ('student','parent','teacher') then return false; end if;
  if sr = 'student' and rr = 'teacher' then
    return exists (select 1 from public.batch_students bs join public.batch_teachers bt on bt.batch_id = bs.batch_id and bt.status = 'active' where bs.student_id = sender_ref and bs.status = 'active' and bt.teacher_id = recipient_ref);
  elsif sr = 'teacher' and rr = 'student' then
    return exists (select 1 from public.batch_students bs join public.batch_teachers bt on bt.batch_id = bs.batch_id and bt.status = 'active' where bs.student_id = recipient_ref and bs.status = 'active' and bt.teacher_id = sender_ref);
  elsif sr = 'parent' and rr = 'teacher' then
    return exists (select 1 from public.parent_student_links psl join public.batch_students bs on bs.student_id = psl.student_id and bs.status = 'active' join public.batch_teachers bt on bt.batch_id = bs.batch_id and bt.status = 'active' join public.users pu on pu.auth_id = psl.parent_auth_id and pu.ref = sender_ref where psl.status = 'active' and bt.teacher_id = recipient_ref);
  elsif sr = 'teacher' and rr = 'parent' then
    return exists (select 1 from public.parent_student_links psl join public.batch_students bs on bs.student_id = psl.student_id and bs.status = 'active' join public.batch_teachers bt on bt.batch_id = bs.batch_id and bt.status = 'active' join public.users pu on pu.auth_id = psl.parent_auth_id and pu.ref = recipient_ref where psl.status = 'active' and bt.teacher_id = sender_ref);
  end if;
  return false;
end;
$$;

revoke all on function public.can_message_user(text,text) from public;
grant execute on function public.can_message_user(text,text) to authenticated;

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check ((select app_role()) = 'admin' or ("from" = current_ref() and public.can_message_user("from","to")));

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using ((select app_role()) = 'admin' or "from" = current_ref() or "to" = current_ref());

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated using ((select app_role()) = 'admin' or "to" = current_ref()) with check ((select app_role()) = 'admin' or "to" = current_ref());

create or replace function public.create_message_notification()
returns trigger language plpgsql security definer set search_path = public, pg_catalog
as $$
begin
  insert into public.notifications(id,title,"desc",time,type,read,uid,created_at)
  values ('msg-' || new.id, 'New message from ' || coalesce(new.fromname,'Learner''s Guide'), left(coalesce(new.text,''),140), coalesce(new.time,to_char(now(),'DD Mon YYYY, HH12:MI AM')), 'message', false, new."to", now())
  on conflict (id) do nothing;
  return new;
exception when others then return new;
end;
$$;

drop trigger if exists message_notification_insert on public.messages;
create trigger message_notification_insert after insert on public.messages for each row execute function public.create_message_notification();
