# S5 + S6 Student/Parent Regression Gate

This document is the release gate for the Student/Parent authentication and timetable integration stages.

## S5 — Authentication

### Student
- [ ] Create/provision a student account through Admin.
- [ ] Student can sign in with the provisioned credentials.
- [ ] Close/reopen the browser; the Supabase session restores without asking for credentials again.
- [ ] Explicit logout clears the session and returns to the login screen.
- [ ] Student can sign in again after logout.
- [ ] Wrong password is rejected.
- [ ] Disabled/inactive student profile is rejected after Auth credentials are accepted.
- [ ] A student account cannot enter the teacher, parent, or admin portal by changing the requested role.

### Parent
- [ ] Create/provision a parent account linked to a student.
- [ ] Parent can sign in with the provisioned credentials.
- [ ] Close/reopen the browser; the Supabase session restores.
- [ ] Explicit logout clears the session.
- [ ] Parent can sign in again after logout.
- [ ] Wrong password is rejected.
- [ ] Disabled/inactive linked profile is rejected.
- [ ] Parent cannot enter the student, teacher, or admin portal by changing the requested role.

## S6 — Batch → Student → Timetable

For a batch such as `10-A` with an active schedule:

`Monday | 4:00–5:00 | Maths | Teacher A | Room 1`

- [ ] Assign Student A to batch 10-A.
- [ ] Student A sees the Monday timetable entry automatically.
- [ ] No student-level timetable record is required.
- [ ] Removing Student A from the batch removes that timetable from the student portal.
- [ ] Assign Student B to a different batch at the same class/section; Student B does not see 10-A's schedule.
- [ ] A student with multiple active batch memberships sees schedules for all of their active batches.
- [ ] Parent sees schedules for every linked child's batch.
- [ ] Teacher sees only schedules assigned to that teacher.

## Implementation requirements

- Supabase Auth is the source of truth for authentication/session persistence.
- `app_metadata.role` and `app_metadata.ref` are server-managed authorization attributes.
- `batch_students` is the authoritative Student → Batch relationship.
- `timetable_entries.batch_id` is the authoritative Batch → Timetable relationship.
- The Student timetable must be derived from active batch membership and active timetable entries; it must not depend on a manually maintained student timetable.
- RLS remains authoritative; frontend filtering is not considered a security boundary.

## Automated gate

The implementation must pass CI and Production Check before the stage can be marked released. Live browser click-testing remains a separate manual acceptance test.
