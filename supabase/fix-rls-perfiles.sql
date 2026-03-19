-- ============================================
-- Fix RLS para tabla perfiles
-- ============================================

-- Eliminar la política existente
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;

-- Crear nueva política más permisiva
-- Permite que cualquier usuario autenticado lea su propio perfil
CREATE POLICY "Users can view own profile"
  ON perfiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'perfiles';
