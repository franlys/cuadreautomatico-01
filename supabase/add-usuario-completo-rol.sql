-- ============================================
-- Agregar rol Usuario_Completo
-- ============================================

-- Paso 1: Eliminar el constraint existente
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- Paso 2: Agregar nuevo constraint con Usuario_Completo incluido
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN ('Usuario_Ingresos', 'Usuario_Egresos', 'Usuario_Completo', 'Dueño'));

-- Paso 2: Agregar políticas RLS para Usuario_Completo en REGISTROS
-- Usuario_Completo puede ver todos los registros (ingresos y egresos)
CREATE POLICY "Usuario_Completo can view all records"
  ON registros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede crear registros de ingreso en folders abiertos
CREATE POLICY "Usuario_Completo can create income records"
  ON registros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND tipo = 'ingreso'
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Completo puede crear registros de egreso en folders abiertos
CREATE POLICY "Usuario_Completo can create expense records"
  ON registros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND tipo = 'egreso'
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Completo puede actualizar sus propios registros en folders abiertos
CREATE POLICY "Usuario_Completo can update own records"
  ON registros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Usuario_Completo puede eliminar sus propios registros en folders abiertos
CREATE POLICY "Usuario_Completo can delete own records"
  ON registros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id AND cerrado = false
    )
  );

-- Paso 3: Agregar políticas RLS para Usuario_Completo en DEPOSITOS
-- Usuario_Completo puede ver depósitos
CREATE POLICY "Usuario_Completo can view deposits"
  ON depositos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede crear depósitos
CREATE POLICY "Usuario_Completo can create deposits"
  ON depositos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede actualizar sus propios depósitos
CREATE POLICY "Usuario_Completo can update own deposits"
  ON depositos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND registrado_por = auth.uid()
  );

-- Usuario_Completo puede eliminar sus propios depósitos
CREATE POLICY "Usuario_Completo can delete own deposits"
  ON depositos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    ) AND registrado_por = auth.uid()
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('registros', 'depositos')
  AND policyname LIKE '%Usuario_Completo%'
ORDER BY tablename, policyname;
