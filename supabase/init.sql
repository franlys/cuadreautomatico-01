-- ============================================
-- Cuadre Automático - Script de Inicialización Completo
-- ============================================
-- Este script combina schema.sql, triggers.sql y rls.sql
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- PARTE 1: ESQUEMA DE TABLAS
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
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
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

-- Tabla de registros
CREATE TABLE IF NOT EXISTS registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES folders_diarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto_id UUID REFERENCES conceptos(id),
  concepto_manual TEXT,
  empleado_id UUID NOT NULL REFERENCES empleados(id),
  ruta_id UUID NOT NULL REFERENCES rutas(id),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  fecha_laboral DATE NOT NULL,
  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  creado_por UUID REFERENCES perfiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (concepto_id IS NOT NULL OR concepto_manual IS NOT NULL)
);

-- Tabla de depósitos
CREATE TABLE IF NOT EXISTS depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_id UUID REFERENCES semanas_laborales(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders_diarios(id),
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_folder_id ON registros(folder_id);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros(tipo);
CREATE INDEX IF NOT EXISTS idx_registros_fecha_laboral ON registros(fecha_laboral);
CREATE INDEX IF NOT EXISTS idx_folders_semana_id ON folders_diarios(semana_id);
CREATE INDEX IF NOT EXISTS idx_folders_fecha_laboral ON folders_diarios(fecha_laboral);
CREATE INDEX IF NOT EXISTS idx_depositos_semana_id ON depositos(semana_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_registro_id ON evidencias(registro_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_deposito_id ON evidencias(deposito_id);

-- ============================================
-- PARTE 2: TRIGGERS
-- ============================================

-- Función para recalcular totales del folder diario
CREATE OR REPLACE FUNCTION recalcular_folder()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE folders_diarios
  SET 
    total_ingresos = COALESCE((
      SELECT SUM(monto)
      FROM registros
      WHERE folder_id = COALESCE(NEW.folder_id, OLD.folder_id)
        AND tipo = 'ingreso'
    ), 0),
    total_egresos = COALESCE((
      SELECT SUM(monto)
      FROM registros
      WHERE folder_id = COALESCE(NEW.folder_id, OLD.folder_id)
        AND tipo = 'egreso'
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.folder_id, OLD.folder_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_folder ON registros;
CREATE TRIGGER trg_recalcular_folder
  AFTER INSERT OR UPDATE OR DELETE ON registros
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_folder();

-- Función para recalcular totales de la semana laboral
CREATE OR REPLACE FUNCTION recalcular_semana_desde_folder()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE semanas_laborales
  SET 
    total_ingresos = COALESCE((
      SELECT SUM(total_ingresos)
      FROM folders_diarios
      WHERE semana_id = COALESCE(NEW.semana_id, OLD.semana_id)
    ), 0),
    total_egresos = COALESCE((
      SELECT SUM(total_egresos)
      FROM folders_diarios
      WHERE semana_id = COALESCE(NEW.semana_id, OLD.semana_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.semana_id, OLD.semana_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_semana_desde_folder ON folders_diarios;
CREATE TRIGGER trg_recalcular_semana_desde_folder
  AFTER UPDATE OF total_ingresos, total_egresos ON folders_diarios
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_semana_desde_folder();

-- Función para recalcular total de depósitos
CREATE OR REPLACE FUNCTION recalcular_saldo_deposito()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE semanas_laborales
  SET 
    total_depositos = COALESCE((
      SELECT SUM(monto)
      FROM depositos
      WHERE semana_id = COALESCE(NEW.semana_id, OLD.semana_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.semana_id, OLD.semana_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_saldo_deposito ON depositos;
CREATE TRIGGER trg_recalcular_saldo_deposito
  AFTER INSERT OR UPDATE OR DELETE ON depositos
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_saldo_deposito();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_perfiles_updated_at ON perfiles;
CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON perfiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rutas_updated_at ON rutas;
CREATE TRIGGER update_rutas_updated_at BEFORE UPDATE ON rutas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conceptos_updated_at ON conceptos;
CREATE TRIGGER update_conceptos_updated_at BEFORE UPDATE ON conceptos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registros_updated_at ON registros;
CREATE TRIGGER update_registros_updated_at BEFORE UPDATE ON registros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depositos_updated_at ON depositos;
CREATE TRIGGER update_depositos_updated_at BEFORE UPDATE ON depositos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 3: ROW LEVEL SECURITY
-- ============================================

-- Habilitar RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_laborales ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ver rls.sql para políticas completas)
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles FOR SELECT USING (auth.uid() = id);

-- Todos pueden ver catálogos activos
CREATE POLICY "View active employees" ON empleados FOR SELECT USING (activo = true);
CREATE POLICY "View active routes" ON rutas FOR SELECT USING (activo = true);
CREATE POLICY "View active concepts" ON conceptos FOR SELECT USING (activo = true);

-- Todos pueden ver semanas y folders
CREATE POLICY "View weeks" ON semanas_laborales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "View folders" ON folders_diarios FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- FINALIZACIÓN
-- ============================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos inicializada correctamente';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Configurar Storage bucket "evidencias"';
  RAISE NOTICE '2. Copiar credenciales a .env';
  RAISE NOTICE '3. Ejecutar rls.sql para políticas completas';
END $$;


-- ============================================
-- PARTE 4: CONFIGURACIÓN DE STORAGE
-- ============================================

-- Crear bucket para evidencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket evidencias

-- Permitir subir evidencias a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias');

-- Permitir ver evidencias según el rol
CREATE POLICY "Usuarios pueden ver sus propias evidencias"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias' AND (
    -- Dueño puede ver todas las evidencias
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Dueño'
    OR
    -- Usuario_Ingresos puede ver evidencias de registros de tipo ingreso
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Usuario_Ingresos'
      AND EXISTS (
        SELECT 1 FROM evidencias e
        JOIN registros r ON e.registro_id = r.id
        WHERE e.storage_path = name
        AND r.tipo = 'ingreso'
      )
    )
    OR
    -- Usuario_Egresos puede ver evidencias de registros de tipo egreso
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Usuario_Egresos'
      AND EXISTS (
        SELECT 1 FROM evidencias e
        JOIN registros r ON e.registro_id = r.id
        WHERE e.storage_path = name
        AND r.tipo = 'egreso'
      )
    )
  )
);

-- Permitir eliminar evidencias (solo Dueño)
CREATE POLICY "Solo el Dueño puede eliminar evidencias"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias'
  AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Dueño'
);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
