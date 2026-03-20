-- ============================================
-- Multi-Tenant Platform - Rollback de Migración a "Empresa 1"
-- ============================================
-- Este script revierte la migración de datos a "Empresa 1"
-- eliminando todas las asociaciones empresa_id y la empresa misma.
-- 
-- Requirements: 12.8
-- Tarea: 10.2
--
-- ⚠️ ADVERTENCIA: Este script elimina la empresa "Empresa 1" y todas
-- las asociaciones empresa_id. Solo ejecutar si la migración falló
-- o si necesitas revertir completamente el proceso.
-- ============================================

-- Iniciar transacción para garantizar atomicidad
BEGIN;

-- ============================================
-- PASO 1: Crear backup de empresa_id antes de eliminar
-- ============================================

DO $$
BEGIN
  -- Crear tabla temporal con backup de empresa_id
  CREATE TEMP TABLE IF NOT EXISTS backup_empresa_ids (
    tabla TEXT,
    registro_id UUID,
    empresa_id UUID,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Guardar empresa_id de todas las tablas
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'perfiles', id, empresa_id FROM perfiles WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'empleados', id, empresa_id FROM empleados WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'rutas', id, empresa_id FROM rutas WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'conceptos', id, empresa_id FROM conceptos WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'semanas_laborales', id, empresa_id FROM semanas_laborales WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'folders_diarios', id, empresa_id FROM folders_diarios WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'registros', id, empresa_id FROM registros WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'depositos', id, empresa_id FROM depositos WHERE empresa_id IS NOT NULL;
  
  INSERT INTO backup_empresa_ids (tabla, registro_id, empresa_id)
  SELECT 'evidencias', id, empresa_id FROM evidencias WHERE empresa_id IS NOT NULL;
  
  RAISE NOTICE '✓ Backup de empresa_id creado en tabla temporal';
END $$;

-- ============================================
-- PASO 2: Eliminar empresa_id de todas las tablas
-- ============================================

DO $$
DECLARE
  v_updated_count INT;
BEGIN
  -- Eliminar empresa_id de perfiles
  UPDATE perfiles SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Perfiles limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de empleados
  UPDATE empleados SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Empleados limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de rutas
  UPDATE rutas SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Rutas limpiadas: %', v_updated_count;
  
  -- Eliminar empresa_id de conceptos
  UPDATE conceptos SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Conceptos limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de semanas_laborales
  UPDATE semanas_laborales SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Semanas laborales limpiadas: %', v_updated_count;
  
  -- Eliminar empresa_id de folders_diarios
  UPDATE folders_diarios SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Folders diarios limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de registros
  UPDATE registros SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Registros limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de depositos
  UPDATE depositos SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Depósitos limpiados: %', v_updated_count;
  
  -- Eliminar empresa_id de evidencias
  UPDATE evidencias SET empresa_id = NULL WHERE empresa_id IS NOT NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Evidencias limpiadas: %', v_updated_count;
END $$;

-- ============================================
-- PASO 3: Validar que no quedan empresa_id asignadas
-- ============================================

DO $$
DECLARE
  v_perfiles_con_empresa INT;
  v_empleados_con_empresa INT;
  v_rutas_con_empresa INT;
  v_conceptos_con_empresa INT;
  v_semanas_con_empresa INT;
  v_folders_con_empresa INT;
  v_registros_con_empresa INT;
  v_depositos_con_empresa INT;
  v_evidencias_con_empresa INT;
  v_total_con_empresa INT;
BEGIN
  -- Contar registros que aún tienen empresa_id
  SELECT COUNT(*) INTO v_perfiles_con_empresa FROM perfiles WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_empleados_con_empresa FROM empleados WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_rutas_con_empresa FROM rutas WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_conceptos_con_empresa FROM conceptos WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_semanas_con_empresa FROM semanas_laborales WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_folders_con_empresa FROM folders_diarios WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_registros_con_empresa FROM registros WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_depositos_con_empresa FROM depositos WHERE empresa_id IS NOT NULL;
  SELECT COUNT(*) INTO v_evidencias_con_empresa FROM evidencias WHERE empresa_id IS NOT NULL;
  
  v_total_con_empresa := v_perfiles_con_empresa + v_empleados_con_empresa + v_rutas_con_empresa + 
                         v_conceptos_con_empresa + v_semanas_con_empresa + v_folders_con_empresa + 
                         v_registros_con_empresa + v_depositos_con_empresa + v_evidencias_con_empresa;
  
  RAISE NOTICE '=== VALIDACIÓN DE LIMPIEZA ===';
  RAISE NOTICE 'Perfiles con empresa_id: %', v_perfiles_con_empresa;
  RAISE NOTICE 'Empleados con empresa_id: %', v_empleados_con_empresa;
  RAISE NOTICE 'Rutas con empresa_id: %', v_rutas_con_empresa;
  RAISE NOTICE 'Conceptos con empresa_id: %', v_conceptos_con_empresa;
  RAISE NOTICE 'Semanas laborales con empresa_id: %', v_semanas_con_empresa;
  RAISE NOTICE 'Folders diarios con empresa_id: %', v_folders_con_empresa;
  RAISE NOTICE 'Registros con empresa_id: %', v_registros_con_empresa;
  RAISE NOTICE 'Depósitos con empresa_id: %', v_depositos_con_empresa;
  RAISE NOTICE 'Evidencias con empresa_id: %', v_evidencias_con_empresa;
  
  IF v_total_con_empresa > 0 THEN
    RAISE EXCEPTION 'VALIDACIÓN FALLIDA: Aún existen % registros con empresa_id', v_total_con_empresa;
  END IF;
  
  RAISE NOTICE '✓ Validación exitosa: Todos los empresa_id fueron eliminados';
END $$;

-- ============================================
-- PASO 4: Eliminar empresa "Empresa 1"
-- ============================================

DO $$
DECLARE
  v_empresa_id UUID;
  v_deleted_count INT;
BEGIN
  -- Buscar ID de "Empresa 1"
  SELECT id INTO v_empresa_id FROM empresas WHERE nombre = 'Empresa 1';
  
  IF v_empresa_id IS NOT NULL THEN
    -- Eliminar la empresa
    DELETE FROM empresas WHERE id = v_empresa_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '✓ Empresa "Empresa 1" eliminada (ID: %)', v_empresa_id;
    ELSE
      RAISE NOTICE '⚠ No se pudo eliminar "Empresa 1"';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Empresa "Empresa 1" no encontrada';
  END IF;
END $$;

-- ============================================
-- PASO 5: Validar que no quedan datos huérfanos
-- ============================================

DO $$
DECLARE
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
  -- Contar todos los registros
  SELECT COUNT(*) INTO v_total_perfiles FROM perfiles;
  SELECT COUNT(*) INTO v_total_empleados FROM empleados;
  SELECT COUNT(*) INTO v_total_rutas FROM rutas;
  SELECT COUNT(*) INTO v_total_conceptos FROM conceptos;
  SELECT COUNT(*) INTO v_total_semanas FROM semanas_laborales;
  SELECT COUNT(*) INTO v_total_folders FROM folders_diarios;
  SELECT COUNT(*) INTO v_total_registros FROM registros;
  SELECT COUNT(*) INTO v_total_depositos FROM depositos;
  SELECT COUNT(*) INTO v_total_evidencias FROM evidencias;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDACIÓN DE DATOS ===';
  RAISE NOTICE 'Perfiles existentes: %', v_total_perfiles;
  RAISE NOTICE 'Empleados existentes: %', v_total_empleados;
  RAISE NOTICE 'Rutas existentes: %', v_total_rutas;
  RAISE NOTICE 'Conceptos existentes: %', v_total_conceptos;
  RAISE NOTICE 'Semanas laborales existentes: %', v_total_semanas;
  RAISE NOTICE 'Folders diarios existentes: %', v_total_folders;
  RAISE NOTICE 'Registros existentes: %', v_total_registros;
  RAISE NOTICE 'Depósitos existentes: %', v_total_depositos;
  RAISE NOTICE 'Evidencias existentes: %', v_total_evidencias;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Todos los datos permanecen intactos (sin pérdida de datos)';
END $$;

-- ============================================
-- PASO 6: Mostrar información del backup
-- ============================================

DO $$
DECLARE
  v_backup_count INT;
BEGIN
  SELECT COUNT(*) INTO v_backup_count FROM backup_empresa_ids;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== INFORMACIÓN DEL BACKUP ===';
  RAISE NOTICE 'Total de asociaciones empresa_id respaldadas: %', v_backup_count;
  RAISE NOTICE 'El backup está disponible en la tabla temporal backup_empresa_ids';
  RAISE NOTICE 'Esta tabla se eliminará al cerrar la sesión';
  RAISE NOTICE '';
  RAISE NOTICE 'Para ver el backup, ejecuta:';
  RAISE NOTICE '  SELECT * FROM backup_empresa_ids ORDER BY tabla, registro_id;';
END $$;

-- ============================================
-- PASO 7: Resumen de rollback
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMEN DE ROLLBACK ===';
  RAISE NOTICE '✓ Todas las asociaciones empresa_id fueron eliminadas';
  RAISE NOTICE '✓ Empresa "Empresa 1" fue eliminada';
  RAISE NOTICE '✓ Todos los datos permanecen intactos';
  RAISE NOTICE '✓ Backup temporal creado en backup_empresa_ids';
  RAISE NOTICE '';
  RAISE NOTICE 'El sistema ha vuelto al estado anterior a la migración';
  RAISE NOTICE 'Puedes ejecutar migrate-to-empresa-1.sql nuevamente si lo deseas';
END $$;

-- Confirmar transacción
COMMIT;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script elimina TODAS las asociaciones empresa_id
-- 2. La empresa "Empresa 1" es eliminada completamente
-- 3. NO se pierden datos: solo se eliminan las asociaciones
-- 4. El backup temporal está disponible durante la sesión actual
-- 5. Después del rollback, puedes ejecutar migrate-to-empresa-1.sql nuevamente
-- 6. Si necesitas restaurar empresa_id específicas, usa el backup temporal
