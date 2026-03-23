-- =====================================================
-- VERIFICAR SUPER ADMIN Y SESIÓN
-- =====================================================
-- Este script verifica que tu usuario Super Admin esté
-- correctamente configurado y que las funciones funcionen
-- =====================================================

-- 1. Ver tu perfil de Super Admin
SELECT 
  '1. Tu perfil Super Admin:' as paso,
  id,
  nombre,
  rol,
  empresa_id,
  created_at
FROM perfiles
WHERE rol = 'Super_Admin'
ORDER BY created_at;

-- 2. Verificar que la función is_super_admin() existe
SELECT 
  '2. Función is_super_admin():' as paso,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_super_admin';

-- 3. Ver el código de la función is_super_admin()
SELECT 
  '3. Código de is_super_admin():' as paso,
  pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'is_super_admin'
  AND pronamespace = 'public'::regnamespace;

-- 4. Verificar que Empresa 1 existe
SELECT 
  '4. Empresa 1:' as paso,
  id,
  nombre,
  activa,
  nivel_automatizacion
FROM empresas
WHERE nombre = 'Empresa 1';

-- 5. Ver TODAS las empresas (sin filtro RLS desde SQL Editor)
SELECT 
  '5. Todas las empresas:' as paso,
  id,
  nombre,
  activa
FROM empresas
ORDER BY created_at;

-- 6. Verificar estado de RLS en tablas críticas
SELECT 
  '6. Estado RLS:' as paso,
  tablename,
  CASE WHEN rowsecurity THEN 'HABILITADO' ELSE 'DESHABILITADO' END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('empresas', 'perfiles', 'registros')
ORDER BY tablename;

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
-- Ejecuta este script y muéstrame TODOS los resultados
-- Necesito ver:
-- 1. Tu UUID de Super Admin
-- 2. Si la función existe
-- 3. El código de la función
-- 4. Si Empresa 1 existe
-- 5. Todas las empresas
-- 6. Estado de RLS
-- =====================================================
