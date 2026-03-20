-- ============================================
-- Multi-Tenant Platform - Agregar empresa_id a Tablas Existentes
-- ============================================
-- Este archivo agrega la columna empresa_id a todas las tablas existentes
-- para establecer la relación multi-tenant y el aislamiento de datos.
-- Requirements: 2.1, 2.2
-- Tarea: 1.2

-- ============================================
-- PASO 1: Agregar columna empresa_id a todas las tablas
-- ============================================

-- Tabla perfiles
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla empleados
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla rutas
ALTER TABLE rutas 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla conceptos
ALTER TABLE conceptos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla semanas_laborales
ALTER TABLE semanas_laborales 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla folders_diarios
ALTER TABLE folders_diarios 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla registros
ALTER TABLE registros 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla depositos
ALTER TABLE depositos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Tabla evidencias
ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- ============================================
-- PASO 2: Crear índices en empresa_id para todas las tablas
-- ============================================

-- Índice para perfiles
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa ON perfiles(empresa_id);

-- Índice para empleados
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(empresa_id);

-- Índice para rutas
CREATE INDEX IF NOT EXISTS idx_rutas_empresa ON rutas(empresa_id);

-- Índice para conceptos
CREATE INDEX IF NOT EXISTS idx_conceptos_empresa ON conceptos(empresa_id);

-- Índice para semanas_laborales
CREATE INDEX IF NOT EXISTS idx_semanas_empresa ON semanas_laborales(empresa_id);

-- Índice para folders_diarios
CREATE INDEX IF NOT EXISTS idx_folders_empresa ON folders_diarios(empresa_id);

-- Índice para registros
CREATE INDEX IF NOT EXISTS idx_registros_empresa ON registros(empresa_id);

-- Índice para depositos
CREATE INDEX IF NOT EXISTS idx_depositos_empresa ON depositos(empresa_id);

-- Índice para evidencias
CREATE INDEX IF NOT EXISTS idx_evidencias_empresa ON evidencias(empresa_id);

-- ============================================
-- PASO 3: Actualizar constraints de unicidad para incluir empresa_id
-- ============================================

-- Empleados: nombre + apellido debe ser único por empresa
ALTER TABLE empleados DROP CONSTRAINT IF EXISTS empleados_nombre_apellido_key;
ALTER TABLE empleados ADD CONSTRAINT empleados_nombre_apellido_empresa_key 
  UNIQUE(empresa_id, nombre, apellido);

-- Rutas: nombre debe ser único por empresa
ALTER TABLE rutas DROP CONSTRAINT IF EXISTS rutas_nombre_key;
ALTER TABLE rutas ADD CONSTRAINT rutas_nombre_empresa_key 
  UNIQUE(empresa_id, nombre);

-- Conceptos: descripcion debe ser única por empresa
ALTER TABLE conceptos DROP CONSTRAINT IF EXISTS conceptos_descripcion_key;
ALTER TABLE conceptos ADD CONSTRAINT conceptos_descripcion_empresa_key 
  UNIQUE(empresa_id, descripcion);

-- Folders diarios: fecha_laboral debe ser única por empresa
ALTER TABLE folders_diarios DROP CONSTRAINT IF EXISTS folders_diarios_fecha_laboral_key;
ALTER TABLE folders_diarios ADD CONSTRAINT folders_diarios_fecha_empresa_key 
  UNIQUE(empresa_id, fecha_laboral);

-- Semanas laborales: fecha_inicio + fecha_fin debe ser única por empresa
ALTER TABLE semanas_laborales DROP CONSTRAINT IF EXISTS semanas_laborales_fecha_inicio_fecha_fin_key;
ALTER TABLE semanas_laborales ADD CONSTRAINT semanas_laborales_fechas_empresa_key 
  UNIQUE(empresa_id, fecha_inicio, fecha_fin);

-- ============================================
-- PASO 4: Agregar comentarios de documentación
-- ============================================

COMMENT ON COLUMN perfiles.empresa_id IS 'ID de la empresa a la que pertenece el usuario';
COMMENT ON COLUMN empleados.empresa_id IS 'ID de la empresa a la que pertenece el empleado';
COMMENT ON COLUMN rutas.empresa_id IS 'ID de la empresa a la que pertenece la ruta';
COMMENT ON COLUMN conceptos.empresa_id IS 'ID de la empresa a la que pertenece el concepto';
COMMENT ON COLUMN semanas_laborales.empresa_id IS 'ID de la empresa a la que pertenece la semana laboral';
COMMENT ON COLUMN folders_diarios.empresa_id IS 'ID de la empresa a la que pertenece el folder diario';
COMMENT ON COLUMN registros.empresa_id IS 'ID de la empresa a la que pertenece el registro';
COMMENT ON COLUMN depositos.empresa_id IS 'ID de la empresa a la que pertenece el depósito';
COMMENT ON COLUMN evidencias.empresa_id IS 'ID de la empresa a la que pertenece la evidencia';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script NO establece empresa_id como NOT NULL porque los datos existentes
--    aún no tienen empresa asignada. Esto se hará en la tarea de migración de datos.
-- 2. Los índices mejoran el rendimiento de las consultas filtradas por empresa_id.
-- 3. Los constraints de unicidad ahora incluyen empresa_id para permitir datos
--    duplicados entre empresas diferentes.
-- 4. Las foreign keys garantizan integridad referencial con la tabla empresas.

