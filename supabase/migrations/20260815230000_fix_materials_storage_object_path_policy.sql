-- Fix study-material downloads.
-- storage.objects.name is the actual object path (for example UUID.pdf),
-- while public.materials.name is only the display filename.
-- Qualify storage.objects.name so PostgreSQL does not resolve `name`
-- to public.materials.name inside the correlated subquery.

drop policy if exists materials_authenticated_scoped_read on storage.objects;
create policy materials_authenticated_scoped_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'materials'
  and exists (
    select 1
    from public.materials m
    where m.storage_path = storage.objects.name
      and public.material_row_readable(m.batch_id, m.cls, m.sec)
  )
);
