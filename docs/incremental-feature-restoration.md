# Incremental Feature Restoration Plan

**Project:** Learner's Guide (`Mahin98250/LG-Main-App`)
**Backend:** Supabase project `efnxjfzyqbdulpjhffsm`
**Baseline:** `main` as reviewed on 2026-08-14

## Purpose

Restore missing production features from the uploaded reference implementation one increment at a time, while preserving the current Supabase-backed architecture and role-based security.

The following features are permanently retired and must not be restored:

- Messaging
- Marks Overview
- Student Results

AI Chat is **disabled** and must remain disabled until a separate future approval explicitly enables it.

## Phase 1 — Retire Messaging and Disable AI Chat

### Completed

- Added `src/lg/featureFlags.ts` as the single source of truth for disabled features.
- Set `messaging`, `aiChat`, `marks`, and `studentResults` to `false`.
- Removed the obsolete `src/admin/AdminMessagesPage.tsx` implementation.
- Added a compatibility guard in `src/admin/AdminWithDrive.tsx` so the legacy Admin reference panel cannot expose the retired Messages, Marks Overview, or Student Results navigation entries.
- Kept `src/lg/marks.jsx` as an empty compatibility stub because it is already intentionally import-safe.
- Removed the obsolete Student Results page implementation.
- Supabase migration `20260814100000_retire_messaging_and_ai_chat` removes messaging policies/triggers/functions and revokes client access to `public.messages` while retaining historical rows.
- No AI-chat database objects were found in the current Supabase schema; therefore AI is disabled at the application feature-gate level rather than by introducing unnecessary database objects.

### Acceptance criteria

1. No Admin/Teacher/Student/Parent UI exposes a messaging action.
2. No client role can read or write `public.messages` through Supabase.
3. Historical message rows are not deleted by this phase.
4. No AI chat UI is enabled.
5. Marks and Student Results remain unavailable.
6. Existing authentication, notifications, timetable, attendance, homework, materials, fees, announcements, and parent-child security remain unchanged.

## Phase 2 — Student Portal Gaps

Restore only the missing non-retired functionality identified during the comparison:

- Dedicated announcements/news view.
- Verify all existing Student timetable, attendance, homework, materials, exam schedule, fees, and notification flows against Supabase.

## Phase 3 — Teacher Portal Gaps

- Teacher analytics dashboard.
- Dedicated announcements/news access.
- Verify batch/subject scoping for every teacher write operation.

## Phase 4 — Parent Portal Gaps

- Exam schedule.
- Announcements/news.
- Notification access.
- Verify multi-child selection and parent/student relationship isolation.

## Phase 5 — Production Verification

For every restored feature:

1. Compare the uploaded reference behavior.
2. Map the feature to the current Supabase schema.
3. Implement using the current production architecture; do not reintroduce localStorage-only behavior.
4. Add or update a Supabase migration whenever schema, RLS, storage, trigger, or function behavior changes.
5. Test the feature for Admin, Student, Teacher, and Parent as applicable.
6. Test empty states, loading states, errors, permissions, and refresh/reload behavior.
7. Confirm that unrelated role workflows still work.
8. Record the change and acceptance criteria in this document.

## Supabase change policy

All production schema changes must be represented by version-controlled migrations. Do not make untracked production schema changes in the Supabase Dashboard. This keeps Git and Supabase migration history synchronized and makes rollback/review possible.

## Important implementation rule

"100% accuracy" is treated as an acceptance target, not as an assumption. A feature is considered complete only after its UI behavior, database reads/writes, role authorization, error handling, and regression checks all pass.
