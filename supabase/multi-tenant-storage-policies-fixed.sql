-- ============================================
-- Multi-Tenant Platform - Storage Policies (FIXED)
-- Tarea 2.3: Políticas de Storage con aislamiento por empresa_id
-- ============================================
-- Requirements: 2.4, 2.5, 19.4
--
-- Este script implementa políticas de Storage que garantizan aislamiento
-- de archivos entre empresas mediante validación del prefijo empresa_id/
-- en las rutas de almacenamiento.
-- ============================================

-- ============================================
-- PASO 1: Eliminar políticas antiguas de Storage
-- ============================================

-- Eliminar políticas existentes del bucket 'evidencias'
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Solo el Dueño puede eliminar evidencias" ON storage.objects;

-- ============================================
-- PASO 2: Función para extraer empresa_id de la ruta del archivo
-- ============================================

-- Extrae el empresa_id del prefijo de la ruta del archivo
-- Formato esperado: {empresa_id}/resto/de/la/ruta
-- Retorna NULL si el formato no es válido
CREATE OR REPLACE FUNCTION public.extract_empresa_id_from_path(file_path TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  empresa_uuid UUID;
BEGIN
  -- Intentar extraer el UUID del inicio de la ruta
  -- La ruta debe comenzar con un UUID seguido de /
  BEGIN
    empresa_uuid := (regexp_match(file_path, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/', 'i'))[1]::UUID;
    RETURN empresa_uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.extract_empresa_id_from_path(TEXT) IS 
'Extrae el UUID de empresa_id del prefijo de la ruta del archivo. Formato esperado: {empresa_id}/resto/de/la/ruta';

-- ============================================
-- PASO 3: Política SELECT - Ver archivos de la empresa
-- ============================================

-- Permite a usuarios ver archivos de su empresa
-- Super_Admin puede ver archivos de todas las empresas
CREATE POLICY "Multi-tenant: SELECT archivos por empresa_id"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias' AND (
    -- Super Admin puede ver todos los archivos
    public.is_super_admin()
    OR
    -- Usuario regular solo puede ver archivos de su empresa
    public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
  )
);

COMMENT ON POLICY "Multi-tenant: SELECT archivos por empresa_id" ON storage.objects IS 
'Requirement 2.4: Permite ver archivos solo de la empresa del usuario. Super_Admin puede ver todos.';

-- ============================================
-- PASO 4: Política INSERT - Subir archivos con prefijo empresa_id
-- ============================================

-- Permite a usuarios subir archivos solo con el prefijo de su empresa
-- Valida que la ruta comience con {empresa_id}/
CREATE POLICY "Multi-tenant: INSERT archivos con prefijo empresa_id"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' AND (
    -- Super Admin puede subir archivos con cualquier prefijo de empresa válido
    (
      public.is_super_admin() 
      AND public.extract_empresa_id_from_path(name) IS NOT NULL
    )
    OR
    -- Usuario regular solo puede subir con prefijo de su empresa
    public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
  )
);

COMMENT ON POLICY "Multi-tenant: INSERT archivos con prefijo empresa_id" ON storage.objects IS 
'Requirement 2.5: Valida que los archivos se suban con prefijo empresa_id/ correcto';

-- ============================================
-- PASO 5: Política UPDATE - Actualizar metadatos de archivos
-- ============================================

-- Permite actualizar metadatos de archivos de la empresa
-- Nota: UPDATE en storage.objects típicamente se usa para metadatos, no contenido
CREATE POLICY "Multi-tenant: UPDATE archivos de la empresa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias' AND (
    -- Super Admin puede actualizar archivos de cualquier empresa
    public.is_super_admin()
    OR
    -- Usuario regular solo puede actualizar archivos de su empresa
    public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
  )
)
WITH CHECK (
  bucket_id = 'evidencias' AND (
    -- Super Admin puede actualizar archivos de cualquier empresa
    public.is_super_admin()
    OR
    -- Usuario regular solo puede actualizar archivos de su empresa
    -- Y no puede cambiar el prefijo de empresa_id
    public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
  )
);

COMMENT ON POLICY "Multi-tenant: UPDATE archivos de la empresa" ON storage.objects IS 
'Requirement 2.5: Permite actualizar metadatos de archivos de la empresa del usuario';

-- ============================================
-- PASO 6: Política DELETE - Eliminar archivos de la empresa
-- ============================================

-- Permite eliminar archivos según el rol y empresa
CREATE POLICY "Multi-tenant: DELETE archivos por rol y empresa"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias' AND (
    -- Super Admin puede eliminar archivos de cualquier empresa
    public.is_super_admin()
    OR
    -- Dueño puede eliminar archivos de su empresa
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Dueño'
      AND public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
    )
    OR
    -- Usuario_Completo puede eliminar archivos de su empresa
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Usuario_Completo'
      AND public.extract_empresa_id_from_path(name) = public.get_user_empresa_id()
    )
  )
);

COMMENT ON POLICY "Multi-tenant: DELETE archivos por rol y empresa" ON storage.objects IS 
'Requirement 19.4: Permite eliminar archivos según rol (Dueño, Usuario_Completo) y empresa_id';

-- ============================================
-- PASO 7: Verificación de políticas
-- ============================================

-- Consulta para verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'Multi-tenant:%'
ORDER BY policyname;

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================

-- 1. FORMATO DE RUTAS:
--    Todos los archivos deben seguir el formato: {empresa_id}/carpeta/archivo.ext
--    Ejemplo: 550e8400-e29b-41d4-a716-446655440000/evidencias/foto1.jpg

-- 2. MIGRACIÓN DE ARCHIVOS EXISTENTES:
--    Los archivos existentes sin prefijo empresa_id/ deben migrarse.
--    Ver script: migrate-storage-files.sql (Tarea 10.1)

-- 3. ACTUALIZACIÓN DEL CÓDIGO CLIENTE:
--    El código TypeScript debe actualizarse para incluir empresa_id en las rutas:
--    - src/lib/supabase.ts: Actualizar funciones de upload
--    - src/components/UploaderEvidencia.tsx: Agregar prefijo empresa_id/

-- 4. VALIDACIÓN DE SEGURIDAD:
--    - Requirement 19.4: Las políticas bloquean acceso cross-tenant
--    - Los intentos de acceso no autorizado deben registrarse en audit_logs
--    - Super_Admin tiene acceso completo para gestión y soporte
