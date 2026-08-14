alter table public.homework add column if not exists storage_path text;
alter table public.homework add column if not exists file_size bigint;
alter table public.homework add column if not exists mime_type text;
create index if not exists idx_homework_storage_path on public.homework(storage_path);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('homework','homework',false,52428800,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=52428800,allowed_mime_types=array['application/pdf'];

create or replace function public.homework_storage_readable(p_path text) returns boolean language plpgsql stable security definer set search_path=public as $$
declare h record;
begin
  select id,batch_id,cls,sec,tid into h from public.homework where storage_path=p_path limit 1;
  if not found then return false; end if;
  if public.app_role()='admin' then return true; end if;
  if public.app_role()='teacher' then
    return h.tid=public.current_ref() or (h.batch_id is not null and public.teacher_can_access_batch(h.batch_id,public.current_ref()));
  end if;
  if public.app_role()='student' then
    return public.student_can_access_batch(h.batch_id,public.current_ref());
  end if;
  if public.app_role()='parent' then
    return exists(select 1 from public.parent_student_links psl join public.batch_students bs on bs.student_id=psl.student_id and bs.batch_id=h.batch_id where psl.parent_auth_id=auth.uid() and psl.status='active' and bs.status='active' and bs.left_at is null);
  end if;
  return false;
end; $$;
revoke all on function public.homework_storage_readable(text) from public;
grant execute on function public.homework_storage_readable(text) to authenticated;

drop policy if exists homework_storage_read on storage.objects;
drop policy if exists homework_storage_insert on storage.objects;
drop policy if exists homework_storage_update on storage.objects;
drop policy if exists homework_storage_delete on storage.objects;
create policy homework_storage_read on storage.objects for select to authenticated using (bucket_id='homework' and public.homework_storage_readable(name));
create policy homework_storage_insert on storage.objects for insert to authenticated with check (bucket_id='homework' and (public.app_role()='admin' or public.app_role()='teacher'));
create policy homework_storage_update on storage.objects for update to authenticated using (bucket_id='homework' and public.app_role()='admin') with check (bucket_id='homework' and public.app_role()='admin');
create policy homework_storage_delete on storage.objects for delete to authenticated using (bucket_id='homework' and (public.app_role()='admin' or (public.app_role()='teacher' and exists(select 1 from public.homework h where h.storage_path=name and h.tid=public.current_ref()))));

-- storage.objects.name is the actual object path; materials.name is only the display filename.
drop policy if exists materials_authenticated_scoped_read on storage.objects;
create policy materials_authenticated_scoped_read on storage.objects for select to authenticated using (bucket_id='materials' and exists(select 1 from public.materials m where m.storage_path=name and public.material_row_readable(m.batch_id,m.cls,m.sec)));
