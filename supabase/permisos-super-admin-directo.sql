-- =====================================================
-- PERMISOS DIRECTOS PARA SUPER ADMIN
-- =====================================================
-- Otorga permisos completos al Super Admin en TODAS las tablas
-- Sin depender de RLS ni políticas
-- =====================================================

-- PASO 1: Verificar que RLS está deshabilitado en perfiles
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;

-- PASO 2: Otorgar permisos DIRECTOS al rol authenticated en TODAS las tablas
GRANT ALL ON TABLE empresas TO authenticated;
GRANT ALL ON TABLE perfiles TO authenticated;
GRANT ALL ON TABLE registros TO authenticated;
GRANT ALL ON TABLE hojas_ruta TO authenticated;
GRANT ALL ON TABLE entregas TO authenticated;
GRANT ALL ON TABLE productos TO authenticated;
GRANT ALL ON TABLE inventario TO authenticated;
GRANT ALL ON TABLE audit_logs TO authenticated;

-- PASO 3: Otorgar permisos en las secuencias (para IDs autoincrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PASO 4: Verificar permisos otorgados
SELECT 
  'Permisos en tablas principales:' as resultado,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
  AND table_schema = 'public'
  AND table_name IN ('empresas', 'perfiles', 'registros', 'hojas_ruta', 'entregas', 'productos', 'inventario', 'audit_logs')
ORDER BY table_name, privilege_type;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Debes ver permisos SELECT, INSERT, UPDATE, DELETE, etc.
-- para el rol 'authenticated' en todas las tablas
-- =====================================================

-- NOTA IMPORTANTE: Con RLS deshabilitado y estos permisos,
-- CUALQUIER usuario autenticado puede hacer CUALQUIER cosa.
-- Esto es INSEGURO pero funcional para desarrollo.
-- En producción, deberías re-habilitar RLS con políticas correctas.
-- =====================================================
