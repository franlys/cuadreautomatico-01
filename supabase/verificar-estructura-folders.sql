-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLA folders_diarios
-- =====================================================

-- Ver todas las columnas de folders_diarios
SELECT 
  '=== COLUMNAS DE folders_diarios ===' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'folders_diarios'
ORDER BY ordinal_position;

-- Ver las foreign keys de folders_diarios
SELECT 
  '=== FOREIGN KEYS DE folders_diarios ===' as seccion,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'folders_diarios';

-- Ver si existe la tabla semanas_laborales
SELECT 
  '=== TABLA semanas_laborales ===' as seccion,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'semanas_laborales';

-- Ver folders_diarios existentes (si hay)
SELECT 
  '=== FOLDERS DIARIOS EXISTENTES ===' as seccion,
  *
FROM folders_diarios
LIMIT 5;
