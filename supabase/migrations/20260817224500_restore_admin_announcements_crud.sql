-- Restore the missing admin CRUD policy for announcements.
-- The portal already has a role-scoped SELECT policy; admins also need
-- INSERT/UPDATE/DELETE for the Admin panel announcement manager.

drop policy if exists announcements_admin_full_access on public.announcements;
create policy announcements_admin_full_access on public.announcements
for all to authenticated
using (app_role() = 'admin')
with check (app_role() = 'admin');
