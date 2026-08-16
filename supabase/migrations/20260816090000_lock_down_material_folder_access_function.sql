-- Keep the standard-based material access helper callable only by signed-in users.
-- The helper is SECURITY DEFINER so it can evaluate the authorization graph safely,
-- but it must never be exposed to the anon role.

revoke execute on function public.material_folder_standard_accessible(uuid, text) from anon;
revoke execute on function public.material_folder_standard_accessible(uuid, text) from public;
grant execute on function public.material_folder_standard_accessible(uuid, text) to authenticated;
alter function public.material_folder_standard_accessible(uuid, text) set search_path = public;
