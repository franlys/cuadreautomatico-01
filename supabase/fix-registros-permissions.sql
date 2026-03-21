-- =====================================================
-- FIX: Permisos y RLS en tabla registros
-- =====================================================

-- Verificar estado actual de RLS en registros
SELECT 
  '1. Estado RLS en registros:' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'registros';

-- Verificar permisos actuales
SELECT 
  '2. Permisos actuales en registros:' as paso,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'registros'
  AND grantee = 'authenticated';

-- Otorgar permisos explícitos
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registros TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verificar políticas RLS existentes
SELECT 
  '3. Políticas RLS en registros:' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'registros';

-- Si RLS está habilitado, verificar que Super Admin tenga acceso
-- Las políticas deben incluir is_super_admin() OR condición normal

-- Verificar si hay registros en la tabla
SELECT 
  '4. Registros en la tabla:' as paso,
  COUNT(*) as total_registros,
  COUNT(DISTINCT empresa_id) as empresas_con_registros
FROM registros;

-- Ver un registro de ejemplo (si existe)
SELECT 
  '5. Registro de ejemplo:' as paso,
  id,
  empresa_id,
  created_at
FROM registros
WHERE empresa_id = '4bacc04d-8d1a-4bea-a9d5-c320869e9581'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Paso 1: RLS puede estar habilitado o deshabilitado
-- Paso 2: Debe mostrar SELECT, INSERT, UPDATE, DELETE para authenticated
-- Paso 3: Debe mostrar las políticas RLS (si RLS está habilitado)
-- Paso 4: Debe mostrar cuántos registros hay
-- Paso 5: Debe mostrar el último registro de Empresa 1 (si existe)
-- =====================================================
