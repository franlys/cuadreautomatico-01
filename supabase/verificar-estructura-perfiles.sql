-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLA PERFILES
-- =====================================================

-- Ver todas las columnas de la tabla perfiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'perfiles'
ORDER BY ordinal_position;

-- Ver tu registro en perfiles
SELECT * FROM perfiles LIMIT 5;

-- Ver el UUID de tu sesión actual
SELECT auth.uid() as mi_auth_uid;
