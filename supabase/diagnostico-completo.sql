-- ============================================
-- DIAGNÓSTICO COMPLETO DE USUARIO Y PERMISOS
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- para diagnosticar problemas de permisos

-- 1. VERIFICAR USUARIO EN AUTH
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'franlysgonzalez@cuadre.com';

-- 2. VERIFICAR PERFIL EN TABLA PERFILES
SELECT 
  id,
  email,
  nombre,
  rol,
  intentos_fallidos,
  bloqueado_hasta,
  created_at,
  updated_at
FROM perfiles
WHERE id = 'c596b581-3d13-456e-8340-1d2ca460f61a';

-- 3. VERIFICAR SI EL PERFIL EXISTE PERO CON OTRO EMAIL
SELECT 
  id,
  email,
  nombre,
  rol
FROM perfiles
WHERE email ILIKE '%franlys%';

-- 4. VERIFICAR POLÍTICAS RLS PARA USUARIO_COMPLETO EN TABLA PERFILES
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
WHERE tablename = 'perfiles'
  AND policyname ILIKE '%usuario_completo%';

-- 5. VERIFICAR POLÍTICAS RLS PARA USUARIO_COMPLETO EN TABLA REGISTROS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'registros'
  AND policyname ILIKE '%usuario_completo%';

-- 6. VERIFICAR SI RLS ESTÁ HABILITADO EN LAS TABLAS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('perfiles', 'registros', 'folders_diarios', 'depositos', 'catalogos', 'evidencias');

-- 7. PROBAR ACCESO DIRECTO A PERFILES (SIMULAR QUERY DEL FRONTEND)
-- Esta query simula lo que hace el frontend en authStore.ts
SELECT *
FROM perfiles
WHERE id = 'c596b581-3d13-456e-8340-1d2ca460f61a';

-- 8. VERIFICAR GRANTS EN TABLA PERFILES
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'perfiles'
  AND grantee IN ('authenticated', 'anon', 'service_role');

-- ============================================
-- SOLUCIÓN RÁPIDA: CREAR PERFIL SI NO EXISTE
-- ============================================
-- Si el perfil no existe, ejecutar esto:

-- INSERT INTO perfiles (id, email, nombre, rol)
-- VALUES (
--   'c596b581-3d13-456e-8340-1d2ca460f61a',
--   'franlysgonzalez@cuadre.com',
--   'Franlys González',
--   'Usuario_Completo'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET 
--   rol = 'Usuario_Completo',
--   email = 'franlysgonzalez@cuadre.com',
--   updated_at = NOW();

-- ============================================
-- VERIFICAR DESPUÉS DE CREAR PERFIL
-- ============================================
-- SELECT * FROM perfiles WHERE id = 'c596b581-3d13-456e-8340-1d2ca460f61a';
