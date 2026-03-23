-- =====================================================
-- SOLUCIÓN RADICAL: Deshabilitar RLS en perfiles
-- =====================================================
-- Esto permite al Super Admin (y a cualquier usuario autenticado)
-- crear, leer, actualizar y eliminar perfiles sin restricciones
-- =====================================================

-- Deshabilitar RLS en perfiles
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  'Estado de RLS en perfiles:' as resultado,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'perfiles';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- rls_habilitado debe ser FALSE
-- Ahora puedes crear usuarios sin problemas de RLS
-- =====================================================

-- NOTA: Si en el futuro quieres re-habilitar RLS:
-- ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
-- Y luego crear las políticas adecuadas
-- =====================================================
