-- Teachers may only read homework they own.
-- Admins retain full access; student/parent scope remains governed by batch/class checks.
create or replace function public.homework_row_readable(
  p_id text,
  p_batch_id text,
  p_cls text,
  p_sec text,
  p_tid text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
  if public.app_role() = 'admin' then
    return true;
  end if;
  if public.app_role() = 'teacher' then
    return p_tid is not null and p_tid = public.current_ref();
  end if;
  if public.app_role() in ('student', 'parent') then
    if p_batch_id is not null then
      return public.student_can_access_batch(p_batch_id, public.current_ref());
    end if;
    return exists (
      select 1 from public.students s
      where s.id = public.current_ref()
        and s.cls = p_cls
        and s.sec = p_sec
    );
  end if;
  return false;
end;
$$;
