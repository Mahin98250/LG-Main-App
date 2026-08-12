# Teacher T7 Regression Checklist

T7 is the final Teacher end-to-end regression gate. Run this against the deployed app with a real teacher account.

1. Sign in as a teacher and verify the session restores after reopening the site.
2. Open Schedule and verify only the teacher's active timetable entries appear.
3. Open Students/Home and verify students come from assigned active batches.
4. Open Attendance and verify only assigned students can be read or changed.
5. Create attendance and confirm it persists after refresh.
6. Open Homework and verify only assigned batches and assigned subjects are selectable.
7. Create homework, refresh, and confirm it persists.
8. Delete the created homework and confirm it disappears after refresh.
9. Open Materials and verify only the teacher's authorized materials are listed.
10. Upload a small PDF, refresh, download it, and confirm the file is readable.
11. Delete the test material and confirm both metadata and storage object are removed.
12. Log out; verify protected routes return to login.
13. Log back in; verify the teacher dashboard and permissions are restored.
14. Attempt an unauthorized batch/teacher operation through the UI/API and verify Supabase RLS rejects it.
15. Verify no console 4xx/5xx errors are produced by normal Teacher workflows.

CI/Production Check must be green before T7 is marked complete.