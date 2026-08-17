-- Restore EXECUTE privileges required by authenticated RLS policies.
-- The previous security hardening revoked these privileges from authenticated,
-- which made every RLS policy calling app_role/current_ref/etc fail with
-- "permission denied for function ..." and surfaced as HTTP 403s.

grant execute on function public.app_role() to authenticated;
grant execute on function public.current_ref() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.announcement_visible(text) to authenticated;
grant execute on function public.homework_row_readable(text, text, text, text, text) to authenticated;
grant execute on function public.homework_storage_readable(text) to authenticated;
grant execute on function public.material_folder_standard_accessible(uuid, text) to authenticated;
grant execute on function public.material_row_readable(text, text, text) to authenticated;
grant execute on function public.material_storage_object_readable(text) to authenticated;
grant execute on function public.parent_can_access_batch(text) to authenticated;
grant execute on function public.parent_can_access_student(text) to authenticated;
grant execute on function public.student_can_access_batch(text, text) to authenticated;
grant execute on function public.student_can_access_material_folder(uuid, text) to authenticated;
grant execute on function public.teacher_can_access_batch(text, text) to authenticated;
grant execute on function public.teacher_can_access_student(text, text) to authenticated;
