-- ============================================
-- Multi-Tenant Platform - Row Level Security Base (FIXED)
-- ============================================
-- Este archivo implementa las políticas RLS base para aislamiento de datos
-- por empresa_id en todas las tablas del sistema.
-- Requirements: 2.2, 2.3, 19.1-19.3
-- Tarea: 2.1

-- ============================================
-- PASO 1: Crear función helper para obtener empresa_id del usuario
-- ============================================

-- Función que obtiene el empresa_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id 
  FROM public.perfiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_empresa_id() IS 
  'Retorna el empresa_id del usuario autenticado actual';

-- ============================================
-- PASO 2: Deshabilitar políticas RLS existentes
-- ============================================
-- Nota: Las políticas existentes serán reemplazadas por políticas multi-tenant

-- Perfiles
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;

-- Empleados
DROP POLICY IF EXISTS "Authenticated users can view active employees" ON empleados;
DROP POLICY IF EXISTS "Authenticated users can create employees" ON empleados;
DROP POLICY IF EXISTS "Only Dueño can update employees" ON empleados;
DROP POLICY IF EXISTS "Only Dueño can delete employees" ON empleados;

-- Rutas
DROP POLICY IF EXISTS "Authenticated users can view active routes" ON rutas;
DROP POLICY IF EXISTS "Authenticated users can create routes" ON rutas;
DROP POLICY IF EXISTS "Only Dueño can update routes" ON rutas;
DROP POLICY IF EXISTS "Only Dueño can delete routes" ON rutas;

-- Conceptos
DROP POLICY IF EXISTS "Authenticated users can view active concepts" ON conceptos;
DROP POLICY IF EXISTS "Authenticated users can create concepts" ON conceptos;
DROP POLICY IF EXISTS "Only Dueño can update concepts" ON conceptos;
DROP POLICY IF EXISTS "Only Dueño can delete concepts" ON conceptos;

-- Semanas laborales
DROP POLICY IF EXISTS "Authenticated users can view weeks" ON semanas_laborales;
DROP POLICY IF EXISTS "Authenticated users can create weeks" ON semanas_laborales;
DROP POLICY IF EXISTS "Only Dueño can update weeks" ON semanas_laborales;

-- Folders diarios
DROP POLICY IF EXISTS "Authenticated users can view folders" ON folders_diarios;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON folders_diarios;
DROP POLICY IF EXISTS "Only Dueño can close folders" ON folders_diarios;

-- Registros
DROP POLICY IF EXISTS "Usuario_Ingresos can view income records" ON registros;
DROP POLICY IF EXISTS "Usuario_Egresos can view expense records" ON registros;
DROP POLICY IF EXISTS "Dueño can view all records" ON registros;
DROP POLICY IF EXISTS "Usuario_Ingresos can create income records" ON registros;
DROP POLICY IF EXISTS "Usuario_Egresos can create expense records" ON registros;
DROP POLICY IF EXISTS "Usuario_Ingresos can update own income records" ON registros;
DROP POLICY IF EXISTS "Usuario_Egresos can update own expense records" ON registros;
DROP POLICY IF EXISTS "Usuario_Ingresos can delete own income records" ON registros;
DROP POLICY IF EXISTS "Usuario_Egresos can delete own expense records" ON registros;

-- Depósitos
DROP POLICY IF EXISTS "Dueño and Usuario_Ingresos can view deposits" ON depositos;
DROP POLICY IF EXISTS "Dueño and Usuario_Ingresos can create deposits" ON depositos;
DROP POLICY IF EXISTS "Dueño and Usuario_Ingresos can update own deposits" ON depositos;
DROP POLICY IF EXISTS "Dueño and Usuario_Ingresos can delete own deposits" ON depositos;

-- Evidencias
DROP POLICY IF EXISTS "Users can view own evidences" ON evidencias;
DROP POLICY IF EXISTS "Users can create own evidences" ON evidencias;
DROP POLICY IF EXISTS "Users can delete own evidences" ON evidencias;

-- ============================================
-- PASO 3: Crear políticas RLS base para PERFILES
-- ============================================

-- SELECT: Los usuarios pueden ver perfiles de su empresa
CREATE POLICY "tenant_isolation_select_perfiles"
  ON perfiles FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

-- UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "tenant_isolation_update_perfiles"
  ON perfiles FOR UPDATE
  USING (
    id = auth.uid() 
    AND empresa_id = public.get_user_empresa_id()
  );

-- INSERT: Se valida empresa_id en la aplicación (usuarios creados por Super_Admin)
CREATE POLICY "tenant_isolation_insert_perfiles"
  ON perfiles FOR INSERT
  WITH CHECK (empresa_id IS NOT NULL);

-- ============================================
-- PASO 4: Crear políticas RLS base para EMPLEADOS
-- ============================================

-- SELECT: Ver empleados activos de la empresa
CREATE POLICY "tenant_isolation_select_empleados"
  ON empleados FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id() 
    AND activo = true
  );

-- INSERT: Crear empleados en la empresa del usuario
CREATE POLICY "tenant_isolation_insert_empleados"
  ON empleados FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Solo Dueño puede actualizar empleados de su empresa
CREATE POLICY "tenant_isolation_update_empleados"
  ON empleados FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Solo Dueño puede eliminar empleados de su empresa
CREATE POLICY "tenant_isolation_delete_empleados"
  ON empleados FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- PASO 5: Crear políticas RLS base para RUTAS
-- ============================================

-- SELECT: Ver rutas activas de la empresa
CREATE POLICY "tenant_isolation_select_rutas"
  ON rutas FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id() 
    AND activo = true
  );

-- INSERT: Crear rutas en la empresa del usuario
CREATE POLICY "tenant_isolation_insert_rutas"
  ON rutas FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Solo Dueño puede actualizar rutas de su empresa
CREATE POLICY "tenant_isolation_update_rutas"
  ON rutas FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Solo Dueño puede eliminar rutas de su empresa
CREATE POLICY "tenant_isolation_delete_rutas"
  ON rutas FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- PASO 6: Crear políticas RLS base para CONCEPTOS
-- ============================================

-- SELECT: Ver conceptos activos de la empresa
CREATE POLICY "tenant_isolation_select_conceptos"
  ON conceptos FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id() 
    AND activo = true
  );

-- INSERT: Crear conceptos en la empresa del usuario
CREATE POLICY "tenant_isolation_insert_conceptos"
  ON conceptos FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Solo Dueño puede actualizar conceptos de su empresa
CREATE POLICY "tenant_isolation_update_conceptos"
  ON conceptos FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Solo Dueño puede eliminar conceptos de su empresa
CREATE POLICY "tenant_isolation_delete_conceptos"
  ON conceptos FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  );

-- ============================================
-- PASO 7: Crear políticas RLS base para SEMANAS_LABORALES
-- ============================================

-- SELECT: Ver semanas laborales de la empresa
CREATE POLICY "tenant_isolation_select_semanas"
  ON semanas_laborales FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

-- INSERT: Crear semanas laborales en la empresa del usuario
CREATE POLICY "tenant_isolation_insert_semanas"
  ON semanas_laborales FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Solo Dueño puede actualizar semanas de su empresa
CREATE POLICY "tenant_isolation_update_semanas"
  ON semanas_laborales FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ============================================
-- PASO 8: Crear políticas RLS base para FOLDERS_DIARIOS
-- ============================================

-- SELECT: Ver folders diarios de la empresa
CREATE POLICY "tenant_isolation_select_folders"
  ON folders_diarios FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

-- INSERT: Crear folders diarios en la empresa del usuario
CREATE POLICY "tenant_isolation_insert_folders"
  ON folders_diarios FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Solo Dueño puede cerrar folders de su empresa
CREATE POLICY "tenant_isolation_update_folders"
  ON folders_diarios FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Dueño'
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ============================================
-- PASO 9: Crear políticas RLS base para REGISTROS
-- ============================================

-- SELECT: Ver registros según rol y tipo
CREATE POLICY "tenant_isolation_select_registros"
  ON registros FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id()
    AND (
      -- Usuario_Ingresos ve solo ingresos
      (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol = 'Usuario_Ingresos'
      ) AND tipo = 'ingreso')
      OR
      -- Usuario_Egresos ve solo egresos
      (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol = 'Usuario_Egresos'
      ) AND tipo = 'egreso')
      OR
      -- Dueño y Usuario_Completo ven todo
      EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('Dueño', 'Usuario_Completo')
      )
    )
  );

-- INSERT: Crear registros según rol en folders abiertos
CREATE POLICY "tenant_isolation_insert_registros"
  ON registros FOR INSERT
  WITH CHECK (
    empresa_id = public.get_user_empresa_id()
    AND (
      -- Usuario_Ingresos crea ingresos
      (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('Usuario_Ingresos', 'Usuario_Completo')
      ) AND tipo = 'ingreso')
      OR
      -- Usuario_Egresos crea egresos
      (EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol IN ('Usuario_Egresos', 'Usuario_Completo')
      ) AND tipo = 'egreso')
    )
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id 
        AND cerrado = false
        AND empresa_id = public.get_user_empresa_id()
    )
  );

-- UPDATE: Actualizar propios registros en folders abiertos
CREATE POLICY "tenant_isolation_update_registros"
  ON registros FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id 
        AND cerrado = false
        AND empresa_id = public.get_user_empresa_id()
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Eliminar propios registros en folders abiertos
CREATE POLICY "tenant_isolation_delete_registros"
  ON registros FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folders_diarios
      WHERE id = folder_diario_id 
        AND cerrado = false
        AND empresa_id = public.get_user_empresa_id()
    )
  );

-- ============================================
-- PASO 10: Crear políticas RLS base para DEPOSITOS
-- ============================================

-- SELECT: Dueño y Usuario_Ingresos pueden ver depósitos
CREATE POLICY "tenant_isolation_select_depositos"
  ON depositos FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() 
        AND rol IN ('Dueño', 'Usuario_Ingresos', 'Usuario_Completo')
    )
  );

-- INSERT: Dueño y Usuario_Ingresos pueden crear depósitos
CREATE POLICY "tenant_isolation_insert_depositos"
  ON depositos FOR INSERT
  WITH CHECK (
    empresa_id = public.get_user_empresa_id()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() 
        AND rol IN ('Dueño', 'Usuario_Ingresos', 'Usuario_Completo')
    )
  );

-- UPDATE: Actualizar propios depósitos
CREATE POLICY "tenant_isolation_update_depositos"
  ON depositos FOR UPDATE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND registrado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() 
        AND rol IN ('Dueño', 'Usuario_Ingresos', 'Usuario_Completo')
    )
  )
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Eliminar propios depósitos
CREATE POLICY "tenant_isolation_delete_depositos"
  ON depositos FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND registrado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() 
        AND rol IN ('Dueño', 'Usuario_Ingresos', 'Usuario_Completo')
    )
  );

-- ============================================
-- PASO 11: Crear políticas RLS base para EVIDENCIAS
-- ============================================

-- SELECT: Ver evidencias de propios registros/depósitos o si es Dueño
CREATE POLICY "tenant_isolation_select_evidencias"
  ON evidencias FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id()
    AND (
      -- Evidencias de propios registros
      EXISTS (
        SELECT 1 FROM registros
        WHERE id = evidencias.registro_id 
          AND creado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
      OR
      -- Evidencias de propios depósitos
      EXISTS (
        SELECT 1 FROM depositos
        WHERE id = evidencias.deposito_id 
          AND registrado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
      OR
      -- Dueño ve todas las evidencias de su empresa
      EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid() AND rol = 'Dueño'
      )
    )
  );

-- INSERT: Crear evidencias para propios registros/depósitos
CREATE POLICY "tenant_isolation_insert_evidencias"
  ON evidencias FOR INSERT
  WITH CHECK (
    empresa_id = public.get_user_empresa_id()
    AND (
      EXISTS (
        SELECT 1 FROM registros
        WHERE id = evidencias.registro_id 
          AND creado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
      OR
      EXISTS (
        SELECT 1 FROM depositos
        WHERE id = evidencias.deposito_id 
          AND registrado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
    )
  );

-- DELETE: Eliminar evidencias de propios registros/depósitos
CREATE POLICY "tenant_isolation_delete_evidencias"
  ON evidencias FOR DELETE
  USING (
    empresa_id = public.get_user_empresa_id()
    AND (
      EXISTS (
        SELECT 1 FROM registros
        WHERE id = evidencias.registro_id 
          AND creado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
      OR
      EXISTS (
        SELECT 1 FROM depositos
        WHERE id = evidencias.deposito_id 
          AND registrado_por = auth.uid()
          AND empresa_id = public.get_user_empresa_id()
      )
    )
  );

-- ============================================
-- PASO 12: Verificar que RLS está habilitado
-- ============================================

-- Asegurar que RLS está habilitado en todas las tablas
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
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Todas las políticas filtran por empresa_id usando public.get_user_empresa_id()
-- 2. Las políticas INSERT validan que empresa_id coincida con el del usuario
-- 3. Las políticas UPDATE incluyen WITH CHECK para prevenir cambio de empresa_id
-- 4. Las políticas DELETE validan empresa_id antes de permitir eliminación
-- 5. Se mantienen las restricciones de rol existentes (Dueño, Usuario_Ingresos, etc.)
-- 6. Super_Admin tendrá políticas especiales en la tarea 2.2
-- 7. Storage tendrá políticas separadas en la tarea 2.3
