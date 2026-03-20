-- ============================================
-- Test de Políticas RLS Super_Admin
-- ============================================
-- Este script prueba que las políticas RLS para Super_Admin funcionan correctamente.
-- IMPORTANTE: Ejecutar después de aplicar multi-tenant-rls-super-admin.sql

-- ============================================
-- PREPARACIÓN: Crear datos de prueba
-- ============================================

-- Crear dos empresas de prueba
INSERT INTO empresas (id, nombre, nivel_automatizacion, activa)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Empresa Test 1', 'parcial', true),
  ('22222222-2222-2222-2222-222222222222', 'Empresa Test 2', 'completa', true)
ON CONFLICT (id) DO NOTHING;

-- Crear usuarios de prueba en auth.users (simulado)
-- NOTA: En producción, estos usuarios deben crearse en Supabase Auth

-- Crear perfiles de prueba
INSERT INTO perfiles (id, nombre, rol, empresa_id)
VALUES 
  -- Super_Admin (sin empresa)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Super Admin Test', 'Super_Admin', NULL),
  -- Usuario normal de Empresa 1
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Usuario Empresa 1', 'Dueño', '11111111-1111-1111-1111-111111111111'),
  -- Usuario normal de Empresa 2
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Usuario Empresa 2', 'Dueño', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Crear empleados de prueba en ambas empresas
INSERT INTO empleados (id, nombre, apellido, empresa_id, activo)
VALUES 
  ('e1111111-1111-1111-1111-111111111111', 'Juan', 'Pérez', '11111111-1111-1111-1111-111111111111', true),
  ('e2222222-2222-2222-2222-222222222222', 'María', 'García', '22222222-2222-2222-2222-222222222222', true)
ON CONFLICT (id) DO NOTHING;

-- Crear rutas de prueba en ambas empresas
INSERT INTO rutas (id, nombre, empresa_id, activo)
VALUES 
  ('r1111111-1111-1111-1111-111111111111', 'Ruta A', '11111111-1111-1111-1111-111111111111', true),
  ('r2222222-2222-2222-2222-222222222222', 'Ruta B', '22222222-2222-2222-2222-222222222222', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST 1: Verificar función is_super_admin()
-- ============================================

-- Simular contexto de Super_Admin
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 
  'TEST 1: is_super_admin()' as test,
  CASE 
    WHEN auth.is_super_admin() = true 
    THEN '✓ PASS - Función retorna TRUE para Super_Admin'
    ELSE '✗ FAIL - Función retorna FALSE para Super_Admin'
  END as resultado;

-- Simular contexto de usuario normal
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT 
  'TEST 1b: is_super_admin() usuario normal' as test,
  CASE 
    WHEN auth.is_super_admin() = false 
    THEN '✓ PASS - Función retorna FALSE para usuario normal'
    ELSE '✗ FAIL - Función retorna TRUE para usuario normal'
  END as resultado;

-- ============================================
-- TEST 2: Super_Admin puede ver todas las empresas
-- ============================================

-- Simular contexto de Super_Admin
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 
  'TEST 2: Super_Admin ve todas las empresas' as test,
  CASE 
    WHEN COUNT(*) >= 2 
    THEN '✓ PASS - Super_Admin ve ' || COUNT(*)::text || ' empresas'
    ELSE '✗ FAIL - Super_Admin solo ve ' || COUNT(*)::text || ' empresas'
  END as resultado
FROM empresas;

-- ============================================
-- TEST 3: Super_Admin puede ver perfiles de todas las empresas
-- ============================================

SELECT 
  'TEST 3: Super_Admin ve perfiles cross-tenant' as test,
  CASE 
    WHEN COUNT(DISTINCT empresa_id) >= 2 
    THEN '✓ PASS - Super_Admin ve perfiles de ' || COUNT(DISTINCT empresa_id)::text || ' empresas'
    ELSE '✗ FAIL - Super_Admin solo ve perfiles de ' || COUNT(DISTINCT empresa_id)::text || ' empresas'
  END as resultado
FROM perfiles
WHERE empresa_id IS NOT NULL;

-- ============================================
-- TEST 4: Super_Admin puede ver empleados de todas las empresas
-- ============================================

SELECT 
  'TEST 4: Super_Admin ve empleados cross-tenant' as test,
  CASE 
    WHEN COUNT(DISTINCT empresa_id) >= 2 
    THEN '✓ PASS - Super_Admin ve empleados de ' || COUNT(DISTINCT empresa_id)::text || ' empresas'
    ELSE '✗ FAIL - Super_Admin solo ve empleados de ' || COUNT(DISTINCT empresa_id)::text || ' empresas'
  END as resultado
FROM empleados
WHERE empresa_id IS NOT NULL;

-- ============================================
-- TEST 5: Super_Admin puede crear empresa
-- ============================================

BEGIN;
  INSERT INTO empresas (nombre, nivel_automatizacion)
  VALUES ('Empresa Test 3', 'parcial')
  RETURNING 
    'TEST 5: Super_Admin crea empresa' as test,
    '✓ PASS - Empresa creada con ID: ' || id::text as resultado;
ROLLBACK;

-- ============================================
-- TEST 6: Super_Admin puede actualizar empresa
-- ============================================

BEGIN;
  UPDATE empresas
  SET nombre = 'Empresa Test 1 Modificada'
  WHERE id = '11111111-1111-1111-1111-111111111111'
  RETURNING 
    'TEST 6: Super_Admin actualiza empresa' as test,
    '✓ PASS - Empresa actualizada: ' || nombre as resultado;
ROLLBACK;

-- ============================================
-- TEST 7: Usuario normal NO puede ver empresas de otros
-- ============================================

-- Simular contexto de usuario de Empresa 1
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT 
  'TEST 7: Usuario normal aislamiento' as test,
  CASE 
    WHEN COUNT(*) = 0 
    THEN '✓ PASS - Usuario normal no ve tabla empresas (esperado)'
    ELSE '✗ FAIL - Usuario normal ve ' || COUNT(*)::text || ' empresas (no debería)'
  END as resultado
FROM empresas;

-- ============================================
-- TEST 8: Usuario normal solo ve empleados de su empresa
-- ============================================

SELECT 
  'TEST 8: Usuario normal ve solo su empresa' as test,
  CASE 
    WHEN COUNT(*) = 1 AND COUNT(DISTINCT empresa_id) = 1
    THEN '✓ PASS - Usuario ve solo empleados de su empresa'
    ELSE '✗ FAIL - Usuario ve empleados de ' || COUNT(DISTINCT empresa_id)::text || ' empresas'
  END as resultado
FROM empleados;

-- ============================================
-- TEST 9: Super_Admin puede crear usuario en cualquier empresa
-- ============================================

-- Simular contexto de Super_Admin
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

BEGIN;
  INSERT INTO perfiles (id, nombre, rol, empresa_id)
  VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Usuario Test Empresa 2',
    'Usuario_Completo',
    '22222222-2222-2222-2222-222222222222'
  )
  RETURNING 
    'TEST 9: Super_Admin crea usuario en otra empresa' as test,
    '✓ PASS - Usuario creado en empresa: ' || empresa_id::text as resultado;
ROLLBACK;

-- ============================================
-- TEST 10: Super_Admin puede eliminar datos de cualquier empresa
-- ============================================

BEGIN;
  DELETE FROM empleados
  WHERE id = 'e1111111-1111-1111-1111-111111111111'
  RETURNING 
    'TEST 10: Super_Admin elimina datos cross-tenant' as test,
    '✓ PASS - Empleado eliminado: ' || nombre || ' ' || apellido as resultado;
ROLLBACK;

-- ============================================
-- RESUMEN DE TESTS
-- ============================================

SELECT 
  '===========================================' as separador
UNION ALL
SELECT 'RESUMEN DE TESTS'
UNION ALL
SELECT '==========================================='
UNION ALL
SELECT 'Todos los tests deben mostrar ✓ PASS'
UNION ALL
SELECT 'Si algún test muestra ✗ FAIL, revisar políticas RLS'
UNION ALL
SELECT '===========================================';

-- ============================================
-- LIMPIEZA: Eliminar datos de prueba
-- ============================================

-- Descomentar para limpiar datos de prueba después de ejecutar tests
-- DELETE FROM perfiles WHERE id IN (
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
--   'cccccccc-cccc-cccc-cccc-cccccccccccc'
-- );

-- DELETE FROM empleados WHERE id IN (
--   'e1111111-1111-1111-1111-111111111111',
--   'e2222222-2222-2222-2222-222222222222'
-- );

-- DELETE FROM rutas WHERE id IN (
--   'r1111111-1111-1111-1111-111111111111',
--   'r2222222-2222-2222-2222-222222222222'
-- );

-- DELETE FROM empresas WHERE id IN (
--   '11111111-1111-1111-1111-111111111111',
--   '22222222-2222-2222-2222-222222222222'
-- );

-- ============================================
-- NOTAS
-- ============================================
-- 1. Este script usa UUIDs fijos para facilitar testing
-- 2. En producción, usar gen_random_uuid()
-- 3. Los tests usan transacciones con ROLLBACK para no modificar datos
-- 4. Simular contexto de usuario con SET LOCAL "request.jwt.claims"
-- 5. En Supabase real, el contexto viene del JWT del usuario autenticado
