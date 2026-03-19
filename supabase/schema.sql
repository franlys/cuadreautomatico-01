-- ============================================
-- Cuadre Automático - Esquema de Base de Datos
-- ============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')),
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nombre, apellido)
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS rutas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de conceptos
CREATE TABLE IF NOT EXISTS conceptos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL UNIQUE,
  tipo TEXT CHECK (tipo IN ('ingreso', 'egreso', 'ambos')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de semanas laborales
CREATE TABLE IF NOT EXISTS semanas_laborales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_inicio DATE NOT NULL,   -- lunes
  fecha_fin DATE NOT NULL,      -- sábado
  total_ingresos NUMERIC(12,2) DEFAULT 0,
  total_egresos NUMERIC(12,2) DEFAULT 0,
  balance_neto NUMERIC(12,2) GENERATED ALWAYS AS (total_ingresos - total_egresos) STORED,
  total_depositos NUMERIC(12,2) DEFAULT 0,
  saldo_disponible NUMERIC(12,2) GENERATED ALWAYS AS (total_ingresos - total_egresos - total_depositos) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha_inicio, fecha_fin)
);

-- Tabla de folders diarios
CREATE TABLE IF NOT EXISTS folders_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_id UUID REFERENCES semanas_laborales(id) ON DELETE CASCADE,
  fecha_laboral DATE NOT NULL UNIQUE,
  total_ingresos NUMERIC(12,2) DEFAULT 0,
  total_egresos NUMERIC(12,2) DEFAULT 0,
  balance_diario NUMERIC(12,2) GENERATED ALWAYS AS (total_ingresos - total_egresos) STORED,
  cerrado BOOLEAN DEFAULT FALSE,
  cerrado_por UUID REFERENCES perfiles(id),
  cerrado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de registros de ingresos y egresos
CREATE TABLE IF NOT EXISTS registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_diario_id UUID REFERENCES folders_diarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto TEXT NOT NULL,
  empleado TEXT NOT NULL,
  ruta TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  creado_por UUID REFERENCES perfiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de depósitos bancarios
CREATE TABLE IF NOT EXISTS depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_laboral_id UUID REFERENCES semanas_laborales(id) ON DELETE CASCADE,
  folder_diario_id UUID REFERENCES folders_diarios(id),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  fecha_deposito DATE NOT NULL,
  banco TEXT,
  nota TEXT,
  registrado_por UUID REFERENCES perfiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de evidencias
CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID REFERENCES registros(id) ON DELETE CASCADE,
  deposito_id UUID REFERENCES depositos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamano_bytes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (registro_id IS NOT NULL OR deposito_id IS NOT NULL)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_folder_diario_id ON registros(folder_diario_id);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros(tipo);
CREATE INDEX IF NOT EXISTS idx_folders_semana_id ON folders_diarios(semana_id);
CREATE INDEX IF NOT EXISTS idx_folders_fecha_laboral ON folders_diarios(fecha_laboral);
CREATE INDEX IF NOT EXISTS idx_depositos_semana_laboral_id ON depositos(semana_laboral_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_registro_id ON evidencias(registro_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_deposito_id ON evidencias(deposito_id);

-- Comentarios para documentación
COMMENT ON TABLE perfiles IS 'Perfiles de usuario con roles y control de intentos fallidos';
COMMENT ON TABLE empleados IS 'Catálogo de empleados de la empresa';
COMMENT ON TABLE rutas IS 'Catálogo de rutas o zonas de trabajo';
COMMENT ON TABLE conceptos IS 'Catálogo de conceptos de ingresos y egresos';
COMMENT ON TABLE semanas_laborales IS 'Semanas laborales (lunes a sábado) con balances consolidados';
COMMENT ON TABLE folders_diarios IS 'Folders diarios con registros de ingresos y egresos';
COMMENT ON TABLE registros IS 'Registros individuales de ingresos y egresos';
COMMENT ON TABLE depositos IS 'Depósitos bancarios realizados';
COMMENT ON TABLE evidencias IS 'Archivos adjuntos (fotos, facturas) de registros y depósitos';
