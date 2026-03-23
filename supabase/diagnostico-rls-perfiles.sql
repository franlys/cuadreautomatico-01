-- =====================================================
-- DIAGNÓSTICO RLS - Perfiles
-- =====================================================
-- Verifica por qué falla la creación de perfiles
-- =====================================================

-- 1. Verificar que el Super Admin existe y tiene el rol correcto
SELECT 
  '1. Super Admin actual:' as paso,
  id,
  nombre,
  rol,
  empresa_id
FROM perfiles
WHERE rol = 'Super_Admin';

-- 2. Verificar que la función is_super_admin() funciona
SELECT 
  '2. Función is_super_admin():' as paso,
  public.is_super_admin() as es_super_admin;

-- 3. Verificar estado de RLS en perfiles
SELECT 
  '3. Estado RLS en perfiles:' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'perfiles';

-- 4. Ver TODAS las políticas en perfiles
SELECT 
  '4. Políticas en perfiles:' as paso,
  policyname,
  cmd as operacion,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
ORDER BY cmd, policyname;

-- 5. Verificar que Empresa 1 existe y está activa
SELECT 
  '5. Empresa 1:' as paso,
  id,
  nombre,
  activa
FROM empresas
WHERE nombre = 'Empresa 1';

-- 6. Probar INSERT simulado (sin ejecutar realmente)
-- Esto muestra si la política permitiría el INSERT
SELECT 
  '6. Test de política INSERT:' as paso,
  CASE 
    WHEN public.is_super_admin() THEN 'Super Admin puede insertar ✓'
    ELSE 'Super Admin NO puede insertar ✗'
  END as resultado;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 1. Debe mostrar tu usuario con rol Super_Admin
-- 2. Debe retornar TRUE
-- 3. RLS debe estar HABILITADO (true)
-- 4. Debe haber política "perfiles_insert_policy" para INSERT
-- 5. Debe mostrar Empresa 1 con activa=true
-- 6. Debe decir "Super Admin puede insertar ✓"
-- =====================================================
