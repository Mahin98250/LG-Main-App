drop policy if exists messages_select on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
drop policy if exists messages_delete on public.messages;

create policy messages_select on public.messages
for select to authenticated
using (
  public.app_role() = 'admin'
  or "from" = public.current_ref()
  or "to" = public.current_ref()
);

create policy messages_insert on public.messages
for insert to authenticated
with check (
  public.app_role() = 'admin'
  or "from" = public.current_ref()
);

create policy messages_update on public.messages
for update to authenticated
using (
  public.app_role() = 'admin'
  or "to" = public.current_ref()
  or "from" = public.current_ref()
)
with check (
  public.app_role() = 'admin'
  or "to" = public.current_ref()
  or "from" = public.current_ref()
);

create policy messages_delete on public.messages
for delete to authenticated
using (
  public.app_role() = 'admin'
  or "from" = public.current_ref()
);