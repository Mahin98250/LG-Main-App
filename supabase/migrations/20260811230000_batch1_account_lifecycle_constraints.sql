-- Batch 1: Student / Parent / Teacher lifecycle constraints.
-- Prevent duplicate login identifiers at the database layer.

create unique index if not exists students_sid_unique_idx
  on public.students (upper(trim(sid)));

create unique index if not exists teachers_tid_unique_idx
  on public.teachers (upper(trim(tid)));

create unique index if not exists teachers_phone_unique_idx
  on public.teachers (trim(phone));

create unique index if not exists users_auth_id_unique_idx
  on public.users (auth_id)
  where auth_id is not null;
