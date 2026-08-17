-- Teachers upload materials directly to the materials bucket using
-- teacher/<teacher-id>/... paths. The previous storage policies allowed only
-- admins to write to this bucket, so teacher material upload/delete could not work.

drop policy if exists materials_teacher_insert on storage.objects;
drop policy if exists materials_teacher_update on storage.objects;
drop policy if exists materials_teacher_delete on storage.objects;

create policy materials_teacher_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'materials'
  and public.app_role() = 'teacher'
  and name like 'teacher/' || public.current_ref() || '/%'
);

create policy materials_teacher_update on storage.objects
for update to authenticated
using (
  bucket_id = 'materials'
  and public.app_role() = 'teacher'
  and name like 'teacher/' || public.current_ref() || '/%'
)
with check (
  bucket_id = 'materials'
  and public.app_role() = 'teacher'
  and name like 'teacher/' || public.current_ref() || '/%'
);

create policy materials_teacher_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'materials'
  and public.app_role() = 'teacher'
  and name like 'teacher/' || public.current_ref() || '/%'
);
