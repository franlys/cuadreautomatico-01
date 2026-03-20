-- ============================================
-- Multi-Tenant Platform - Verificación de Migración (SIMPLE)
-- ============================================
-- Versión simplificada sin comandos \echo para SQL Editor
-- ============================================

-- VERIFICACIÓN 1: Existencia de Empresa 1
SELECT 
  '1. Empresa 1' AS verificacion,
  id,
  nombre,
  nivel_automatizacion,
  activa
FROM empresas 
WHERE nombre = 'Empresa 1';

-- VERIFICACIÓN 2: Registros sin empresa_id (debe ser 0 en todas)
SELECT 
  '2. Registros sin empresa_id' AS verificacion,
  'perfiles' AS tabla,
  COUNT(*) AS cantidad
FROM perfiles WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'empleados', COUNT(*) FROM empleados WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'rutas', COUNT(*) FROM rutas WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'conceptos', COUNT(*) FROM conceptos WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'semanas_laborales', COUNT(*) FROM semanas_laborales WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'folders_diarios', COUNT(*) FROM folders_diarios WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'registros', COUNT(*) FROM registros WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'depositos', COUNT(*) FROM depositos WHERE empresa_id IS NULL
UNION ALL
SELECT '2. Registros sin empresa_id', 'evidencias', COUNT(*) FROM evidencias WHERE empresa_id IS NULL
ORDER BY tabla;

-- VERIFICACIÓN 3: Integridad referencial (debe ser 0 en todas)
SELECT 
  '3. Integridad referencial' AS verificacion,
  'Folders sin semana válida' AS problema,
  COUNT(*) AS cantidad
FROM folders_diarios f
LEFT JOIN semanas_laborales s ON f.semana_id = s.id
WHERE s.id IS NULL AND f.semana_id IS NOT NULL
UNION ALL
SELECT '3. Integridad referencial', 'Registros sin folder válido', COUNT(*)
FROM registros r
LEFT JOIN folders_diarios f ON r.folder_diario_id = f.id
WHERE f.id IS NULL
UNION ALL
SELECT '3. Integridad referencial', 'Depósitos sin semana válida', COUNT(*)
FROM depositos d
LEFT JOIN semanas_laborales s ON d.semana_laboral_id = s.id
WHERE s.id IS NULL;

-- VERIFICACIÓN 4: Conteo de registros migrados
SELECT 
  '4. Registros migrados' AS verificacion,
  'perfiles' AS tabla,
  COUNT(*) AS cantidad
FROM perfiles WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'empleados', COUNT(*) FROM empleados WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'rutas', COUNT(*) FROM rutas WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'conceptos', COUNT(*) FROM conceptos WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'semanas_laborales', COUNT(*) FROM semanas_laborales WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'folders_diarios', COUNT(*) FROM folders_diarios WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'registros', COUNT(*) FROM registros WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'depositos', COUNT(*) FROM depositos WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
UNION ALL
SELECT '4. Registros migrados', 'evidencias', COUNT(*) FROM evidencias WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
ORDER BY tabla;

-- VERIFICACIÓN 5: Usuarios por rol
SELECT 
  '5. Usuarios por rol' AS verificacion,
  rol,
  COUNT(*) AS cantidad
FROM perfiles
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
GROUP BY rol
ORDER BY rol;

-- VERIFICACIÓN FINAL: Resumen
DO $$
DECLARE
  v_empresa_id UUID;
  v_registros_sin_empresa INT;
  v_relaciones_rotas INT;
  v_total_problemas INT;
BEGIN
  SELECT id INTO v_empresa_id FROM empresas WHERE nombre = 'Empresa 1';
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: Empresa 1 no existe';
  END IF;
  
  -- Contar registros sin empresa_id
  SELECT 
    (SELECT COUNT(*) FROM perfiles WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM empleados WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM rutas WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM conceptos WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM semanas_laborales WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM folders_diarios WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM registros WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM depositos WHERE empresa_id IS NULL) +
    (SELECT COUNT(*) FROM evidencias WHERE empresa_id IS NULL)
  INTO v_registros_sin_empresa;
  
  -- Contar relaciones rotas
  SELECT 
    (SELECT COUNT(*) FROM folders_diarios f 
     LEFT JOIN semanas_laborales s ON f.semana_id = s.id 
     WHERE s.id IS NULL AND f.semana_id IS NOT NULL) +
    (SELECT COUNT(*) FROM registros r 
     LEFT JOIN folders_diarios f ON r.folder_diario_id = f.id 
     WHERE f.id IS NULL) +
    (SELECT COUNT(*) FROM depositos d 
     LEFT JOIN semanas_laborales s ON d.semana_laboral_id = s.id 
     WHERE s.id IS NULL)
  INTO v_relaciones_rotas;
  
  v_total_problemas := v_registros_sin_empresa + v_relaciones_rotas;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMEN FINAL ===';
  RAISE NOTICE 'Empresa ID: %', v_empresa_id;
  RAISE NOTICE 'Registros sin empresa_id: %', v_registros_sin_empresa;
  RAISE NOTICE 'Relaciones rotas: %', v_relaciones_rotas;
  RAISE NOTICE 'Total de problemas: %', v_total_problemas;
  RAISE NOTICE '';
  
  IF v_total_problemas = 0 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA';
    RAISE NOTICE 'Todos los datos están correctos';
  ELSE
    RAISE EXCEPTION '❌ MIGRACIÓN CON PROBLEMAS: % problemas encontrados', v_total_problemas;
  END IF;
END $$;
