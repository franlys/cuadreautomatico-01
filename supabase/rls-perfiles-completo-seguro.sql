-- =====================================================
-- RLS COMPLETO Y SEGURO para perfiles
-- =====================================================
-- Super Admin: Acceso total a todo
-- Usuarios normales: Solo su propio perfil
-- =====================================================

-- PASO 1: Habilitar RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar todas las políticas existentes
DROP POLICY IF EXISTS super_admin_select_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_insert_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_update_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_delete_perfiles ON perfiles;
DROP POLICY IF EXISTS users_select_own_profile ON perfiles;
DROP POLICY IF EXISTS users_update_own_profile ON perfiles;

-- PASO 3: Políticas para SELECT (leer)
-- Super Admin puede ver todos los perfiles
CREATE POLICY super_admin_select_perfiles
ON perfiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- Usuarios normales solo ven su propio perfil
CREATE POLICY users_select_own_profile
ON perfiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- PASO 4: Políticas para INSERT (crear)
-- Solo Super Admin puede crear perfiles
CREATE POLICY super_admin_insert_perfiles
ON perfiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- PASO 5: Políticas para UPDATE (actualizar)
-- Super Admin puede actualizar cualquier perfil
CREATE POLICY super_admin_update_perfiles
ON perfiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- Usuarios normales solo pueden actualizar su propio perfil
CREATE POLICY users_update_own_profile
ON perfiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- PASO 6: Políticas para DELETE (eliminar)
-- Solo Super Admin puede eliminar perfiles
CREATE POLICY super_admin_delete_perfiles
ON perfiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- PASO 7: Verificar políticas creadas
SELECT 
  'Políticas RLS en perfiles:' as resultado,
  policyname,
  cmd as operacion,
  CASE 
    WHEN policyname LIKE 'super_admin%' THEN 'Super Admin'
    WHEN policyname LIKE 'users%' THEN 'Usuarios normales'
    ELSE 'Otra'
  END as aplica_a
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
ORDER BY cmd, policyname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Debe haber 6 políticas:
-- - super_admin_select_perfiles (SELECT, Super Admin)
-- - users_select_own_profile (SELECT, Usuarios normales)
-- - super_admin_insert_perfiles (INSERT, Super Admin)
-- - super_admin_update_perfiles (UPDATE, Super Admin)
-- - users_update_own_profile (UPDATE, Usuarios normales)
-- - super_admin_delete_perfiles (DELETE, Super Admin)
-- =====================================================
