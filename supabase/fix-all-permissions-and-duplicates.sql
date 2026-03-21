-- =====================================================
-- FIX COMPLETO: Permisos y Duplicados
-- =====================================================
-- Este script soluciona:
-- 1. Elimina empresa duplicada sin usuarios
-- 2. Otorga permisos a TODAS las tablas
-- 3. Verifica el estado final
-- =====================================================

-- =====================================================
-- PASO 1: Eliminar empresa duplicada
-- =====================================================

-- Ver empresas duplicadas
SELECT 
  '1. Empresas antes de limpiar:' as paso,
  id,
  nombre,
  created_at,
  (SELECT COUNT(*) FROM perfiles WHERE empresa_id = empresas.id) as usuarios
FROM empresas
WHERE nombre = 'Empresa 1'
ORDER BY created_at;

-- Eliminar la empresa "Empresa 1" más reciente (sin usuarios)
-- Solo si tiene 0 usuarios
DELETE FROM empresas 
WHERE nombre = 'Empresa 1'
  AND id IN (
    SELECT e.id 
    FROM empresas e
    LEFT JOIN perfiles p ON p.empresa_id = e.id
    WHERE e.nombre = 'Empresa 1'
    GROUP BY e.id
    HAVING COUNT(p.id) = 0
  );

-- Verificar que solo queda una
SELECT 
  '2. Empresas después de limpiar:' as paso,
  id,
  nombre,
  created_at,
  (SELECT COUNT(*) FROM perfiles WHERE empresa_id = empresas.id) as usuarios
FROM empresas
WHERE nombre = 'Empresa 1';

-- =====================================================
-- PASO 2: Otorgar permisos a TODAS las tablas
-- =====================================================

-- Tablas principales
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.empresas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.perfiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.empleados TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rutas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conceptos TO authenticated;

-- Tablas de operación
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.semanas_laborales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.folders_diarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.depositos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidencias TO authenticated;

-- Tablas de auditoría
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO authenticated;

-- Tablas de automatización (solo si existen - nivel completa)
-- Comentadas porque pueden no existir si la empresa tiene nivel parcial
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hojas_ruta TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.entregas_hoja_ruta TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pagos_hoja_ruta TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gastos_hoja_ruta TO authenticated;

-- =====================================================
-- PASO 3: Verificar permisos otorgados
-- =====================================================

SELECT 
  '3. Permisos en tablas críticas:' as paso,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permisos
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND table_name IN (
    'empresas', 'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros', 'depositos', 'evidencias',
    'audit_logs'
  )
GROUP BY table_name
ORDER BY table_name;

-- =====================================================
-- PASO 4: Verificar estado de RLS
-- =====================================================

SELECT 
  '4. Estado de RLS:' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'empresas', 'perfiles', 'empleados', 'rutas', 'conceptos',
    'semanas_laborales', 'folders_diarios', 'registros', 'depositos', 'evidencias',
    'audit_logs'
  )
ORDER BY tablename;

-- =====================================================
-- PASO 5: Verificar función is_super_admin
-- =====================================================

SELECT 
  '5. Función is_super_admin:' as paso,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_super_admin';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Paso 1-2: Solo debe quedar UNA "Empresa 1" con 2 usuarios
-- Paso 3: Todas las tablas deben tener SELECT, INSERT, UPDATE, DELETE
-- Paso 4: RLS debe estar DISABLED en empresas, ENABLED en las demás
-- Paso 5: Función debe usar "WHERE id = auth.uid()"
-- =====================================================
