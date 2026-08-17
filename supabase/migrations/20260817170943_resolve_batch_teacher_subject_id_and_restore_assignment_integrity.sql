create or replace function public.resolve_batch_teacher_subject_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_subject public.subjects%rowtype;
begin
  if new.subject_id is null then
    if nullif(trim(coalesce(new.subject_name, '')), '') is null then
      raise exception 'A teacher assignment requires a subject.' using errcode = '23502';
    end if;

    select * into matched_subject
    from public.subjects
    where lower(trim(name)) = lower(trim(new.subject_name))
    order by created_at nulls last, id
    limit 1;

    if matched_subject.id is null then
      raise exception 'Subject "%" does not exist. Create the subject first, then assign the teacher.', new.subject_name using errcode = '23503';
    end if;

    new.subject_id := matched_subject.id;
    new.subject_name := matched_subject.name;
  else
    select * into matched_subject
    from public.subjects
    where id = new.subject_id
    limit 1;

    if matched_subject.id is null then
      raise exception 'Subject ID "%" does not exist.', new.subject_id using errcode = '23503';
    end if;

    if nullif(trim(coalesce(new.subject_name, '')), '') is null then
      new.subject_name := matched_subject.name;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.resolve_batch_teacher_subject_id() from public;
grant execute on function public.resolve_batch_teacher_subject_id() to authenticated;

drop trigger if exists trg_resolve_batch_teacher_subject_id on public.batch_teachers;
create trigger trg_resolve_batch_teacher_subject_id
before insert or update on public.batch_teachers
for each row execute function public.resolve_batch_teacher_subject_id();

insert into public.batch_teachers(batch_id, teacher_id, subject_id, subject_name, status)
select distinct t.batch_id, t.teacher_id, s.id, s.name, case when t.status = 'active' then 'active' else 'inactive' end
from public.timetable_entries t
join public.subjects s on lower(trim(s.name)) = lower(trim(t.subject_name))
on conflict (batch_id, teacher_id, subject_id)
do update set subject_name = excluded.subject_name, status = excluded.status;
