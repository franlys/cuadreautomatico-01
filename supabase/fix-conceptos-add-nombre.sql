-- ============================================
-- AGREGAR COLUMNA NOMBRE A TABLA CONCEPTOS
-- ============================================

-- Agregar columna nombre (copiar datos de descripcion)
ALTER TABLE conceptos ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Copiar datos de descripcion a nombre
UPDATE conceptos SET nombre = descripcion WHERE nombre IS NULL;

-- Hacer nombre NOT NULL y UNIQUE
ALTER TABLE conceptos ALTER COLUMN nombre SET NOT NULL;
ALTER TABLE conceptos ADD CONSTRAINT conceptos_nombre_unique UNIQUE (nombre);

-- Verificar la estructura
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conceptos'
ORDER BY ordinal_position;

-- Ver los datos
SELECT id, nombre, descripcion, tipo, activo FROM conceptos LIMIT 5;
