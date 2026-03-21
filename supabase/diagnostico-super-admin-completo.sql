-- =====================================================
-- DIAGNÓSTICO COMPLETO: Super Admin y Empresas
-- =====================================================

-- 1. Verificar estructura de tabla perfiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'perfiles'
ORDER BY ordinal_position;

-- 2. Verificar tu usuario Super Admin
SELECT 
  id,
  user_id,
  nombre,
  rol,
  empresa_id,
  activo,
  created_at
FROM perfiles
WHERE user_id = auth.uid();

-- 3. Verificar función is_super_admin actual
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_super_admin';

-- 4. Test: Ejecutar función is_super_admin
SELECT is_super_admin() as resultado;

-- 5. Verificar políticas en tabla empresas
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
ORDER BY cmd, policyname;

-- 6. Verificar que RLS está habilitado en empresas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'empresas';

-- 7. Verificar que existe Empresa 1
SELECT 
  id,
  nombre,
  nivel_automatizacion,
  activa,
  created_at
FROM empresas;

-- 8. Contar usuarios por empresa
SELECT 
  COALESCE(empresa_id::text, 'NULL (Super_Admin)') as empresa,
  COUNT(*) as total_usuarios,
  STRING_AGG(DISTINCT rol, ', ') as roles
FROM perfiles
GROUP BY empresa_id
ORDER BY empresa_id NULLS FIRST;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 1. Tabla perfiles debe tener columnas: id, user_id, nombre, rol, empresa_id
-- 2. Tu usuario debe tener: rol='Super_Admin', empresa_id=NULL
-- 3. Función is_super_admin debe usar 'user_id = auth.uid()'
-- 4. is_super_admin() debe retornar TRUE
-- 5. Debe haber 4 políticas para Super_Admin en empresas (SELECT, INSERT, UPDATE, DELETE)
-- 6. RLS debe estar habilitado (rowsecurity = true)
-- 7. Debe existir "Empresa 1"
-- 8. Debe haber usuarios en empresa_id=1 y un Super_Admin con empresa_id=NULL
-- =====================================================
