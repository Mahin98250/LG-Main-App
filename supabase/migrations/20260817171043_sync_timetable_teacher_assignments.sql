create or replace function public.sync_timetable_batch_teacher_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_subject public.subjects%rowtype;
  assignment_status text;
begin
  select * into matched_subject
  from public.subjects
  where lower(trim(name)) = lower(trim(new.subject_name))
  order by created_at nulls last, id
  limit 1;

  if matched_subject.id is not null then
    assignment_status := case when new.status = 'active' then 'active' else 'inactive' end;
    insert into public.batch_teachers(batch_id, teacher_id, subject_id, subject_name, status)
    values (new.batch_id, new.teacher_id, matched_subject.id, matched_subject.name, assignment_status)
    on conflict (batch_id, teacher_id, subject_id)
    do update set subject_name = excluded.subject_name, status = excluded.status;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_timetable_batch_teacher_assignment() from public;
grant execute on function public.sync_timetable_batch_teacher_assignment() to authenticated;

drop trigger if exists trg_sync_timetable_batch_teacher_assignment on public.timetable_entries;
create trigger trg_sync_timetable_batch_teacher_assignment
after insert or update of batch_id, teacher_id, subject_name, status on public.timetable_entries
for each row execute function public.sync_timetable_batch_teacher_assignment();

insert into public.batch_teachers(batch_id, teacher_id, subject_id, subject_name, status)
select distinct t.batch_id, t.teacher_id, s.id, s.name, case when t.status = 'active' then 'active' else 'inactive' end
from public.timetable_entries t
join public.subjects s on lower(trim(s.name)) = lower(trim(t.subject_name))
on conflict (batch_id, teacher_id, subject_id)
do update set subject_name = excluded.subject_name, status = excluded.status;
