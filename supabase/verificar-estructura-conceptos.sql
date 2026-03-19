-- ============================================
-- VERIFICAR ESTRUCTURA DE TABLA CONCEPTOS
-- ============================================

-- Ver las columnas de la tabla conceptos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conceptos'
ORDER BY ordinal_position;

-- Ver si hay datos en la tabla
SELECT COUNT(*) as total_registros FROM conceptos;

-- Ver algunos registros de ejemplo
SELECT * FROM conceptos LIMIT 5;

-- Verificar permisos
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'conceptos'
  AND grantee IN ('authenticated', 'anon');
