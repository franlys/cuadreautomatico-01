-- =====================================================
-- Verificar estado de RLS y políticas en perfiles
-- =====================================================

-- 1. Ver si RLS está habilitado
SELECT 
  '1. Estado de RLS en perfiles:' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'perfiles';

-- 2. Ver TODAS las políticas en perfiles
SELECT 
  '2. Todas las políticas en perfiles:' as paso,
  policyname,
  cmd as operacion,
  permissive as permisivo,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN qual::text
    WHEN cmd IN ('INSERT', 'UPDATE') THEN with_check::text
    WHEN cmd = 'DELETE' THEN qual::text
    ELSE 'N/A'
  END as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
ORDER BY cmd, policyname;

-- 3. Ver los 2 usuarios que se crearon exitosamente
SELECT 
  '3. Usuarios existentes en Empresa 1:' as paso,
  p.id,
  p.nombre,
  p.rol,
  p.empresa_id,
  p.created_at
FROM perfiles p
WHERE p.empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
ORDER BY p.created_at;

-- 4. Verificar función is_super_admin
SELECT 
  '4. Función is_super_admin existe:' as paso,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_super_admin';

-- =====================================================
-- DIAGNÓSTICO
-- =====================================================
-- Si RLS está habilitado pero no hay política INSERT con is_super_admin(),
-- entonces el problema es que la política se perdió o nunca existió
-- =====================================================
