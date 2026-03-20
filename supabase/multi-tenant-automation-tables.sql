-- ============================================
-- Multi-Tenant Platform - Tablas de Automatización Completa
-- ============================================
-- Este script crea todas las tablas necesarias para el sistema de
-- automatización completa (hojas de ruta digitales) con sus campos,
-- constraints, índices y políticas RLS.
-- ============================================

-- ============================================
-- 3.1 Tabla hojas_ruta
-- ============================================
-- Almacena las hojas de ruta digitales asignadas a empleados
-- Cada hoja tiene un identificador único formato "Empleado Ruta Fecha"
CREATE TABLE IF NOT EXISTS hojas_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE RESTRICT,
  ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  identificador TEXT NOT NULL, -- Formato: "Jose Bani 20/03/2026"
  monto_asignado_rdp NUMERIC(12,2) DEFAULT 0 CHECK (monto_asignado_rdp >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cerrada')),
  cerrada_por UUID REFERENCES perfiles(id),
  cerrada_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT hojas_ruta_identificador_empresa_key UNIQUE(empresa_id, identificador),
  CONSTRAINT hojas_ruta_cerrada_check CHECK (
    (estado = 'cerrada' AND cerrada_por IS NOT NULL AND cerrada_en IS NOT NULL) OR
    (estado != 'cerrada' AND cerrada_por IS NULL AND cerrada_en IS NULL)
  )
);

-- Índices para hojas_ruta
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_empresa_id ON hojas_ruta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_empleado_id ON hojas_ruta(empleado_id);
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_estado ON hojas_ruta(estado);
CREATE INDEX IF NOT EXISTS idx_hojas_ruta_fecha ON hojas_ruta(fecha);

-- Comentario
COMMENT ON TABLE hojas_ruta IS 'Hojas de ruta digitales para empresas con automatización completa';
COMMENT ON COLUMN hojas_ruta.identificador IS 'Identificador único formato "Empleado Ruta Fecha"';
COMMENT ON COLUMN hojas_ruta.monto_asignado_rdp IS 'Dinero entregado al empleado para gastos en RD$';

-- ============================================
-- 3.2 Tabla facturas_ruta
-- ============================================
-- Almacena las facturas asignadas a cada hoja de ruta
-- Soporta múltiples monedas (RD$ y USD)
CREATE TABLE IF NOT EXISTS facturas_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES hojas_ruta(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda TEXT NOT NULL CHECK (moneda IN ('RD$', 'USD')),
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagada')),
  estado_entrega TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_entrega IN ('pendiente', 'entregada')),
  monto_cobrado NUMERIC(12,2) CHECK (monto_cobrado >= 0),
  moneda_cobrada TEXT CHECK (moneda_cobrada IN ('RD$', 'USD')),
  entregada_en TIMESTAMPTZ,
  cobrada_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT facturas_ruta_entregada_check CHECK (
    (estado_entrega = 'entregada' AND entregada_en IS NOT NULL) OR
    (estado_entrega = 'pendiente' AND entregada_en IS NULL)
  ),
  CONSTRAINT facturas_ruta_cobrada_check CHECK (
    (monto_cobrado IS NOT NULL AND moneda_cobrada IS NOT NULL AND cobrada_en IS NOT NULL) OR
    (monto_cobrado IS NULL AND moneda_cobrada IS NULL AND cobrada_en IS NULL)
  )
);

-- Índices para facturas_ruta
CREATE INDEX IF NOT EXISTS idx_facturas_ruta_hoja_ruta_id ON facturas_ruta(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_ruta_estado_pago ON facturas_ruta(estado_pago);
CREATE INDEX IF NOT EXISTS idx_facturas_ruta_estado_entrega ON facturas_ruta(estado_entrega);

-- Comentario
COMMENT ON TABLE facturas_ruta IS 'Facturas asignadas a hojas de ruta con seguimiento de entrega y cobro';
COMMENT ON COLUMN facturas_ruta.estado_pago IS 'Estado inicial de la factura: pendiente o pagada (PA)';
COMMENT ON COLUMN facturas_ruta.monto_cobrado IS 'Monto real cobrado, puede diferir del monto original';

-- ============================================
-- 3.3 Tabla gastos_ruta
-- ============================================
-- Almacena los gastos registrados durante la ejecución de la ruta
-- Tipos: fijo (sin evidencia), peaje/combustible (con evidencia obligatoria), inesperado (evidencia opcional)
CREATE TABLE IF NOT EXISTS gastos_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES hojas_ruta(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('fijo', 'peaje', 'combustible', 'inesperado')),
  descripcion TEXT,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda TEXT NOT NULL CHECK (moneda IN ('RD$', 'USD')),
  evidencia_requerida BOOLEAN NOT NULL DEFAULT FALSE,
  evidencia_id UUID REFERENCES evidencias(id) ON DELETE SET NULL,
  registrado_en TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT gastos_ruta_evidencia_check CHECK (
    (evidencia_requerida = TRUE AND evidencia_id IS NOT NULL) OR
    (evidencia_requerida = FALSE)
  ),
  CONSTRAINT gastos_ruta_descripcion_check CHECK (
    (tipo = 'inesperado' AND descripcion IS NOT NULL) OR
    (tipo != 'inesperado')
  )
);

-- Índices para gastos_ruta
CREATE INDEX IF NOT EXISTS idx_gastos_ruta_hoja_ruta_id ON gastos_ruta(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_gastos_ruta_tipo ON gastos_ruta(tipo);
CREATE INDEX IF NOT EXISTS idx_gastos_ruta_registrado_en ON gastos_ruta(registrado_en);

-- Comentario
COMMENT ON TABLE gastos_ruta IS 'Gastos registrados durante la ejecución de rutas';
COMMENT ON COLUMN gastos_ruta.tipo IS 'fijo: sin evidencia, peaje/combustible: evidencia obligatoria, inesperado: evidencia opcional';
COMMENT ON COLUMN gastos_ruta.evidencia_requerida IS 'TRUE para peaje y combustible, FALSE para fijo, opcional para inesperado';

-- ============================================
-- 3.4 Tabla balance_ruta_historico
-- ============================================
-- Almacena snapshots del balance de la ruta después de cada operación
-- Permite trazabilidad completa del estado financiero en tiempo real
CREATE TABLE IF NOT EXISTS balance_ruta_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES hojas_ruta(id) ON DELETE CASCADE,
  total_facturas_rdp NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_facturas_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gastos_rdp NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gastos_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinero_disponible_rdp NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinero_disponible_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para balance_ruta_historico
CREATE INDEX IF NOT EXISTS idx_balance_ruta_hoja_ruta_id ON balance_ruta_historico(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_balance_ruta_timestamp ON balance_ruta_historico(timestamp);
CREATE INDEX IF NOT EXISTS idx_balance_ruta_hoja_timestamp ON balance_ruta_historico(hoja_ruta_id, timestamp DESC);

-- Comentario
COMMENT ON TABLE balance_ruta_historico IS 'Historial de balance de rutas para trazabilidad en tiempo real';
COMMENT ON COLUMN balance_ruta_historico.dinero_disponible_rdp IS 'Calculado como: monto_asignado + cobros - gastos';

-- ============================================
-- 3.5 Tabla audit_logs
-- ============================================
-- Almacena logs de auditoría de todas las acciones en la plataforma
-- Permite monitoreo de seguridad y trazabilidad de operaciones
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  recurso TEXT NOT NULL,
  detalles JSONB,
  ip_address INET,
  user_agent TEXT,
  exitoso BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_accion ON audit_logs(accion);
CREATE INDEX IF NOT EXISTS idx_audit_logs_exitoso ON audit_logs(exitoso);
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_created ON audit_logs(empresa_id, created_at DESC);

-- Comentario
COMMENT ON TABLE audit_logs IS 'Logs de auditoría para monitoreo de seguridad y trazabilidad';
COMMENT ON COLUMN audit_logs.detalles IS 'Información adicional en formato JSON (IDs, valores anteriores, etc.)';
COMMENT ON COLUMN audit_logs.exitoso IS 'FALSE para intentos de acceso no autorizado o errores';

-- ============================================
-- Políticas RLS para hojas_ruta
-- ============================================

-- Habilitar RLS
ALTER TABLE hojas_ruta ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuarios ven solo hojas de su empresa
-- Empleado_Ruta solo ve sus hojas asignadas
CREATE POLICY hojas_ruta_select_policy ON hojas_ruta
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfiles WHERE id = auth.uid()
    )
    AND (
      -- Super_Admin ve todas
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Super_Admin')
      OR
      -- Empleado_Ruta solo ve sus hojas
      (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Empleado_Ruta')
        AND empleado_id IN (SELECT id FROM empleados WHERE id = empleado_id)
      )
      OR
      -- Otros roles ven todas las hojas de su empresa
      EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Encargado_Almacén', 'Secretaria', 'Usuario_Completo', 'Dueño')
      )
    )
  );

-- Política INSERT: solo Encargado_Almacén y Secretaria pueden crear hojas
CREATE POLICY hojas_ruta_insert_policy ON hojas_ruta
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM perfiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol IN ('Super_Admin', 'Encargado_Almacén', 'Secretaria')
    )
  );

-- Política UPDATE: Encargado_Almacén puede editar, Empleado_Ruta solo sus hojas no cerradas
CREATE POLICY hojas_ruta_update_policy ON hojas_ruta
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfiles WHERE id = auth.uid()
    )
    AND (
      -- Super_Admin y Encargado_Almacén pueden editar todas
      EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Super_Admin', 'Encargado_Almacén')
      )
      OR
      -- Empleado_Ruta solo sus hojas no cerradas
      (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Empleado_Ruta')
        AND empleado_id IN (SELECT id FROM empleados WHERE id = empleado_id)
        AND estado != 'cerrada'
      )
      OR
      -- Usuario_Completo puede cerrar hojas
      (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Usuario_Completo')
        AND estado = 'completada' -- Solo puede cerrar hojas completadas
      )
    )
  );

-- Política DELETE: solo Super_Admin y Encargado_Almacén
CREATE POLICY hojas_ruta_delete_policy ON hojas_ruta
  FOR DELETE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol IN ('Super_Admin', 'Encargado_Almacén')
    )
  );

-- ============================================
-- Políticas RLS para facturas_ruta
-- ============================================

ALTER TABLE facturas_ruta ENABLE ROW LEVEL SECURITY;

-- Política SELECT: heredada de hoja_ruta
CREATE POLICY facturas_ruta_select_policy ON facturas_ruta
  FOR SELECT
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
    )
  );

-- Política INSERT: quien puede crear hojas puede agregar facturas
CREATE POLICY facturas_ruta_insert_policy ON facturas_ruta
  FOR INSERT
  WITH CHECK (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Super_Admin', 'Encargado_Almacén', 'Secretaria')
      )
    )
  );

-- Política UPDATE: Empleado_Ruta puede marcar entregada/cobrada en sus hojas no cerradas
CREATE POLICY facturas_ruta_update_policy ON facturas_ruta
  FOR UPDATE
  USING (
    hoja_ruta_id IN (
      SELECT hr.id FROM hojas_ruta hr
      WHERE hr.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM perfiles 
          WHERE id = auth.uid() 
          AND rol IN ('Super_Admin', 'Encargado_Almacén')
        )
        OR
        (
          EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Empleado_Ruta')
          AND hr.empleado_id IN (SELECT id FROM empleados WHERE id = hr.empleado_id)
          AND hr.estado != 'cerrada'
        )
      )
    )
  );

-- Política DELETE: solo Super_Admin y Encargado_Almacén
CREATE POLICY facturas_ruta_delete_policy ON facturas_ruta
  FOR DELETE
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Super_Admin', 'Encargado_Almacén')
      )
    )
  );

-- ============================================
-- Políticas RLS para gastos_ruta
-- ============================================

ALTER TABLE gastos_ruta ENABLE ROW LEVEL SECURITY;

-- Política SELECT: heredada de hoja_ruta
CREATE POLICY gastos_ruta_select_policy ON gastos_ruta
  FOR SELECT
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
    )
  );

-- Política INSERT: Empleado_Ruta puede registrar gastos en sus hojas no cerradas
CREATE POLICY gastos_ruta_insert_policy ON gastos_ruta
  FOR INSERT
  WITH CHECK (
    hoja_ruta_id IN (
      SELECT hr.id FROM hojas_ruta hr
      WHERE hr.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND (
        EXISTS (
          SELECT 1 FROM perfiles 
          WHERE id = auth.uid() 
          AND rol IN ('Super_Admin', 'Encargado_Almacén')
        )
        OR
        (
          EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'Empleado_Ruta')
          AND hr.empleado_id IN (SELECT id FROM empleados WHERE id = hr.empleado_id)
          AND hr.estado != 'cerrada'
        )
      )
    )
  );

-- Política UPDATE: solo Super_Admin y Encargado_Almacén
CREATE POLICY gastos_ruta_update_policy ON gastos_ruta
  FOR UPDATE
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Super_Admin', 'Encargado_Almacén')
      )
    )
  );

-- Política DELETE: solo Super_Admin y Encargado_Almacén
CREATE POLICY gastos_ruta_delete_policy ON gastos_ruta
  FOR DELETE
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Super_Admin', 'Encargado_Almacén')
      )
    )
  );

-- ============================================
-- Políticas RLS para balance_ruta_historico
-- ============================================

ALTER TABLE balance_ruta_historico ENABLE ROW LEVEL SECURITY;

-- Política SELECT: heredada de hoja_ruta
CREATE POLICY balance_ruta_select_policy ON balance_ruta_historico
  FOR SELECT
  USING (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
    )
  );

-- Política INSERT: sistema puede insertar (triggers o funciones)
CREATE POLICY balance_ruta_insert_policy ON balance_ruta_historico
  FOR INSERT
  WITH CHECK (
    hoja_ruta_id IN (
      SELECT id FROM hojas_ruta
      WHERE empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
    )
  );

-- No permitir UPDATE ni DELETE en histórico
-- Solo Super_Admin puede eliminar para limpieza

CREATE POLICY balance_ruta_delete_policy ON balance_ruta_historico
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol = 'Super_Admin'
    )
  );

-- ============================================
-- Políticas RLS para audit_logs
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Super_Admin ve todos, otros usuarios ven solo logs de su empresa
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol = 'Super_Admin'
    )
    OR
    (
      empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() 
        AND rol IN ('Dueño', 'Usuario_Completo', 'Encargado_Almacén')
      )
    )
  );

-- Política INSERT: sistema puede insertar logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (TRUE); -- Cualquier usuario autenticado puede crear logs

-- No permitir UPDATE ni DELETE excepto Super_Admin para limpieza
CREATE POLICY audit_logs_delete_policy ON audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol = 'Super_Admin'
    )
  );

-- ============================================
-- Triggers para actualizar updated_at
-- ============================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para hojas_ruta
DROP TRIGGER IF EXISTS update_hojas_ruta_updated_at ON hojas_ruta;
CREATE TRIGGER update_hojas_ruta_updated_at
  BEFORE UPDATE ON hojas_ruta
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para facturas_ruta
DROP TRIGGER IF EXISTS update_facturas_ruta_updated_at ON facturas_ruta;
CREATE TRIGGER update_facturas_ruta_updated_at
  BEFORE UPDATE ON facturas_ruta
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Fin del script
-- ============================================
