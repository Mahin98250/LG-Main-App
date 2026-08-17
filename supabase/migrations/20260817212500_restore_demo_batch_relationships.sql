-- Restore the canonical relationships for the existing Class 10/A records.
-- These rows are required by the current RLS model for timetable, homework,
-- teacher access, and student/parent portal reads.

insert into public.subjects (id, name, cls, created_at)
values
  ('sub-english', 'English', '10', now()),
  ('sub-social-studies', 'Social Studies', '10', now())
on conflict (id) do update
set name = excluded.name, cls = excluded.cls;

insert into public.batch_students (batch_id, student_id, joined_at, status)
select 'batch-1786618063610', s.id, coalesce(s.created_at, now()), 'active'
from public.students s
where s.cls = '10'
  and s.sec = 'A'
  and lower(coalesce(s.status, 'active')) not in ('inactive', 'disabled', 'suspended', 'deleted')
  and not exists (
    select 1 from public.batch_students bs
    where bs.batch_id = 'batch-1786618063610' and bs.student_id = s.id
  );

insert into public.batch_teachers (batch_id, teacher_id, subject_id, subject_name, assigned_at, status)
select 'batch-1786618063610', 't1786523345567', 'sub-social-studies', 'Social Studies', now(), 'active'
where not exists (
  select 1 from public.batch_teachers bt
  where bt.batch_id = 'batch-1786618063610' and bt.teacher_id = 't1786523345567'
);

update public.batches
set studentids = (
      select array_agg(student_id order by student_id)
      from public.batch_students
      where batch_id = 'batch-1786618063610' and status = 'active'
    ),
    teacherids = (
      select array_agg(teacher_id order by teacher_id)
      from public.batch_teachers
      where batch_id = 'batch-1786618063610' and status = 'active'
    ),
    updated_at = now()
where id = 'batch-1786618063610';
