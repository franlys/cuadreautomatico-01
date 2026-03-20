-- ============================================
-- Multi-Tenant Platform - Verificación de Migración
-- ============================================
-- Este script verifica que la migración a "Empresa 1" se completó
-- correctamente y que todos los datos mantienen su integridad.
-- 
-- Requirements: 12.7
-- Tarea: 10.1
--
-- Ejecutar este script después de migrate-to-empresa-1.sql
-- ============================================

\echo ''
\echo '=== VERIFICACIÓN DE MIGRACIÓN A EMPRESA 1 ==='
\echo ''

-- ============================================
-- VERIFICACIÓN 1: Existencia de Empresa 1
-- ============================================

\echo '1. Verificando existencia de Empresa 1...'

SELECT 
  id,
  nombre,
  nivel_automatizacion,
  activa,
  limite_storage_mb,
  created_at
FROM empresas 
WHERE nombre = 'Empresa 1';

\echo ''

-- ============================================
-- VERIFICACIÓN 2: Conteo de registros por tabla
-- ============================================

\echo '2. Conteo de registros migrados a Empresa 1...'

DO $$
DECLARE
  v_empresa_id UUID;
  v_total_perfiles INT;
  v_total_empleados INT;
  v_total_rutas INT;
  v_total_conceptos INT;
  v_total_semanas INT;
  v_total_folders INT;
  v_total_registros INT;
  v_total_depositos INT;
  v_total_evidencias INT;
BEGIN
  -- Obtener ID de Empresa 1
  SELECT id INTO v_empresa_id FROM empresas WHERE nombre = 'Empresa 1';
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: Empresa 1 no existe';
  END IF;
  
  -- Contar registros por tabla
  SELECT COUNT(*) INTO v_total_perfiles FROM perfiles WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_empleados FROM empleados WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_rutas FROM rutas WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_conceptos FROM conceptos WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_semanas FROM semanas_laborales WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_folders FROM folders_diarios WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_registros FROM registros WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_depositos FROM depositos WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_evidencias FROM evidencias WHERE empresa_id = v_empresa_id;
  
  RAISE NOTICE 'Perfiles: %', v_total_perfiles;
  RAISE NOTICE 'Empleados: %', v_total_empleados;
  RAISE NOTICE 'Rutas: %', v_total_rutas;
  RAISE NOTICE 'Conceptos: %', v_total_conceptos;
  RAISE NOTICE 'Semanas laborales: %', v_total_semanas;
  RAISE NOTICE 'Folders diarios: %', v_total_folders;
  RAISE NOTICE 'Registros: %', v_total_registros;
  RAISE NOTICE 'Depósitos: %', v_total_depositos;
  RAISE NOTICE 'Evidencias: %', v_total_evidencias;
END $$;

\echo ''

-- ============================================
-- VERIFICACIÓN 3: Registros sin empresa_id
-- ============================================

\echo '3. Verificando registros sin empresa_id (debe ser 0 en todas)...'

SELECT 
  'perfiles' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM perfiles 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'empleados' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM empleados 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'rutas' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM rutas 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'conceptos' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM conceptos 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'semanas_laborales' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM semanas_laborales 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'folders_diarios' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM folders_diarios 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'registros' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM registros 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'depositos' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM depositos 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
  'evidencias' AS tabla,
  COUNT(*) AS sin_empresa_id
FROM evidencias 
WHERE empresa_id IS NULL

ORDER BY tabla;

\echo ''

-- ============================================
-- VERIFICACIÓN 4: Integridad referencial
-- ============================================

\echo '4. Verificando integridad referencial...'

-- Folders sin semana válida
SELECT 
  'Folders sin semana válida' AS verificacion,
  COUNT(*) AS cantidad
FROM folders_diarios f
LEFT JOIN semanas_laborales s ON f.semana_id = s.id
WHERE s.id IS NULL AND f.semana_id IS NOT NULL

UNION ALL

-- Registros sin folder válido
SELECT 
  'Registros sin folder válido' AS verificacion,
  COUNT(*) AS cantidad
FROM registros r
LEFT JOIN folders_diarios f ON r.folder_diario_id = f.id
WHERE f.id IS NULL

UNION ALL

-- Depósitos sin semana válida
SELECT 
  'Depósitos sin semana válida' AS verificacion,
  COUNT(*) AS cantidad
FROM depositos d
LEFT JOIN semanas_laborales s ON d.semana_laboral_id = s.id
WHERE s.id IS NULL

UNION ALL

-- Evidencias sin registro o depósito válido
SELECT 
  'Evidencias huérfanas' AS verificacion,
  COUNT(*) AS cantidad
FROM evidencias e
LEFT JOIN registros r ON e.registro_id = r.id
LEFT JOIN depositos d ON e.deposito_id = d.id
WHERE r.id IS NULL AND d.id IS NULL;

\echo ''

-- ============================================
-- VERIFICACIÓN 5: Consistencia de empresa_id
-- ============================================

\echo '5. Verificando consistencia de empresa_id entre tablas relacionadas...'

-- Registros con empresa_id diferente a su folder
SELECT 
  'Registros con empresa_id inconsistente' AS verificacion,
  COUNT(*) AS cantidad
FROM registros r
INNER JOIN folders_diarios f ON r.folder_diario_id = f.id
WHERE r.empresa_id != f.empresa_id

UNION ALL

-- Folders con empresa_id diferente a su semana
SELECT 
  'Folders con empresa_id inconsistente' AS verificacion,
  COUNT(*) AS cantidad
FROM folders_diarios f
INNER JOIN semanas_laborales s ON f.semana_id = s.id
WHERE f.empresa_id != s.empresa_id

UNION ALL

-- Depósitos con empresa_id diferente a su semana
SELECT 
  'Depósitos con empresa_id inconsistente' AS verificacion,
  COUNT(*) AS cantidad
FROM depositos d
INNER JOIN semanas_laborales s ON d.semana_laboral_id = s.id
WHERE d.empresa_id != s.empresa_id

UNION ALL

-- Evidencias de registros con empresa_id diferente
SELECT 
  'Evidencias con empresa_id inconsistente (registros)' AS verificacion,
  COUNT(*) AS cantidad
FROM evidencias e
INNER JOIN registros r ON e.registro_id = r.id
WHERE e.empresa_id != r.empresa_id

UNION ALL

-- Evidencias de depósitos con empresa_id diferente
SELECT 
  'Evidencias con empresa_id inconsistente (depósitos)' AS verificacion,
  COUNT(*) AS cantidad
FROM evidencias e
INNER JOIN depositos d ON e.deposito_id = d.id
WHERE e.empresa_id != d.empresa_id;

\echo ''

-- ============================================
-- VERIFICACIÓN 6: Totales y balances
-- ============================================

\echo '6. Verificando totales y balances...'

SELECT 
  'Semanas laborales' AS entidad,
  COUNT(*) AS total,
  SUM(total_ingresos) AS suma_ingresos,
  SUM(total_egresos) AS suma_egresos,
  SUM(balance_neto) AS suma_balance,
  SUM(total_depositos) AS suma_depositos
FROM semanas_laborales
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')

UNION ALL

SELECT 
  'Folders diarios' AS entidad,
  COUNT(*) AS total,
  SUM(total_ingresos) AS suma_ingresos,
  SUM(total_egresos) AS suma_egresos,
  SUM(balance_diario) AS suma_balance,
  NULL AS suma_depositos
FROM folders_diarios
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1');

\echo ''

-- ============================================
-- VERIFICACIÓN 7: Usuarios y perfiles
-- ============================================

\echo '7. Verificando usuarios y perfiles...'

SELECT 
  rol,
  COUNT(*) AS cantidad
FROM perfiles
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
GROUP BY rol
ORDER BY rol;

\echo ''

-- ============================================
-- VERIFICACIÓN 8: Catálogos
-- ============================================

\echo '8. Verificando catálogos...'

SELECT 
  'Empleados activos' AS catalogo,
  COUNT(*) AS cantidad
FROM empleados
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = TRUE

UNION ALL

SELECT 
  'Empleados inactivos' AS catalogo,
  COUNT(*) AS cantidad
FROM empleados
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = FALSE

UNION ALL

SELECT 
  'Rutas activas' AS catalogo,
  COUNT(*) AS cantidad
FROM rutas
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = TRUE

UNION ALL

SELECT 
  'Rutas inactivas' AS catalogo,
  COUNT(*) AS cantidad
FROM rutas
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = FALSE

UNION ALL

SELECT 
  'Conceptos activos' AS catalogo,
  COUNT(*) AS cantidad
FROM conceptos
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = TRUE

UNION ALL

SELECT 
  'Conceptos inactivos' AS catalogo,
  COUNT(*) AS cantidad
FROM conceptos
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1')
  AND activo = FALSE;

\echo ''

-- ============================================
-- VERIFICACIÓN 9: Evidencias y storage
-- ============================================

\echo '9. Verificando evidencias...'

SELECT 
  COUNT(*) AS total_evidencias,
  COUNT(DISTINCT storage_path) AS paths_unicos,
  SUM(tamano_bytes) AS tamano_total_bytes,
  ROUND(SUM(tamano_bytes)::NUMERIC / 1024 / 1024, 2) AS tamano_total_mb
FROM evidencias
WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1');

\echo ''

-- ============================================
-- VERIFICACIÓN 10: Resumen final
-- ============================================

\echo '10. Resumen final de verificación...'

DO $$
DECLARE
  v_empresa_id UUID;
  v_registros_sin_empresa INT;
  v_relaciones_rotas INT;
  v_inconsistencias INT;
  v_total_problemas INT;
BEGIN
  -- Obtener ID de Empresa 1
  SELECT id INTO v_empresa_id FROM empresas WHERE nombre = 'Empresa 1';
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION '❌ ERROR CRÍTICO: Empresa 1 no existe';
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
  
  -- Contar inconsistencias de empresa_id
  SELECT 
    (SELECT COUNT(*) FROM registros r 
     INNER JOIN folders_diarios f ON r.folder_diario_id = f.id 
     WHERE r.empresa_id != f.empresa_id) +
    (SELECT COUNT(*) FROM folders_diarios f 
     INNER JOIN semanas_laborales s ON f.semana_id = s.id 
     WHERE f.empresa_id != s.empresa_id) +
    (SELECT COUNT(*) FROM depositos d 
     INNER JOIN semanas_laborales s ON d.semana_laboral_id = s.id 
     WHERE d.empresa_id != s.empresa_id)
  INTO v_inconsistencias;
  
  v_total_problemas := v_registros_sin_empresa + v_relaciones_rotas + v_inconsistencias;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMEN DE VERIFICACIÓN ===';
  RAISE NOTICE 'Empresa ID: %', v_empresa_id;
  RAISE NOTICE 'Registros sin empresa_id: %', v_registros_sin_empresa;
  RAISE NOTICE 'Relaciones rotas: %', v_relaciones_rotas;
  RAISE NOTICE 'Inconsistencias de empresa_id: %', v_inconsistencias;
  RAISE NOTICE 'Total de problemas: %', v_total_problemas;
  RAISE NOTICE '';
  
  IF v_total_problemas = 0 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA: Todos los datos están correctos';
    RAISE NOTICE '✅ Integridad referencial verificada';
    RAISE NOTICE '✅ Consistencia de empresa_id verificada';
    RAISE NOTICE '';
    RAISE NOTICE 'La migración a Empresa 1 se completó correctamente.';
    RAISE NOTICE 'Todos los usuarios existentes pueden acceder al sistema.';
  ELSE
    RAISE EXCEPTION '❌ MIGRACIÓN CON PROBLEMAS: Se encontraron % problemas', v_total_problemas;
  END IF;
END $$;

\echo ''
\echo '=== FIN DE VERIFICACIÓN ==='
\echo ''
