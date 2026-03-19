-- ============================================
-- DIAGNÓSTICO RLS PARA CATÁLOGOS
-- ============================================

-- 1. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conceptos', 'empleados', 'rutas');

-- 2. Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conceptos', 'empleados', 'rutas');

-- 3. Verificar políticas existentes para Usuario_Completo
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('conceptos', 'empleados', 'rutas')
  AND policyname ILIKE '%usuario_completo%'
ORDER BY tablename, cmd;

-- 4. Verificar el perfil del usuario
SELECT 
  id,
  email,
  nombre,
  rol
FROM perfiles
WHERE id = 'c596b581-3d13-456e-8340-1d2ca460f61a';

-- 5. Probar acceso directo como el usuario (simular)
-- Esta query simula lo que hace el frontend
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "c596b581-3d13-456e-8340-1d2ca460f61a"}';

SELECT * FROM conceptos LIMIT 1;
SELECT * FROM empleados LIMIT 1;
SELECT * FROM rutas LIMIT 1;

RESET role;
