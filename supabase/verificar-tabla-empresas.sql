-- ============================================
-- Script de Verificación - Tabla Empresas
-- ============================================
-- Este script verifica que la tabla empresas y sus componentes
-- se hayan creado correctamente.

-- 1. Verificar que la tabla existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'empresas';

-- 2. Verificar estructura de columnas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'empresas'
ORDER BY ordinal_position;

-- 3. Verificar que el tipo ENUM existe
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'nivel_automatizacion_enum'
ORDER BY e.enumsortorder;

-- 4. Verificar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'empresas'
ORDER BY indexname;

-- 5. Verificar constraints
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    WHEN 'u' THEN 'UNIQUE'
    ELSE con.contype::text
  END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'empresas'
ORDER BY con.conname;

-- 6. Verificar comentarios de documentación
SELECT 
  obj_description('empresas'::regclass) AS table_comment;

SELECT 
  col.column_name,
  pgd.description AS column_comment
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns col ON (
  pgd.objsubid = col.ordinal_position AND
  col.table_schema = st.schemaname AND
  col.table_name = st.relname
)
WHERE st.relname = 'empresas'
ORDER BY col.ordinal_position;

-- 7. Probar inserción de datos de prueba (se hace rollback)
BEGIN;
  INSERT INTO empresas (nombre, nivel_automatizacion, activa, limite_storage_mb)
  VALUES ('Empresa Test', 'parcial', true, 1000)
  RETURNING *;
ROLLBACK;

-- Mensaje de éxito
SELECT 'Verificación completada exitosamente' AS resultado;
