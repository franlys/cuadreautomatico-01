-- ============================================
-- Cuadre Automático - Triggers para Cálculo Automático
-- ============================================

-- Función para recalcular totales del folder diario
CREATE OR REPLACE FUNCTION recalcular_folder()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular totales del folder afectado
  UPDATE folders_diarios
  SET 
    total_ingresos = COALESCE((
      SELECT SUM(monto)
      FROM registros
      WHERE folder_diario_id = COALESCE(NEW.folder_diario_id, OLD.folder_diario_id)
        AND tipo = 'ingreso'
    ), 0),
    total_egresos = COALESCE((
      SELECT SUM(monto)
      FROM registros
      WHERE folder_diario_id = COALESCE(NEW.folder_diario_id, OLD.folder_diario_id)
        AND tipo = 'egreso'
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.folder_diario_id, OLD.folder_diario_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular folder cuando se modifica un registro
DROP TRIGGER IF EXISTS trg_recalcular_folder ON registros;
CREATE TRIGGER trg_recalcular_folder
  AFTER INSERT OR UPDATE OR DELETE ON registros
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_folder();

-- Función para recalcular totales de la semana laboral
CREATE OR REPLACE FUNCTION recalcular_semana_desde_folder()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular totales de la semana afectada
  UPDATE semanas_laborales
  SET 
    total_ingresos = COALESCE((
      SELECT SUM(total_ingresos)
      FROM folders_diarios
      WHERE semana_laboral_id = COALESCE(NEW.semana_laboral_id, OLD.semana_laboral_id)
    ), 0),
    total_egresos = COALESCE((
      SELECT SUM(total_egresos)
      FROM folders_diarios
      WHERE semana_laboral_id = COALESCE(NEW.semana_laboral_id, OLD.semana_laboral_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.semana_laboral_id, OLD.semana_laboral_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular semana cuando se actualiza un folder
DROP TRIGGER IF EXISTS trg_recalcular_semana_desde_folder ON folders_diarios;
CREATE TRIGGER trg_recalcular_semana_desde_folder
  AFTER UPDATE OF total_ingresos, total_egresos ON folders_diarios
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_semana_desde_folder();

-- Función para recalcular total de depósitos de la semana
CREATE OR REPLACE FUNCTION recalcular_saldo_deposito()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular total de depósitos de la semana afectada
  UPDATE semanas_laborales
  SET 
    total_depositos = COALESCE((
      SELECT SUM(monto)
      FROM depositos
      WHERE semana_laboral_id = COALESCE(NEW.semana_laboral_id, OLD.semana_laboral_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.semana_laboral_id, OLD.semana_laboral_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular saldo cuando se modifica un depósito
DROP TRIGGER IF EXISTS trg_recalcular_saldo_deposito ON depositos;
CREATE TRIGGER trg_recalcular_saldo_deposito
  AFTER INSERT OR UPDATE OR DELETE ON depositos
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_saldo_deposito();

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at en todas las tablas
DROP TRIGGER IF EXISTS update_perfiles_updated_at ON perfiles;
CREATE TRIGGER update_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at
  BEFORE UPDATE ON empleados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rutas_updated_at ON rutas;
CREATE TRIGGER update_rutas_updated_at
  BEFORE UPDATE ON rutas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conceptos_updated_at ON conceptos;
CREATE TRIGGER update_conceptos_updated_at
  BEFORE UPDATE ON conceptos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registros_updated_at ON registros;
CREATE TRIGGER update_registros_updated_at
  BEFORE UPDATE ON registros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_depositos_updated_at ON depositos;
CREATE TRIGGER update_depositos_updated_at
  BEFORE UPDATE ON depositos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON FUNCTION recalcular_folder() IS 'Recalcula los totales de ingresos y egresos de un folder diario';
COMMENT ON FUNCTION recalcular_semana_desde_folder() IS 'Recalcula los totales de una semana laboral cuando se actualiza un folder';
COMMENT ON FUNCTION recalcular_saldo_deposito() IS 'Recalcula el total de depósitos de una semana laboral';
COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente el campo updated_at';
