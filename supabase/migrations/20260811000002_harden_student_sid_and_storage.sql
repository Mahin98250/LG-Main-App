-- Learner's Guide production hardening
-- 1) Normalize legacy student IDs to the required LG-001 format.
-- 2) Enforce the format at the database boundary.
-- 3) Enforce the 50 MiB material upload limit in Supabase Storage.

begin;

-- Normalize legacy values such as LG001 -> LG-001.
update public.students
set sid = 'LG-' || lpad(substring(sid from 3), 3, '0')
where sid ~* '^LG[0-9]+$';

-- Reject malformed SIDs at the database boundary.
alter table public.students
drop constraint if exists students_sid_format_check;

alter table public.students
add constraint students_sid_format_check
check (sid ~ '^LG-[0-9]{3,}$');

-- Keep the application's 50 MiB rule enforced by Storage as well.
update storage.buckets
set file_size_limit = 52428800
where id = 'materials';

commit;
