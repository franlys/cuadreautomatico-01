-- ============================================
-- Cuadre Automático - Row Level Security (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_laborales ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas para PERFILES
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- Políticas para EMPLEADOS
-- ============================================

-- Todos los usuarios autenticados pueden ver empleados activos
CREATE POLICY "Authenticated users can view active employees"
  ON empleados FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

-- Todos los usuarios autenticados pueden crear empleados
CREATE POLICY "Authenticated users can create employees"
  ON empleados FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo el Dueño puede editar o eliminar empleados
CREATE POLICY "Only Dueño can update employees"
  ON empleados FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

CREATE POLICY "Only Dueño can delete employees"
  ON empleados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- Políticas para RUTAS
-- ============================================

-- Todos los usuarios autenticados pueden ver rutas activas
CREATE POLICY "Authenticated users can view active routes"
  ON rutas FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

-- Todos los usuarios autenticados pueden crear rutas
CREATE POLICY "Authenticated users can create routes"
  ON rutas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo el Dueño puede editar o eliminar rutas
CREATE POLICY "Only Dueño can update routes"
  ON rutas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

CREATE POLICY "Only Dueño can delete routes"
  ON rutas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- Políticas para CONCEPTOS
-- ============================================

-- Todos los usuarios autenticados pueden ver conceptos activos
CREATE POLICY "Authenticated users can view active concepts"
  ON conceptos FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

-- Todos los usuarios autenticados pueden crear conceptos
CREATE POLICY "Authenticated users can create concepts"
  ON conceptos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo el Dueño puede editar o eliminar conceptos
CREATE POLICY "Only Dueño can update concepts"
  ON conceptos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

CREATE POLICY "Only Dueño can delete concepts"
  ON conceptos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- Políticas para SEMANAS_LABORALES
-- ============================================

-- Todos los usuarios autenticados pueden ver semanas laborales
CREATE POLICY "Authenticated users can view weeks"
  ON semanas_laborales FOR SELECT
  USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear semanas laborales
CREATE POLICY "Authenticated users can create weeks"
  ON semanas_laborales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo el Dueño puede actualizar semanas laborales
CREATE POLICY "Only Dueño can update weeks"
  ON semanas_laborales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- Políticas para FOLDERS_DIARIOS
-- ============================================

-- Todos los usuarios autenticados pueden ver folders diarios
CREATE POLICY "Authenticated users can view folders"
  ON folders_diarios FOR SELECT
  USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear folders diarios
CREATE POLICY "Authenticated users can create folders"
  ON folders_diarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo el Dueño puede cerrar folders (actualizar cerrado = true)
CREATE POLICY "Only Dueño can close folders"
  ON folders_diarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- Políticas para REGISTROS
-- ============================================

-- Usuario_Ingresos puede ver solo registros de tipo ingreso
CREATE POLICY "Usuario_Ingresos can view income records"
  ON registros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Ingresos'
    ) AND tipo = 'ingreso'
  );

-- Usuario_Egresos puede ver solo registros de tipo egreso
CREATE POLICY "Usuario_Egresos can view expense records"
  ON registros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Egresos'
    ) AND tipo = 'egreso'
  );

-- Dueño puede ver todos los registros
CREATE POLICY "Dueño can view all records"
  ON registros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- Usuario_Ingresos puede crear registros de tipo ingreso en folders abiertos
CREATE POLICY "Usuario_Ingresos can create income records"
  ON registros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Ingresos'
    ) AND tipo = 'ingreso'
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Egresos puede crear registros de tipo egreso en folders abiertos
CREATE POLICY "Usuario_Egresos can create expense records"
  ON registros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Egresos'
    ) AND tipo = 'egreso'
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Ingresos puede actualizar sus propios registros de ingreso en folders abiertos
CREATE POLICY "Usuario_Ingresos can update own income records"
  ON registros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Ingresos'
    ) AND tipo = 'ingreso' AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Egresos puede actualizar sus propios registros de egreso en folders abiertos
CREATE POLICY "Usuario_Egresos can update own expense records"
  ON registros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Egresos'
    ) AND tipo = 'egreso' AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Ingresos puede eliminar sus propios registros de ingreso en folders abiertos
CREATE POLICY "Usuario_Ingresos can delete own income records"
  ON registros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Ingresos'
    ) AND tipo = 'ingreso' AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Egresos puede eliminar sus propios registros de egreso en folders abiertos
CREATE POLICY "Usuario_Egresos can delete own expense records"
  ON registros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Egresos'
    ) AND tipo = 'egreso' AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- ============================================
-- Políticas para DEPOSITOS
-- ============================================

-- Dueño y Usuario_Ingresos pueden ver depósitos
CREATE POLICY "Dueño and Usuario_Ingresos can view deposits"
  ON depositos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol IN ('Dueño', 'Usuario_Ingresos')
    )
  );

-- Dueño y Usuario_Ingresos pueden crear depósitos
CREATE POLICY "Dueño and Usuario_Ingresos can create deposits"
  ON depositos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol IN ('Dueño', 'Usuario_Ingresos')
    )
  );

-- Dueño y Usuario_Ingresos pueden actualizar sus propios depósitos
CREATE POLICY "Dueño and Usuario_Ingresos can update own deposits"
  ON depositos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol IN ('Dueño', 'Usuario_Ingresos')
    ) AND registrado_por = auth.uid()
  );

-- Dueño y Usuario_Ingresos pueden eliminar sus propios depósitos
CREATE POLICY "Dueño and Usuario_Ingresos can delete own deposits"
  ON depositos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol IN ('Dueño', 'Usuario_Ingresos')
    ) AND registrado_por = auth.uid()
  );

-- ============================================
-- Políticas para EVIDENCIAS
-- ============================================

-- Los usuarios pueden ver evidencias de sus propios registros o depósitos
CREATE POLICY "Users can view own evidences"
  ON evidencias FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registros
      WHERE id = evidencias.registro_id AND creado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM depositos
      WHERE id = evidencias.deposito_id AND registrado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- Los usuarios pueden crear evidencias para sus propios registros o depósitos
CREATE POLICY "Users can create own evidences"
  ON evidencias FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registros
      WHERE id = evidencias.registro_id AND creado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM depositos
      WHERE id = evidencias.deposito_id AND registrado_por = auth.uid()
    )
  );

-- Los usuarios pueden eliminar evidencias de sus propios registros o depósitos
CREATE POLICY "Users can delete own evidences"
  ON evidencias FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM registros
      WHERE id = evidencias.registro_id AND creado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM depositos
      WHERE id = evidencias.deposito_id AND registrado_por = auth.uid()
    )
  );
