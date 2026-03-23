-- =====================================================
-- FIX: Permitir a Super Admin crear usuarios en cualquier empresa
-- =====================================================

-- Ver políticas actuales en perfiles
SELECT 
  '1. Políticas actuales en perfiles:' as paso,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
ORDER BY policyname;

-- Crear o reemplazar política de INSERT para Super Admin
DROP POLICY IF EXISTS super_admin_insert_perfiles ON perfiles;

CREATE POLICY super_admin_insert_perfiles
ON perfiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Super Admin puede insertar perfiles en cualquier empresa
  is_super_admin()
  OR
  -- Usuarios normales solo pueden insertar en su propia empresa (si aplica)
  empresa_id = (SELECT empresa_id FROM perfiles WHERE id = auth.uid())
);

-- Verificar que la política se creó correctamente
SELECT 
  '2. Política INSERT creada:' as paso,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
  AND policyname = 'super_admin_insert_perfiles';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- La política debe permitir:
-- 1. Super Admin (is_super_admin() = true) puede insertar perfiles con cualquier empresa_id
-- 2. Usuarios normales solo pueden insertar en su propia empresa
-- =====================================================
