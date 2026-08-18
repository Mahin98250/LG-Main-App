-- Keep the legacy marks profile query compatible with the live marks schema.
-- These generated aliases mirror the canonical columns and do not duplicate writable data.
alter table public.marks
  add column if not exists "totalMarks" numeric generated always as (total) stored;

alter table public.marks
  add column if not exists score numeric generated always as (marks) stored;
