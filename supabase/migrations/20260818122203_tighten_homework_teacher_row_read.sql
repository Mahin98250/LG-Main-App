-- Reassert the homework SELECT policy against the scoped row-readable helper.
drop policy if exists homework_select on public.homework;
create policy homework_select on public.homework
for select to authenticated
using (public.homework_row_readable(id, batch_id, cls, sec, tid));
