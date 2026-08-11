-- Consolidate duplicate camelCase student parent fields into the canonical lowercase columns.
-- The current admin editor wrote the camelCase values during edits, so those
-- values are treated as the latest values when both columns disagree.
update public.students
set
  parentname = coalesce(nullif("parentName", ''), parentname),
  parentphone = coalesce(nullif("parentPhone", ''), parentphone)
where "parentName" is not null or "parentPhone" is not null;

-- Keep one canonical representation in the database.
alter table public.students drop column if exists "parentName";
alter table public.students drop column if exists "parentPhone";
