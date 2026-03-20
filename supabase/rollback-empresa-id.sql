-- ============================================
-- Rollback Script: Revertir empresa_id
-- ============================================
-- Este script revierte todos los cambios realizados en la tarea 1.2
-- ADVERTENCIA: Usar solo si es absolutamente necesario

-- ============================================
-- PASO 1: Eliminar columnas empresa_id
-- ============================================

ALTER TABLE perfiles DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE empleados DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE rutas DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE conceptos DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE semanas_laborales DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE folders_diarios DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE registros DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE depositos DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE evidencias DROP COLUMN IF EXISTS empresa_id;

-- ============================================
-- PASO 2: Restaurar constraints de unicidad originales
-- ============================================

-- Empleados: restaurar constraint original
ALTER TABLE empleados DROP CONSTRAINT IF EXISTS empleados_nombre_apellido_empresa_key;
ALTER TABLE empleados ADD CONSTRAINT empleados_nombre_apellido_key 
  UNIQUE(nombre, apellido);

-- Rutas: restaurar constraint original
ALTER TABLE rutas DROP CONSTRAINT IF EXISTS rutas_nombre_empresa_key;
ALTER TABLE rutas ADD CONSTRAINT rutas_nombre_key 
  UNIQUE(nombre);

-- Conceptos: restaurar constraint original
ALTER TABLE conceptos DROP CONSTRAINT IF EXISTS conceptos_descripcion_empresa_key;
ALTER TABLE conceptos ADD CONSTRAINT conceptos_descripcion_key 
  UNIQUE(descripcion);

-- Folders diarios: restaurar constraint original
ALTER TABLE folders_diarios DROP CONSTRAINT IF EXISTS folders_diarios_fecha_empresa_key;
ALTER TABLE folders_diarios ADD CONSTRAINT folders_diarios_fecha_laboral_key 
  UNIQUE(fecha_laboral);

-- Semanas laborales: restaurar constraint original
ALTER TABLE semanas_laborales DROP CONSTRAINT IF EXISTS semanas_laborales_fechas_empresa_key;
ALTER TABLE semanas_laborales ADD CONSTRAINT semanas_laborales_fecha_inicio_fecha_fin_key 
  UNIQUE(fecha_inicio, fecha_fin);

-- ============================================
-- NOTA: Los índices se eliminan automáticamente
-- ============================================
-- Al eliminar las columnas empresa_id, PostgreSQL elimina automáticamente
-- los índices asociados (idx_*_empresa).

-- ============================================
-- VERIFICACIÓN POST-ROLLBACK
-- ============================================

SELECT 'Verificando que empresa_id fue eliminada...' AS paso;

SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name = 'empresa_id'
  AND table_schema = 'public'
  AND table_name IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  );

-- Si el resultado está vacío, el rollback fue exitoso

SELECT 'Verificando constraints restaurados...' AS paso;

SELECT 
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('empleados', 'rutas', 'conceptos', 'folders_diarios', 'semanas_laborales')
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Columnas empresa_id: 0 (todas eliminadas)
-- Constraints originales: restaurados sin empresa_id

