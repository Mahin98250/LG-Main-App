create extension if not exists btree_gist;

alter table public.timetable_entries
  drop constraint if exists timetable_entries_valid_time;

alter table public.timetable_entries
  add constraint timetable_entries_valid_time
  check (start_time < end_time);

alter table public.timetable_entries
  drop constraint if exists timetable_teacher_no_overlap;

alter table public.timetable_entries
  add constraint timetable_teacher_no_overlap
  exclude using gist (
    teacher_id with =,
    day_of_week with =,
    time_range with &&
  ) where (status = 'active');

alter table public.timetable_entries
  drop constraint if exists timetable_batch_no_overlap;

alter table public.timetable_entries
  add constraint timetable_batch_no_overlap
  exclude using gist (
    batch_id with =,
    day_of_week with =,
    time_range with &&
  ) where (status = 'active');

alter table public.timetable_entries
  drop constraint if exists timetable_room_no_overlap;

alter table public.timetable_entries
  add constraint timetable_room_no_overlap
  exclude using gist (
    room_id with =,
    day_of_week with =,
    time_range with &&
  ) where (status = 'active' and room_id is not null);
