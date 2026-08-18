-- Security hardening: trigger-only security-definer functions must not be directly callable.
-- RLS helper predicates remain callable by authenticated sessions where required.

revoke execute on function public.assign_class_material_folder() from public, anon, authenticated;
revoke execute on function public.resolve_batch_teacher_subject_id() from public, anon, authenticated;
revoke execute on function public.sync_timetable_batch_teacher_assignment() from public, anon, authenticated;
revoke execute on function public.student_can_access_material(text,text,text) from public, anon;
revoke execute on function public.teacher_can_access_material_class(text) from public, anon;
