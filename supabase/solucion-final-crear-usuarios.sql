-- =====================================================
-- SOLUCIÓN FINAL: Crear usuarios como Super Admin
-- =====================================================

-- PASO 1: Eliminar usuarios huérfanos (sin perfil)
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN perfiles p ON p.id = u.id
  WHERE p.id IS NULL
);

-- PASO 2: Recrear política INSERT para Super Admin
DROP POLICY IF EXISTS super_admin_insert_perfiles ON perfiles;

CREATE POLICY super_admin_insert_perfiles
ON perfiles
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- PASO 3: Verificar que todo está correcto
SELECT 
  'Resultado:' as paso,
  'Usuarios sin perfil eliminados y política creada' as mensaje;

-- Ver política creada
SELECT 
  'Política INSERT:' as info,
  policyname,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
  AND policyname = 'super_admin_insert_perfiles';

-- =====================================================
-- AHORA PUEDES CREAR USUARIOS DESDE LA APLICACIÓN
-- =====================================================
