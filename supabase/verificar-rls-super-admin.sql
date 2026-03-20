-- ============================================
-- Verificación de Políticas RLS Super_Admin
-- ============================================
-- Este script verifica que las políticas RLS para Super_Admin
-- funcionan correctamente y permiten acceso cross-tenant.

-- ============================================
-- PASO 1: Verificar función is_super_admin()
-- ============================================

-- Verificar que la función existe
SELECT 
  proname as nombre_funcion,
  pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'is_super_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- ============================================
-- PASO 2: Verificar políticas en tabla empresas
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'empresas'
ORDER BY policyname;

-- ============================================
-- PASO 3: Verificar políticas Super_Admin en perfiles
-- ============================================

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE 'super_admin%' THEN 'Super_Admin'
    WHEN policyname LIKE 'tenant_isolation%' THEN 'Usuarios normales'
    ELSE 'Otra'
  END as tipo_politica
FROM pg_policies
WHERE tablename = 'perfiles'
ORDER BY tipo_politica, cmd, policyname;

-- ============================================
-- PASO 4: Contar políticas por tabla
-- ============================================

SELECT 
  tablename,
  COUNT(*) FILTER (WHERE policyname LIKE 'super_admin%') as politicas_super_admin,
  COUNT(*) FILTER (WHERE policyname LIKE 'tenant_isolation%') as politicas_tenant,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- PASO 5: Verificar que RLS está habilitado
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias', 'audit_logs'
  )
ORDER BY tablename;

-- ============================================
-- PASO 6: Verificar políticas en todas las tablas multi-tenant
-- ============================================

WITH tablas_multi_tenant AS (
  SELECT unnest(ARRAY[
    'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros',
    'depositos', 'evidencias'
  ]) as tabla
)
SELECT 
  t.tabla,
  COUNT(p.policyname) FILTER (WHERE p.policyname LIKE 'super_admin%') as tiene_politicas_super_admin,
  COUNT(p.policyname) FILTER (WHERE p.policyname LIKE 'tenant_isolation%') as tiene_politicas_tenant,
  CASE 
    WHEN COUNT(p.policyname) FILTER (WHERE p.policyname LIKE 'super_admin%') >= 4 
      AND COUNT(p.policyname) FILTER (WHERE p.policyname LIKE 'tenant_isolation%') >= 4
    THEN '✓ Completo'
    ELSE '✗ Incompleto'
  END as estado
FROM tablas_multi_tenant t
LEFT JOIN pg_policies p ON p.tablename = t.tabla
GROUP BY t.tabla
ORDER BY t.tabla;

-- ============================================
-- PASO 7: Verificar estructura de políticas Super_Admin
-- ============================================

-- Verificar que todas las políticas Super_Admin usan is_super_admin()
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%is_super_admin()%' OR with_check LIKE '%is_super_admin()%' 
    THEN '✓ Usa is_super_admin()'
    ELSE '✗ No usa is_super_admin()'
  END as validacion
FROM pg_policies
WHERE policyname LIKE 'super_admin%'
ORDER BY tablename, cmd;

-- ============================================
-- PASO 8: Resumen de verificación
-- ============================================

SELECT 
  'Función is_super_admin()' as componente,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_super_admin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) 
    THEN '✓ Existe'
    ELSE '✗ No existe'
  END as estado
UNION ALL
SELECT 
  'RLS en tabla empresas' as componente,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'empresas' AND rowsecurity = true
    )
    THEN '✓ Habilitado'
    ELSE '✗ Deshabilitado'
  END as estado
UNION ALL
SELECT 
  'Políticas Super_Admin' as componente,
  CASE 
    WHEN COUNT(*) >= 40 -- Al menos 4 políticas por cada una de las 10+ tablas
    THEN '✓ ' || COUNT(*)::text || ' políticas creadas'
    ELSE '✗ Solo ' || COUNT(*)::text || ' políticas (esperadas >= 40)'
  END as estado
FROM pg_policies
WHERE policyname LIKE 'super_admin%'
UNION ALL
SELECT 
  'Políticas Tenant Isolation' as componente,
  CASE 
    WHEN COUNT(*) >= 36 -- Al menos 4 políticas por cada una de las 9 tablas
    THEN '✓ ' || COUNT(*)::text || ' políticas creadas'
    ELSE '✗ Solo ' || COUNT(*)::text || ' políticas (esperadas >= 36)'
  END as estado
FROM pg_policies
WHERE policyname LIKE 'tenant_isolation%';

-- ============================================
-- NOTAS
-- ============================================
-- Este script verifica:
-- 1. Que la función is_super_admin() existe y está correctamente definida
-- 2. Que las políticas Super_Admin están creadas en todas las tablas
-- 3. Que las políticas Tenant Isolation coexisten con las de Super_Admin
-- 4. Que RLS está habilitado en todas las tablas relevantes
-- 5. Que las políticas usan correctamente is_super_admin()
--
-- Para ejecutar este script:
-- 1. Conectarse a la base de datos de Supabase
-- 2. Ejecutar el script completo
-- 3. Revisar los resultados de cada sección
-- 4. El resumen final debe mostrar ✓ en todos los componentes
