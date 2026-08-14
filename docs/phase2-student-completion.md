# Phase 2 — Student Production Completion

## Scope

Student-facing information must come from Supabase as the production source of truth for:

- Announcements / News
- Timetable
- Attendance
- Homework
- Study Materials
- Upcoming Exams
- Fees
- Notifications

Messages, Marks, Student Results, and AI Chat remain retired/disabled by product decision.

## Acceptance criteria

1. Student data is loaded from Supabase after login and after refresh/re-login.
2. Timetable is scoped to the student's assigned batch/class/section.
3. Attendance is scoped to the authenticated student's SID.
4. Homework is scoped to the student's batch/class/section.
5. Materials are scoped to the student's batch/class/section through server-side RLS and client-side filtering.
6. Exams are scoped to the student's class/section and only upcoming exams are displayed.
7. Fees are scoped to the authenticated student's SID.
8. Announcements are loaded from Supabase and only applicable announcements are shown.
9. Notifications are scoped to the authenticated user ID.
10. Empty states are shown when no records exist; localStorage is not used as the authoritative source for these datasets.
11. No credentials, service-role keys, or private Supabase secrets are placed in frontend code.

## Verification gate

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Student login smoke test
- Refresh/re-login persistence test
- Student A vs Student B authorization test
- Material download test
- Notification read-state test

A build passing alone does not constitute completion; live Supabase and authorization tests are required.
