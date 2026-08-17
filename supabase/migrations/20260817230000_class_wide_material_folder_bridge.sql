create or replace function public.assign_class_material_folder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sec is null or btrim(coalesce(new.sec,'')) = '' then
    if new.folder_id is null then
      select mf.id into new.folder_id
      from public.material_folders mf
      where mf.parent_id is null
        and mf.access_standards @> array[new.cls]::text[]
      order by mf.name
      limit 1;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_class_material_folder() from public;
grant execute on function public.assign_class_material_folder() to authenticated;

drop trigger if exists trg_assign_class_material_folder on public.materials;
create trigger trg_assign_class_material_folder
before insert or update of cls, sec, folder_id on public.materials
for each row execute function public.assign_class_material_folder();

update public.materials m
set folder_id = mf.id
from public.material_folders mf
where m.folder_id is null
  and (m.sec is null or btrim(coalesce(m.sec,'')) = '')
  and mf.parent_id is null
  and mf.access_standards @> array[m.cls]::text[];
