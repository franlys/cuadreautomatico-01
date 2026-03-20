-- ============================================
-- Verificación de Políticas RLS Multi-Tenant
-- ============================================
-- Este script verifica que todas las políticas RLS multi-tenant
-- se hayan aplicado correctamente.

-- ============================================
-- 1. Verificar que RLS está habilitado
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros',
    'depositos', 'evidencias'
  )
ORDER BY tablename;

-- ============================================
-- 2. Listar todas las políticas RLS por tabla
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros',
    'depositos', 'evidencias'
  )
ORDER BY tablename, policyname;

-- ============================================
-- 3. Contar políticas por tabla
-- ============================================

SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros',
    'depositos', 'evidencias'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 4. Verificar función helper
-- ============================================

SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name = 'get_user_empresa_id';

-- ============================================
-- 5. Verificar políticas específicas de tenant_isolation
-- ============================================

SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation%'
ORDER BY tablename, policyname;

-- ============================================
-- 6. Resumen de verificación
-- ============================================

WITH policy_counts AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'perfiles', 'empleados', 'rutas', 'conceptos',
      'semanas_laborales', 'folders_diarios', 'registros',
      'depositos', 'evidencias'
    )
  GROUP BY tablename
),
rls_status AS (
  SELECT 
    tablename,
    rowsecurity as rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'perfiles', 'empleados', 'rutas', 'conceptos',
      'semanas_laborales', 'folders_diarios', 'registros',
      'depositos', 'evidencias'
    )
)
SELECT 
  r.tablename,
  r.rls_enabled,
  COALESCE(p.policy_count, 0) as total_policies,
  CASE 
    WHEN r.rls_enabled AND COALESCE(p.policy_count, 0) > 0 THEN '✓ OK'
    WHEN NOT r.rls_enabled THEN '✗ RLS DISABLED'
    WHEN COALESCE(p.policy_count, 0) = 0 THEN '✗ NO POLICIES'
    ELSE '✗ ERROR'
  END as status
FROM rls_status r
LEFT JOIN policy_counts p ON r.tablename = p.tablename
ORDER BY r.tablename;

