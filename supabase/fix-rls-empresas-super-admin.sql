-- =====================================================
-- FIX RLS EMPRESAS - Super Admin debe ver todas
-- =====================================================
-- Problema: Super Admin no puede ver empresas desde el navegador
-- Causa: RLS bloqueando SELECT en empresas
-- Solución: Política más permisiva para empresas
-- =====================================================

-- PASO 1: Eliminar políticas viejas de empresas
DROP POLICY IF EXISTS empresas_select_policy ON empresas;
DROP POLICY IF EXISTS empresas_insert_policy ON empresas;
DROP POLICY IF EXISTS empresas_update_policy ON empresas;
DROP POLICY IF EXISTS empresas_delete_policy ON empresas;
DROP POLICY IF EXISTS super_admin_select_empresas ON empresas;
DROP POLICY IF EXISTS super_admin_insert_empresas ON empresas;
DROP POLICY IF EXISTS super_admin_update_empresas ON empresas;
DROP POLICY IF EXISTS super_admin_delete_empresas ON empresas;
DROP POLICY IF EXISTS users_select_own_empresa ON empresas;
DROP POLICY IF EXISTS tenant_isolation_select_empresas ON empresas;
DROP POLICY IF EXISTS tenant_isolation_insert_empresas ON empresas;
DROP POLICY IF EXISTS tenant_isolation_update_empresas ON empresas;
DROP POLICY IF EXISTS tenant_isolation_delete_empresas ON empresas;

-- PASO 2: Crear políticas nuevas más permisivas

-- SELECT: Todos los usuarios autenticados pueden ver empresas
-- (Super Admin ve todas, usuarios normales ven solo la suya por lógica de app)
CREATE POLICY "empresas_select_policy"
ON empresas FOR SELECT
TO authenticated
USING (
  -- Super Admin ve todas
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
  OR
  -- Usuarios normales ven su empresa
  id IN (
    SELECT empresa_id FROM perfiles
    WHERE id = auth.uid()
  )
);

-- INSERT: Solo Super Admin puede crear empresas
CREATE POLICY "empresas_insert_policy"
ON empresas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- UPDATE: Solo Super Admin puede actualizar empresas
CREATE POLICY "empresas_update_policy"
ON empresas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- DELETE: Solo Super Admin puede eliminar empresas
CREATE POLICY "empresas_delete_policy"
ON empresas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
    AND rol = 'Super_Admin'
  )
);

-- PASO 3: Verificar políticas creadas
SELECT 
  '=== POLÍTICAS EN EMPRESAS ===' as seccion,
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
  AND tablename = 'empresas'
ORDER BY cmd, policyname;

-- PASO 4: Probar que Super Admin puede ver empresas
SELECT 
  '=== TEST: Super Admin ve empresas ===' as seccion,
  id,
  nombre,
  activa
FROM empresas
WHERE nombre = 'Empresa 1';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 1. Debe haber 4 políticas en empresas
-- 2. Debe mostrar "Empresa 1" en el test
-- =====================================================
