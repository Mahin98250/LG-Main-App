-- Restore Study Materials Drive admin access using the canonical server-side role resolver.
-- This keeps folder/file workflows intact while avoiding stale JWT-only role checks.

DROP POLICY IF EXISTS admin_full_access_material_folders ON public.material_folders;
DROP POLICY IF EXISTS material_folders_admin_all ON public.material_folders;
CREATE POLICY material_folders_admin_all
ON public.material_folders
FOR ALL TO authenticated
USING (public.app_role() = 'admin')
WITH CHECK (public.app_role() = 'admin');

DROP POLICY IF EXISTS materials_admin_insert ON storage.objects;
CREATE POLICY materials_admin_insert
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials' AND public.app_role() = 'admin');

DROP POLICY IF EXISTS materials_admin_update ON storage.objects;
CREATE POLICY materials_admin_update
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'materials' AND public.app_role() = 'admin')
WITH CHECK (bucket_id = 'materials' AND public.app_role() = 'admin');

DROP POLICY IF EXISTS materials_admin_delete ON storage.objects;
CREATE POLICY materials_admin_delete
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'materials' AND public.app_role() = 'admin');
