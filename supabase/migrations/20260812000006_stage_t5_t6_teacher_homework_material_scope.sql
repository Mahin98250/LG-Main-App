alter table public.homework add column if not exists batch_id text;
alter table public.materials add column if not exists batch_id text;
create index if not exists idx_homework_batch_id on public.homework(batch_id);
create index if not exists idx_materials_batch_id on public.materials(batch_id);

create or replace function public.teacher_can_access_batch(p_batch_id text,p_teacher_id text default public.current_ref()) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.timetable_entries where batch_id=p_batch_id and teacher_id=p_teacher_id and status='active') $$;
create or replace function public.student_can_access_batch(p_batch_id text,p_student_id text default public.current_ref()) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.batch_students where batch_id=p_batch_id and student_id=p_student_id and status='active') $$;
create or replace function public.homework_row_readable(p_id text,p_batch_id text,p_cls text,p_sec text,p_tid text) returns boolean language plpgsql stable security definer set search_path=public as $$ begin if public.app_role()='admin' then return true; end if; if public.app_role()='teacher' then return p_tid is null or p_tid=public.current_ref(); end if; if public.app_role() in ('student','parent') then if p_batch_id is not null then return public.student_can_access_batch(p_batch_id,public.current_ref()); end if; return exists(select 1 from public.students s where s.id=public.current_ref() and s.cls=p_cls and s.sec=p_sec); end if; return false; end; $$;
create or replace function public.material_row_readable(p_batch_id text,p_cls text,p_sec text) returns boolean language plpgsql stable security definer set search_path=public as $$ begin if public.app_role()='admin' then return true; end if; if public.app_role()='teacher' then return p_batch_id is null or public.teacher_can_access_batch(p_batch_id,public.current_ref()); end if; if public.app_role() in ('student','parent') then if p_batch_id is not null then return public.student_can_access_batch(p_batch_id,public.current_ref()); end if; return exists(select 1 from public.students s where s.id=public.current_ref() and (p_cls is null or s.cls=p_cls) and (p_sec is null or s.sec=p_sec)); end if; return false; end; $$;
revoke all on function public.teacher_can_access_batch(text,text),public.student_can_access_batch(text,text),public.homework_row_readable(text,text,text,text,text),public.material_row_readable(text,text,text) from public;
grant execute on function public.teacher_can_access_batch(text,text),public.student_can_access_batch(text,text),public.homework_row_readable(text,text,text,text,text),public.material_row_readable(text,text,text) to authenticated;

drop policy if exists homework_read on public.homework;
drop policy if exists homework_teacher_write on public.homework;
drop policy if exists homework_teacher_insert on public.homework;
drop policy if exists homework_teacher_update on public.homework;
drop policy if exists homework_teacher_delete on public.homework;
create policy homework_read on public.homework for select to authenticated using (public.homework_row_readable(id,batch_id,cls,sec,tid));
create policy homework_teacher_insert on public.homework for insert to authenticated with check (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));
create policy homework_teacher_update on public.homework for update to authenticated using (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref()))) with check (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));
create policy homework_teacher_delete on public.homework for delete to authenticated using (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));

drop policy if exists materials_read on public.materials;
drop policy if exists materials_teacher_write on public.materials;
drop policy if exists materials_teacher_insert on public.materials;
drop policy if exists materials_teacher_update on public.materials;
drop policy if exists materials_teacher_delete on public.materials;
create policy materials_read on public.materials for select to authenticated using (public.material_row_readable(batch_id,cls,sec));
create policy materials_teacher_insert on public.materials for insert to authenticated with check (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));
create policy materials_teacher_update on public.materials for update to authenticated using (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref()))) with check (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));
create policy materials_teacher_delete on public.materials for delete to authenticated using (public.app_role()='admin' or (public.app_role()='teacher' and tid=public.current_ref() and batch_id is not null and public.teacher_can_access_batch(batch_id,public.current_ref())));
