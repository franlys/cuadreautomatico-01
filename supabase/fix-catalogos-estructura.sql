-- ============================================
-- ARREGLAR ESTRUCTURA DE TABLAS DE CATÁLOGOS
-- ============================================

-- 1. TABLA EMPLEADOS: Hacer apellido opcional
ALTER TABLE empleados ALTER COLUMN apellido DROP NOT NULL;
ALTER TABLE empleados ALTER COLUMN apellido SET DEFAULT '';

-- Agregar columna nombre si no existe (para consistencia)
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS nombre_completo TEXT 
  GENERATED ALWAYS AS (CASE 
    WHEN apellido IS NULL OR apellido = '' THEN nombre 
    ELSE nombre || ' ' || apellido 
  END) STORED;

-- 2. TABLA CONCEPTOS: Hacer descripcion opcional y agregar nombre
ALTER TABLE conceptos ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE conceptos ALTER COLUMN descripcion DROP NOT NULL;

-- Copiar datos de descripcion a nombre si nombre está vacío
UPDATE conceptos SET nombre = descripcion WHERE nombre IS NULL;

-- Hacer nombre NOT NULL después de copiar datos
ALTER TABLE conceptos ALTER COLUMN nombre SET NOT NULL;

-- Agregar constraint UNIQUE en nombre
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conceptos_nombre_unique'
  ) THEN
    ALTER TABLE conceptos ADD CONSTRAINT conceptos_nombre_unique UNIQUE (nombre);
  END IF;
END $$;

-- 3. TABLA RUTAS: Ya está bien, solo verificar
-- (rutas ya tiene nombre como campo principal)

-- Verificar las estructuras finales
SELECT 'EMPLEADOS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'empleados' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONCEPTOS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conceptos' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'RUTAS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rutas' AND table_schema = 'public'
ORDER BY ordinal_position;
