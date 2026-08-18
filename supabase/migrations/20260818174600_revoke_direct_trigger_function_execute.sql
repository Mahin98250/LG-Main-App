-- Trigger functions do not need client EXECUTE privileges.
-- Revoking these grants prevents direct RPC invocation of internal trigger helpers.

revoke execute on function public.set_material_folder_updated_at() from public, anon, authenticated;
revoke execute on function public.sync_admin_compat_columns() from public, anon, authenticated;

grant execute on function public.set_material_folder_updated_at() to postgres;
grant execute on function public.sync_admin_compat_columns() to postgres;
