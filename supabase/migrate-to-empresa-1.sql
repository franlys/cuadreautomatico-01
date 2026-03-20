-- ============================================
-- Multi-Tenant Platform - Migración de Datos Existentes a "Empresa 1"
-- ============================================
-- Este script migra todos los datos existentes a una empresa predeterminada
-- llamada "Empresa 1" con nivel de automatización parcial.
-- 
-- Requirements: 12.1-12.8
-- Tarea: 10.1
--
-- IMPORTANTE: Este script es idempotente y puede ejecutarse múltiples veces
-- sin causar errores. Usa transacciones para garantizar atomicidad.
-- ============================================

-- Iniciar transacción para garantizar atomicidad
BEGIN;

-- ============================================
-- PASO 1: Crear empresa "Empresa 1" si no existe
-- ============================================
-- Requirement 12.1: Crear empresa "Empresa 1" durante la migración
-- Requirement 12.2: Configurar "Empresa 1" con Automatización_Parcial

DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Verificar si ya existe "Empresa 1"
  SELECT id INTO v_empresa_id FROM empresas WHERE nombre = 'Empresa 1';
  
  IF v_empresa_id IS NULL THEN
    -- Crear "Empresa 1" con nivel parcial
    INSERT INTO empresas (nombre, nivel_automatizacion, activa, limite_storage_mb)
    VALUES ('Empresa 1', 'parcial', TRUE, 5000)
    RETURNING id INTO v_empresa_id;
    
    RAISE NOTICE 'Empresa 1 creada con ID: %', v_empresa_id;
  ELSE
    RAISE NOTICE 'Empresa 1 ya existe con ID: %', v_empresa_id;
  END IF;
  
  -- Guardar el ID en una variable temporal para usar en los siguientes pasos
  CREATE TEMP TABLE IF NOT EXISTS temp_empresa_1 (id UUID);
  DELETE FROM temp_empresa_1;
  INSERT INTO temp_empresa_1 VALUES (v_empresa_id);
END $$;

-- ============================================
-- PASO 2: Migrar usuarios (perfiles) a Empresa 1
-- ============================================
-- Requirement 12.3: Asociar todos los usuarios existentes a "Empresa 1"

DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  -- Obtener ID de Empresa 1
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  -- Actualizar perfiles que no tienen empresa_id asignada
  UPDATE perfiles
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Perfiles migrados: %', v_updated_count;
END $$;

-- ============================================
-- PASO 3: Migrar catálogos a Empresa 1
-- ============================================
-- Requirement 12.4: Asociar todos los datos existentes a "Empresa 1" mediante empresa_id

-- Migrar empleados
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE empleados
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Empleados migrados: %', v_updated_count;
END $$;

-- Migrar rutas
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE rutas
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Rutas migradas: %', v_updated_count;
END $$;

-- Migrar conceptos
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE conceptos
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Conceptos migrados: %', v_updated_count;
END $$;

-- ============================================
-- PASO 4: Migrar datos operacionales a Empresa 1
-- ============================================
-- Requirement 12.5: Mantener todos los registros históricos sin pérdida de datos
-- Requirement 12.6: Mantener todas las relaciones entre tablas existentes

-- Migrar semanas laborales
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE semanas_laborales
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Semanas laborales migradas: %', v_updated_count;
END $$;

-- Migrar folders diarios
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE folders_diarios
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Folders diarios migrados: %', v_updated_count;
END $$;

-- Migrar registros
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE registros
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Registros migrados: %', v_updated_count;
END $$;

-- Migrar depósitos
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE depositos
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Depósitos migrados: %', v_updated_count;
END $$;

-- Migrar evidencias
DO $$
DECLARE
  v_empresa_id UUID;
  v_updated_count INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  UPDATE evidencias
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Evidencias migradas: %', v_updated_count;
END $$;

-- ============================================
-- PASO 5: Validar integridad referencial
-- ============================================
-- Requirement 12.7: Validar integridad referencial después de la migración

DO $$
DECLARE
  v_empresa_id UUID;
  v_perfiles_sin_empresa INT;
  v_empleados_sin_empresa INT;
  v_rutas_sin_empresa INT;
  v_conceptos_sin_empresa INT;
  v_semanas_sin_empresa INT;
  v_folders_sin_empresa INT;
  v_registros_sin_empresa INT;
  v_depositos_sin_empresa INT;
  v_evidencias_sin_empresa INT;
  v_total_sin_empresa INT;
BEGIN
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  -- Contar registros sin empresa_id en cada tabla
  SELECT COUNT(*) INTO v_perfiles_sin_empresa FROM perfiles WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_empleados_sin_empresa FROM empleados WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_rutas_sin_empresa FROM rutas WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_conceptos_sin_empresa FROM conceptos WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_semanas_sin_empresa FROM semanas_laborales WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_folders_sin_empresa FROM folders_diarios WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_registros_sin_empresa FROM registros WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_depositos_sin_empresa FROM depositos WHERE empresa_id IS NULL;
  SELECT COUNT(*) INTO v_evidencias_sin_empresa FROM evidencias WHERE empresa_id IS NULL;
  
  v_total_sin_empresa := v_perfiles_sin_empresa + v_empleados_sin_empresa + v_rutas_sin_empresa + 
                         v_conceptos_sin_empresa + v_semanas_sin_empresa + v_folders_sin_empresa + 
                         v_registros_sin_empresa + v_depositos_sin_empresa + v_evidencias_sin_empresa;
  
  -- Mostrar resultados de validación
  RAISE NOTICE '=== VALIDACIÓN DE INTEGRIDAD ===';
  RAISE NOTICE 'Perfiles sin empresa_id: %', v_perfiles_sin_empresa;
  RAISE NOTICE 'Empleados sin empresa_id: %', v_empleados_sin_empresa;
  RAISE NOTICE 'Rutas sin empresa_id: %', v_rutas_sin_empresa;
  RAISE NOTICE 'Conceptos sin empresa_id: %', v_conceptos_sin_empresa;
  RAISE NOTICE 'Semanas laborales sin empresa_id: %', v_semanas_sin_empresa;
  RAISE NOTICE 'Folders diarios sin empresa_id: %', v_folders_sin_empresa;
  RAISE NOTICE 'Registros sin empresa_id: %', v_registros_sin_empresa;
  RAISE NOTICE 'Depósitos sin empresa_id: %', v_depositos_sin_empresa;
  RAISE NOTICE 'Evidencias sin empresa_id: %', v_evidencias_sin_empresa;
  RAISE NOTICE 'Total de registros sin empresa_id: %', v_total_sin_empresa;
  
  -- Si hay registros sin empresa_id, abortar la transacción
  IF v_total_sin_empresa > 0 THEN
    RAISE EXCEPTION 'VALIDACIÓN FALLIDA: Existen % registros sin empresa_id asignada', v_total_sin_empresa;
  END IF;
  
  RAISE NOTICE '✓ Validación exitosa: Todos los registros tienen empresa_id asignada';
END $$;

-- ============================================
-- PASO 6: Validar relaciones entre tablas
-- ============================================

DO $$
DECLARE
  v_folders_huerfanos INT;
  v_registros_huerfanos INT;
  v_depositos_huerfanos INT;
BEGIN
  -- Validar que todos los folders_diarios tienen semana_laboral válida
  SELECT COUNT(*) INTO v_folders_huerfanos
  FROM folders_diarios f
  LEFT JOIN semanas_laborales s ON f.semana_id = s.id
  WHERE s.id IS NULL AND f.semana_id IS NOT NULL;
  
  -- Validar que todos los registros tienen folder_diario válido
  SELECT COUNT(*) INTO v_registros_huerfanos
  FROM registros r
  LEFT JOIN folders_diarios f ON r.folder_diario_id = f.id
  WHERE f.id IS NULL;
  
  -- Validar que todos los depósitos tienen semana_laboral válida
  SELECT COUNT(*) INTO v_depositos_huerfanos
  FROM depositos d
  LEFT JOIN semanas_laborales s ON d.semana_laboral_id = s.id
  WHERE s.id IS NULL;
  
  RAISE NOTICE '=== VALIDACIÓN DE RELACIONES ===';
  RAISE NOTICE 'Folders sin semana válida: %', v_folders_huerfanos;
  RAISE NOTICE 'Registros sin folder válido: %', v_registros_huerfanos;
  RAISE NOTICE 'Depósitos sin semana válida: %', v_depositos_huerfanos;
  
  IF v_folders_huerfanos > 0 OR v_registros_huerfanos > 0 OR v_depositos_huerfanos > 0 THEN
    RAISE EXCEPTION 'VALIDACIÓN FALLIDA: Existen relaciones rotas entre tablas';
  END IF;
  
  RAISE NOTICE '✓ Validación exitosa: Todas las relaciones están intactas';
END $$;

-- ============================================
-- PASO 7: Resumen de migración
-- ============================================

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
  SELECT id INTO v_empresa_id FROM temp_empresa_1;
  
  -- Contar registros migrados
  SELECT COUNT(*) INTO v_total_perfiles FROM perfiles WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_empleados FROM empleados WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_rutas FROM rutas WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_conceptos FROM conceptos WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_semanas FROM semanas_laborales WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_folders FROM folders_diarios WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_registros FROM registros WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_depositos FROM depositos WHERE empresa_id = v_empresa_id;
  SELECT COUNT(*) INTO v_total_evidencias FROM evidencias WHERE empresa_id = v_empresa_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMEN DE MIGRACIÓN ===';
  RAISE NOTICE 'Empresa ID: %', v_empresa_id;
  RAISE NOTICE 'Nombre: Empresa 1';
  RAISE NOTICE 'Nivel: Automatización Parcial';
  RAISE NOTICE '';
  RAISE NOTICE 'Registros migrados:';
  RAISE NOTICE '  - Perfiles: %', v_total_perfiles;
  RAISE NOTICE '  - Empleados: %', v_total_empleados;
  RAISE NOTICE '  - Rutas: %', v_total_rutas;
  RAISE NOTICE '  - Conceptos: %', v_total_conceptos;
  RAISE NOTICE '  - Semanas laborales: %', v_total_semanas;
  RAISE NOTICE '  - Folders diarios: %', v_total_folders;
  RAISE NOTICE '  - Registros: %', v_total_registros;
  RAISE NOTICE '  - Depósitos: %', v_total_depositos;
  RAISE NOTICE '  - Evidencias: %', v_total_evidencias;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Migración completada exitosamente';
END $$;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS temp_empresa_1;

-- Confirmar transacción
COMMIT;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script es idempotente: puede ejecutarse múltiples veces sin causar errores
-- 2. Usa transacciones para garantizar atomicidad (todo o nada)
-- 3. Si alguna validación falla, se hace ROLLBACK automático
-- 4. Los mensajes NOTICE muestran el progreso de la migración
-- 5. Después de ejecutar este script, ejecutar verificar-migracion.sql
-- 6. Si algo sale mal, ejecutar rollback-empresa-1.sql
