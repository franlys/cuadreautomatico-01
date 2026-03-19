-- ============================================
-- FIX: Agregar políticas RLS para Usuario_Completo
-- ============================================
-- Este script agrega todas las políticas necesarias para que
-- el rol Usuario_Completo tenga permisos completos

-- ============================================
-- REGISTROS - Usuario_Completo
-- ============================================

-- Ver todos los registros
CREATE POLICY "Usuario_Completo puede ver todos los registros"
ON registros FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Crear registros (ingresos y egresos)
CREATE POLICY "Usuario_Completo puede crear registros"
ON registros FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Actualizar registros
CREATE POLICY "Usuario_Completo puede actualizar registros"
ON registros FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Eliminar registros
CREATE POLICY "Usuario_Completo puede eliminar registros"
ON registros FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- DEPÓSITOS - Usuario_Completo
-- ============================================

-- Ver todos los depósitos
CREATE POLICY "Usuario_Completo puede ver depósitos"
ON depositos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Crear depósitos
CREATE POLICY "Usuario_Completo puede crear depósitos"
ON depositos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Actualizar depósitos
CREATE POLICY "Usuario_Completo puede actualizar depósitos"
ON depositos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Eliminar depósitos
CREATE POLICY "Usuario_Completo puede eliminar depósitos"
ON depositos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- FOLDERS DIARIOS - Usuario_Completo
-- ============================================

-- Ver folders
CREATE POLICY "Usuario_Completo puede ver folders"
ON folders_diarios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Crear folders
CREATE POLICY "Usuario_Completo puede crear folders"
ON folders_diarios FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Actualizar folders (cerrar)
CREATE POLICY "Usuario_Completo puede actualizar folders"
ON folders_diarios FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- SEMANAS LABORALES - Usuario_Completo
-- ============================================

-- Ver semanas
CREATE POLICY "Usuario_Completo puede ver semanas"
ON semanas_laborales FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- Crear semanas
CREATE POLICY "Usuario_Completo puede crear semanas"
ON semanas_laborales FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- CATÁLOGOS - Usuario_Completo
-- ============================================

-- EMPLEADOS
CREATE POLICY "Usuario_Completo puede ver empleados"
ON empleados FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede crear empleados"
ON empleados FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede actualizar empleados"
ON empleados FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede eliminar empleados"
ON empleados FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- RUTAS
CREATE POLICY "Usuario_Completo puede ver rutas"
ON rutas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede crear rutas"
ON rutas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede actualizar rutas"
ON rutas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede eliminar rutas"
ON rutas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- CONCEPTOS
CREATE POLICY "Usuario_Completo puede ver conceptos"
ON conceptos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede crear conceptos"
ON conceptos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede actualizar conceptos"
ON conceptos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede eliminar conceptos"
ON conceptos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- EVIDENCIAS - Usuario_Completo
-- ============================================

CREATE POLICY "Usuario_Completo puede ver evidencias"
ON evidencias FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede crear evidencias"
ON evidencias FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

CREATE POLICY "Usuario_Completo puede eliminar evidencias"
ON evidencias FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- VERIFICAR POLÍTICAS CREADAS
-- ============================================

-- Ver todas las políticas para Usuario_Completo
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Usuario_Completo%'
ORDER BY tablename, cmd;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
