# LG Production-Readiness Plan

**Date:** 2026-08-14  
**Owner:** Project lead / engineering agent  
**Target:** Production-ready Admin, Teacher, Student, and Parent portals without regression.

## 1. Objectives and KPIs

### Objectives
1. Preserve all currently working authentication and role workflows.
2. Eliminate runtime console errors that represent real application failures.
3. Make Supabase the authoritative source for production data.
4. Verify RLS and role isolation for Admin, Teacher, Student, and Parent.
5. Verify production build and deployment after every merged change.
6. Keep the intentionally retired Messages, Marks Overview, Student Results, and AI Chat features retired/disabled.

### KPIs
- Production build: **100% green**.
- CI lint/typecheck: **100% green**.
- No reproducible P0/P1 runtime errors in supported role workflows.
- Login success: **4/4 roles**.
- Data persistence after refresh/re-login: **100% for tested workflows**.
- RLS negative tests: **0 unauthorized reads/writes**.
- Student Phase 2 acceptance: **100% of required workflows verified**.
- Teacher and Parent acceptance: **100% of supported workflows verified before release gate**.

## 2. Execution Sequence and Milestones

### Milestone 0 — Freeze and baseline
**Deadline:** 2026-08-14
- Treat current `main` as the baseline.
- No database reset or destructive schema changes.
- Record current CI/build status.
- Keep fixes isolated in short-lived branches and PRs.

### Milestone 1 — Production runtime stabilization
**Deadline:** 2026-08-15
- Verify the latest deployed build is actually serving the current `main` commit.
- Reproduce and classify remaining console errors.
- Fix only root causes: stale bundle/deployment, Supabase RLS/storage, Edge Functions, null-state handling.
- Re-run CI + Production Check after every fix.

### Milestone 2 — Student acceptance gate
**Deadline:** 2026-08-15
- Verify login.
- Verify announcements, timetable, attendance, homework, materials, exams, fees, notifications.
- Verify refresh/re-login persistence.
- Verify Student-to-Student isolation.

### Milestone 3 — Teacher acceptance gate
**Deadline:** 2026-08-16
- Verify login and dashboard.
- Verify timetable, attendance, homework, materials, announcements, notifications, and supported administrative workflows.
- Verify teacher access is limited to permitted students/batches/classes.

### Milestone 4 — Parent acceptance gate
**Deadline:** 2026-08-16
- Verify login.
- Verify linked-child access.
- Verify attendance, timetable, homework, materials, exams, fees, announcements, notifications.
- Verify Parent A cannot access Parent B's children/data.

### Milestone 5 — Admin acceptance gate
**Deadline:** 2026-08-17
- Verify admin login/provisioning.
- Verify every retained Admin feature.
- Verify class/section/batch dropdown constraints where applicable.
- Verify CRUD persistence and error isolation.
- Verify admin-provision-user Edge Function.

### Milestone 6 — Release gate
**Deadline:** 2026-08-17
- CI green.
- Production Check green.
- Deployment green.
- Four-role smoke test green.
- RLS/security checks green.
- No known P0/P1 issues.
- Document known P2/P3 issues if any.

## 3. Responsibilities

### Engineering agent
- Inspect repository and Supabase implementation.
- Implement fixes in isolated branches.
- Run and inspect CI/production checks.
- Never reset production data or make unrelated refactors.

### Project owner / tester
- Perform final browser/device smoke tests where environment-only behavior cannot be verified through GitHub/Supabase tooling.
- Report exact console/network errors with URL, role, and action.
- Validate expected business behavior.

### Shared accountability
- A task is complete only when code, build, database behavior, and the relevant user workflow are verified.
- A green build alone does not equal production readiness.

## 4. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Stale deployment serves old JS | Verify deployed commit/build before code changes; redeploy current `main`. |
| Supabase schema mismatch | Query live schema before writing code; use existing relationship tables. |
| RLS regression | Test positive and negative access for each role before merge. |
| Edge Function 4xx/5xx | Inspect function logs and request payload; fix root cause only. |
| Storage signed URL errors | Prefer validated direct download/object paths and verify storage policies. |
| Null/empty production data | Use safe defaults and empty states; never assume arrays are non-null. |
| Fix breaks another role | Run targeted role smoke tests plus CI before merge. |
| Too many simultaneous changes | One root-cause fix per PR; no broad rewrites. |

## 5. Contingency Plan

If a production fix causes a regression:
1. Stop further feature work.
2. Identify the exact offending commit/PR.
3. Revert only the regression-causing change if necessary.
4. Preserve database data and migrations unless a schema rollback is proven safe.
5. Re-run CI and Production Check.
6. Re-implement the fix in a smaller isolated change.

If production cannot be reproduced from tooling:
- Do not claim it is fixed.
- Request one exact browser console/network capture and the role/action that produced it.
- Compare the served build commit with `main` before changing code.

## 6. Review Cadence

After each PR:
- CI result reviewed.
- Production Check reviewed.
- Changed workflow reviewed.
- Relevant Supabase/RLS impact reviewed.
- PR merged only when checks are green.

At each milestone:
- Update this plan with completed items.
- Record remaining P0/P1/P2/P3 issues.
- Recalculate release readiness.

## 7. Current Starting State

- PR #14: Student Phase 2 production-data hardening — merged.
- PR #15: Console-error/root-cause cleanup — merged.
- PR #16: Material Storage URL stabilization — merged.
- PR #17: Student batch relationship fix (`students.batch_id` removed) — merged.
- Latest known code/build checks for PR #17: CI and Production Check passed.
- Current priority: verify the deployed `main` build and complete the four-role production acceptance gates without introducing unrelated changes.
