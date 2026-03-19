-- ============================================
-- DESHABILITAR RLS TEMPORALMENTE EN CATÁLOGOS
-- ============================================
-- ADVERTENCIA: Esto deshabilita la seguridad a nivel de fila
-- Solo para diagnóstico temporal

-- Deshabilitar RLS en las tablas de catálogos
ALTER TABLE conceptos DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE rutas DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conceptos', 'empleados', 'rutas');
