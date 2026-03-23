-- =====================================================
-- FIX: Renombrar semana_id a semana_laboral_id
-- =====================================================
-- El código usa semana_laboral_id pero la BD tiene semana_id
-- Solución: Renombrar la columna en la BD
-- =====================================================

-- PASO 1: Renombrar columna en folders_diarios
ALTER TABLE folders_diarios 
RENAME COLUMN semana_id TO semana_laboral_id;

-- PASO 2: Verificar que se renombró correctamente
SELECT 
  '=== COLUMNAS DE folders_diarios (después del cambio) ===' as seccion,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'folders_diarios'
  AND column_name LIKE '%semana%'
ORDER BY ordinal_position;

-- PASO 3: Verificar foreign keys
SELECT 
  '=== FOREIGN KEYS DE folders_diarios ===' as seccion,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'folders_diarios'
  AND kcu.column_name LIKE '%semana%';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- La columna ahora se llama semana_laboral_id
-- El código funcionará correctamente
-- =====================================================
