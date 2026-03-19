-- ============================================
-- HACER CAMPOS OPCIONALES EN TABLA REGISTROS
-- ============================================
-- Ingresos: empleado, ruta, monto (NO concepto)
-- Egresos: concepto, monto (NO ruta, empleado solo si es pago de nómina)

-- Hacer concepto, empleado y ruta opcionales
ALTER TABLE registros ALTER COLUMN concepto DROP NOT NULL;
ALTER TABLE registros ALTER COLUMN empleado DROP NOT NULL;
ALTER TABLE registros ALTER COLUMN ruta DROP NOT NULL;

-- Agregar constraint para validar la lógica de negocio
ALTER TABLE registros DROP CONSTRAINT IF EXISTS registros_campos_requeridos;

ALTER TABLE registros ADD CONSTRAINT registros_campos_requeridos CHECK (
  (tipo = 'ingreso' AND empleado IS NOT NULL AND ruta IS NOT NULL AND concepto IS NULL) OR
  (tipo = 'egreso' AND concepto IS NOT NULL AND ruta IS NULL)
);

-- Verificar la estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registros' AND table_schema = 'public'
ORDER BY ordinal_position;
