-- =====================================================
-- FIX: Permisos para Evidencias y Storage
-- =====================================================
-- Deshabilita RLS en tablas de evidencias y otorga permisos
-- =====================================================

-- PASO 1: Deshabilitar RLS en evidencias
ALTER TABLE IF EXISTS evidencias DISABLE ROW LEVEL SECURITY;

-- PASO 2: Otorgar permisos en evidencias
GRANT ALL ON TABLE evidencias TO authenticated;

-- PASO 3: Deshabilitar RLS en otras tablas relacionadas (si existen)
DO $$ 
BEGIN
  -- Deshabilitar RLS en todas las tablas que puedan tener problemas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders_diarios') THEN
    ALTER TABLE folders_diarios DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE folders_diarios TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'semanas_laborales') THEN
    ALTER TABLE semanas_laborales DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE semanas_laborales TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'depositos') THEN
    ALTER TABLE depositos DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE depositos TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hojas_ruta') THEN
    ALTER TABLE hojas_ruta DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE hojas_ruta TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entregas') THEN
    ALTER TABLE entregas DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE entregas TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos') THEN
    ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE productos TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventario') THEN
    ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE inventario TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empleados') THEN
    ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE empleados TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rutas') THEN
    ALTER TABLE rutas DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE rutas TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conceptos') THEN
    ALTER TABLE conceptos DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE conceptos TO authenticated;
  END IF;
END $$;

-- PASO 4: Otorgar permisos en secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PASO 5: Verificar estado de RLS
SELECT 
  '=== ESTADO DE RLS EN TODAS LAS TABLAS ===' as seccion,
  tablename,
  CASE WHEN rowsecurity THEN '✗ HABILITADO' ELSE '✓ DESHABILITADO' END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Todas las tablas deben tener RLS DESHABILITADO
-- Ahora puedes subir evidencias sin problemas
-- =====================================================
