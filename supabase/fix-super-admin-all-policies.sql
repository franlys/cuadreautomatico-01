-- =====================================================
-- FIX: Todas las políticas RLS para Super_Admin
-- =====================================================
-- Problema: Super_Admin no tiene permisos completos en tabla empresas
-- Solución: Crear todas las políticas necesarias (SELECT, INSERT, UPDATE, DELETE)
-- =====================================================

-- 1. Verificar/Crear función is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE user_id = auth.uid() 
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar políticas existentes para Super_Admin en empresas
DROP POLICY IF EXISTS "Super_Admin puede ver todas las empresas" ON public.empresas;
DROP POLICY IF EXISTS "Super_Admin puede crear empresas" ON public.empresas;
DROP POLICY IF EXISTS "Super_Admin puede actualizar empresas" ON public.empresas;
DROP POLICY IF EXISTS "Super_Admin puede eliminar empresas" ON public.empresas;

-- 3. Crear política SELECT (leer todas las empresas)
CREATE POLICY "Super_Admin puede ver todas las empresas"
ON public.empresas
FOR SELECT
TO authenticated
USING (is_super_admin());

-- 4. Crear política INSERT (crear empresas)
CREATE POLICY "Super_Admin puede crear empresas"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- 5. Crear política UPDATE (actualizar empresas)
CREATE POLICY "Super_Admin puede actualizar empresas"
ON public.empresas
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 6. Crear política DELETE (eliminar empresas)
CREATE POLICY "Super_Admin puede eliminar empresas"
ON public.empresas
FOR DELETE
TO authenticated
USING (is_super_admin());

-- =====================================================
-- VERIFICACIONES
-- =====================================================

-- Verificar que todas las políticas se crearon
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'empresas' 
AND policyname LIKE '%Super_Admin%'
ORDER BY cmd;

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'empresas';

-- Test: Verificar función is_super_admin
SELECT 
  auth.uid() as user_id,
  is_super_admin() as es_super_admin,
  (SELECT rol FROM perfiles WHERE user_id = auth.uid()) as rol,
  (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()) as empresa_id;

-- Test: Intentar leer empresas
SELECT 
  id,
  nombre,
  nivel_automatizacion,
  activa,
  created_at
FROM empresas
ORDER BY nombre;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Si eres Super_Admin, deberías ver:
-- - 4 políticas creadas (SELECT, INSERT, UPDATE, DELETE)
-- - RLS habilitado (rowsecurity = true)
-- - is_super_admin() = true
-- - rol = 'Super_Admin'
-- - empresa_id = NULL
-- - Lista de empresas (incluyendo "Empresa 1")
-- =====================================================
