-- =====================================================
-- FIX V2: Política INSERT simplificada para Super Admin
-- =====================================================

-- Eliminar política anterior
DROP POLICY IF EXISTS super_admin_insert_perfiles ON perfiles;

-- Crear política más simple: Solo Super Admin puede insertar perfiles
CREATE POLICY super_admin_insert_perfiles
ON perfiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo Super Admin puede crear usuarios
  is_super_admin()
);

-- Verificar que la política se creó correctamente
SELECT 
  'Política INSERT creada:' as resultado,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
  AND policyname = 'super_admin_insert_perfiles';

-- =====================================================
-- EXPLICACIÓN
-- =====================================================
-- Esta política permite SOLO al Super Admin crear usuarios
-- en cualquier empresa. Los usuarios normales NO pueden
-- crear otros usuarios (eso se maneja desde la aplicación
-- con el Super Admin).
-- =====================================================
