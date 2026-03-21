-- ============================================
-- DIAGNÓSTICO: ¿Por qué Super_Admin no ve empresas?
-- ============================================

-- PASO 1: Verificar que Empresa 1 existe en la tabla
SELECT 
  'Verificación: Empresa 1 existe' as diagnostico,
  id,
  nombre,
  nivel_automatizacion,
  activa,
  created_at
FROM empresas
WHERE nombre = 'Empresa 1';

-- PASO 2: Contar todas las empresas (sin RLS)
SELECT 
  'Total empresas en tabla' as diagnostico,
  COUNT(*) as total
FROM empresas;

-- PASO 3: Verificar políticas RLS en tabla empresas
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

-- PASO 4: Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'empresas';

-- PASO 5: Verificar función is_super_admin()
SELECT 
  'Verificación: Función is_super_admin()' as diagnostico,
  proname as nombre_funcion,
  prosrc as codigo_funcion
FROM pg_proc
WHERE proname = 'is_super_admin';

-- PASO 6: Probar la función is_super_admin() con el usuario actual
SELECT 
  'Test: is_super_admin() para usuario actual' as diagnostico,
  auth.uid() as usuario_id,
  (SELECT rol FROM perfiles WHERE id = auth.uid()) as rol_usuario,
  is_super_admin() as es_super_admin;

-- PASO 7: Intentar SELECT directo como Super_Admin
-- Esto debería funcionar si las políticas RLS están correctas
SELECT 
  'Empresas visibles para Super_Admin' as diagnostico,
  id,
  nombre,
  nivel_automatizacion,
  activa
FROM empresas;

-- ============================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================

-- Si PASO 1 muestra Empresa 1: ✅ La empresa existe
-- Si PASO 1 está vacío: ❌ La migración no creó la empresa

-- Si PASO 2 muestra total > 0: ✅ Hay empresas en la tabla
-- Si PASO 2 muestra total = 0: ❌ No hay empresas

-- Si PASO 3 muestra políticas: ✅ Las políticas RLS existen
-- Si PASO 3 está vacío: ❌ No hay políticas RLS (problema)

-- Si PASO 4 muestra rowsecurity = true: ✅ RLS está habilitado
-- Si PASO 4 muestra rowsecurity = false: ⚠️ RLS deshabilitado

-- Si PASO 5 muestra la función: ✅ La función existe
-- Si PASO 5 está vacío: ❌ La función no existe (problema grave)

-- Si PASO 6 muestra es_super_admin = true: ✅ El usuario es Super_Admin
-- Si PASO 6 muestra es_super_admin = false: ❌ El usuario NO es Super_Admin

-- Si PASO 7 muestra empresas: ✅ Las políticas RLS funcionan
-- Si PASO 7 está vacío: ❌ Las políticas RLS bloquean al Super_Admin
