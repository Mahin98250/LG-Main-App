# Production Console Repair

This document tracks the controlled production-error repair pass. The goal is to remove repeated frontend/Supabase errors without changing the remaining product workflows.

## Scope
- Preserve authentication and all existing role workflows.
- Keep Messages, Marks, Student Results, and AI Chat disabled as previously requested.
- Fix only confirmed runtime/data-access issues.
- Verify lint, typecheck, production build, and production checks before merge.

## Reported error families
1. Admin `cols is not defined` crash.
2. Null data `.filter` crashes.
3. Material signed-URL HTTP 400.
4. `admin-provision-user` HTTP 502.
5. Retired `messages` HTTP 403 preload requests.
6. Auth/notification 401/403 responses.

## Verification rule
Repeated console lines are grouped by root cause. A high line count is not treated as hundreds of independent defects.

## Safety rule
No database reset, destructive data migration, authentication rewrite, or feature removal is allowed during this repair pass.
