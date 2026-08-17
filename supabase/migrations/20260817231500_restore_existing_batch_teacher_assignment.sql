-- Keep the canonical batch_teachers relationship aligned with the existing
-- timetable assignment. This is idempotent and only runs when the referenced
-- batch, teacher, and subject already exist.

insert into public.batch_teachers(batch_id, teacher_id, subject_id, subject_name, status)
select 'batch-1786618063610', 't1786523345567', 'sub-social-studies', 'Social Studies', 'active'
where exists (select 1 from public.batches where id = 'batch-1786618063610')
  and exists (select 1 from public.teachers where id = 't1786523345567')
  and exists (select 1 from public.subjects where id = 'sub-social-studies')
on conflict (batch_id, teacher_id, subject_id)
do update set subject_name = excluded.subject_name, status = 'active';
