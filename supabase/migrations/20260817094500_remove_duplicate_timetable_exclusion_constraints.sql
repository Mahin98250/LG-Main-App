-- Remove duplicate timetable conflict constraints.
-- Keep the timetable_entries_* constraints, which are identical and remain
-- responsible for enforcing batch, room, and teacher overlap protection.

alter table public.timetable_entries
  drop constraint if exists timetable_batch_no_overlap;

alter table public.timetable_entries
  drop constraint if exists timetable_room_no_overlap;

alter table public.timetable_entries
  drop constraint if exists timetable_teacher_no_overlap;
