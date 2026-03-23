-- =====================================================
-- FIX: Eliminar Políticas Duplicadas en Perfiles
-- =====================================================
-- Problema: Hay 2 políticas INSERT que se evalúan con AND
-- Solución: Eliminar la vieja y dejar solo la nueva
-- =====================================================

-- PASO 1: Eliminar TODAS las políticas viejas de perfiles
DROP POLICY IF EXISTS tenant_isolation_select_perfiles ON perfiles;
DROP POLICY IF EXISTS tenant_isolation_insert_perfiles ON perfiles;
DROP POLICY IF EXISTS tenant_isolation_update_perfiles ON perfiles;
DROP POLICY IF EXISTS tenant_isolation_delete_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_select_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_insert_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_update_perfiles ON perfiles;
DROP POLICY IF EXISTS super_admin_delete_perfiles ON perfiles;
DROP POLICY IF EXISTS users_select_own_profile ON perfiles;
DROP POLICY IF EXISTS users_update_own_profile ON perfiles;
DROP POLICY IF EXISTS users_select_same_empresa ON perfiles;

-- PASO 2: Mantener SOLO las políticas nuevas (ya existen, solo verificamos)
-- Si no existen, las creamos

-- SELECT: Super Admin ve todo, usuarios ven su empresa
DROP POLICY IF EXISTS perfiles_select_policy ON perfiles;
CREATE POLICY "perfiles_select_policy"
ON perfiles FOR SELECT
TO authenticated
USING (
  public.is_super_admin() 
  OR empresa_id = public.get_user_empresa_id()
);

-- INSERT: Solo Super Admin puede crear perfiles
DROP POLICY IF EXISTS perfiles_insert_policy ON perfiles;
CREATE POLICY "perfiles_insert_policy"
ON perfiles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin()
);

-- UPDATE: Super Admin actualiza todo, usuarios solo su perfil
DROP POLICY IF EXISTS perfiles_update_policy ON perfiles;
CREATE POLICY "perfiles_update_policy"
ON perfiles FOR UPDATE
TO authenticated
USING (
  public.is_super_admin() 
  OR id = auth.uid()
)
WITH CHECK (
  public.is_super_admin() 
  OR (id = auth.uid() AND empresa_id = public.get_user_empresa_id())
);

-- DELETE: Solo Super Admin puede eliminar
DROP POLICY IF EXISTS perfiles_delete_policy ON perfiles;
CREATE POLICY "perfiles_delete_policy"
ON perfiles FOR DELETE
TO authenticated
USING (
  public.is_super_admin()
);

-- PASO 3: Verificar que solo quedan 4 políticas
SELECT 
  '=== POLÍTICAS FINALES EN PERFILES ===' as seccion,
  policyname,
  cmd as operacion,
  CASE 
    WHEN cmd = 'SELECT' THEN qual::text
    WHEN cmd = 'INSERT' THEN with_check::text
    WHEN cmd = 'UPDATE' THEN 'USING: ' || qual::text || ' | CHECK: ' || with_check::text
    WHEN cmd = 'DELETE' THEN qual::text
  END as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
ORDER BY cmd, policyname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Debe haber EXACTAMENTE 4 políticas:
-- 1. perfiles_select_policy (SELECT)
-- 2. perfiles_insert_policy (INSERT) - Solo is_super_admin()
-- 3. perfiles_update_policy (UPDATE)
-- 4. perfiles_delete_policy (DELETE)
-- =====================================================
