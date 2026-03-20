-- ============================================
-- Script de Verificación: empresa_id en Tablas
-- ============================================
-- Este script verifica que la columna empresa_id se haya agregado correctamente
-- a todas las tablas existentes junto con sus índices.

-- ============================================
-- VERIFICAR COLUMNAS empresa_id
-- ============================================

SELECT 
  'Verificando columnas empresa_id...' AS paso;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE column_name = 'empresa_id'
  AND table_schema = 'public'
  AND table_name IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  )
ORDER BY table_name;

-- ============================================
-- VERIFICAR FOREIGN KEYS a empresas
-- ============================================

SELECT 
  'Verificando foreign keys a empresas...' AS paso;

SELECT 
  tc.table_name,
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
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'empresa_id'
  AND tc.table_name IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  )
ORDER BY tc.table_name;

-- ============================================
-- VERIFICAR ÍNDICES en empresa_id
-- ============================================

SELECT 
  'Verificando índices en empresa_id...' AS paso;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%empresa%'
  AND tablename IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  )
ORDER BY tablename;

-- ============================================
-- VERIFICAR CONSTRAINTS DE UNICIDAD ACTUALIZADOS
-- ============================================

SELECT 
  'Verificando constraints de unicidad con empresa_id...' AS paso;

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('empleados', 'rutas', 'conceptos', 'folders_diarios', 'semanas_laborales')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name;

-- ============================================
-- VERIFICAR COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

SELECT 
  'Verificando comentarios de documentación...' AS paso;

SELECT 
  c.table_name,
  c.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
  pgd.objsubid = c.ordinal_position
  AND c.table_schema = st.schemaname
  AND c.table_name = st.relname
)
WHERE c.column_name = 'empresa_id'
  AND c.table_schema = 'public'
  AND c.table_name IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  )
ORDER BY c.table_name;

-- ============================================
-- RESUMEN DE VERIFICACIÓN
-- ============================================

SELECT 
  'RESUMEN DE VERIFICACIÓN' AS paso;

WITH tabla_verificacion AS (
  SELECT 
    table_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE column_name = 'empresa_id' 
          AND table_schema = 'public' 
          AND columns.table_name = t.table_name
      ) THEN '✓' 
      ELSE '✗' 
    END AS columna_existe,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname LIKE '%empresa%' 
          AND tablename = t.table_name
      ) THEN '✓' 
      ELSE '✗' 
    END AS indice_existe
  FROM (
    VALUES 
      ('perfiles'), ('empleados'), ('rutas'), ('conceptos'),
      ('semanas_laborales'), ('folders_diarios'), ('registros'),
      ('depositos'), ('evidencias')
  ) AS t(table_name)
)
SELECT 
  table_name AS tabla,
  columna_existe AS "Columna empresa_id",
  indice_existe AS "Índice creado"
FROM tabla_verificacion
ORDER BY table_name;

-- ============================================
-- CONTEO FINAL
-- ============================================

SELECT 
  'CONTEO FINAL' AS paso;

SELECT 
  COUNT(*) AS total_tablas_con_empresa_id
FROM information_schema.columns
WHERE column_name = 'empresa_id'
  AND table_schema = 'public'
  AND table_name IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  );

SELECT 
  COUNT(*) AS total_indices_empresa_id
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%empresa%'
  AND tablename IN (
    'perfiles', 'empleados', 'rutas', 'conceptos', 
    'semanas_laborales', 'folders_diarios', 'registros', 
    'depositos', 'evidencias'
  );

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Columnas empresa_id: 9 tablas
-- Índices creados: 9 índices
-- Foreign keys: 9 referencias a empresas(id)
-- Constraints únicos actualizados: 5 tablas (empleados, rutas, conceptos, folders_diarios, semanas_laborales)

