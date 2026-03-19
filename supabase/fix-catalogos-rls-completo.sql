-- ============================================
-- FIX COMPLETO: POLÍTICAS RLS PARA CATÁLOGOS
-- ============================================
-- Este script elimina las políticas antiguas y crea nuevas
-- que incluyen correctamente a Usuario_Completo

-- ============================================
-- TABLA: conceptos
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view active concepts" ON conceptos;
DROP POLICY IF EXISTS "Authenticated users can create concepts" ON conceptos;
DROP POLICY IF EXISTS "Only Dueño can update concepts" ON conceptos;
DROP POLICY IF EXISTS "Only Dueño can delete concepts" ON conceptos;
DROP POLICY IF EXISTS "conceptos_select_usuario_completo" ON conceptos;
DROP POLICY IF EXISTS "conceptos_insert_usuario_completo" ON conceptos;
DROP POLICY IF EXISTS "conceptos_update_usuario_completo" ON conceptos;
DROP POLICY IF EXISTS "conceptos_delete_usuario_completo" ON conceptos;

-- SELECT: Todos los usuarios autenticados pueden ver conceptos activos
CREATE POLICY "Usuarios pueden ver conceptos activos"
ON conceptos
FOR SELECT
TO authenticated
USING (activo = true);

-- INSERT: Todos los usuarios autenticados pueden crear conceptos
CREATE POLICY "Usuarios pueden crear conceptos"
ON conceptos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Usuario_Completo, Usuario_Ingresos, Usuario_Egresos y Dueño pueden actualizar
CREATE POLICY "Usuarios autorizados pueden actualizar conceptos"
ON conceptos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
);

-- DELETE: Usuario_Completo y Dueño pueden eliminar
CREATE POLICY "Usuario_Completo y Dueño pueden eliminar conceptos"
ON conceptos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Dueño')
  )
);

-- ============================================
-- TABLA: empleados
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view active employees" ON empleados;
DROP POLICY IF EXISTS "Authenticated users can create employees" ON empleados;
DROP POLICY IF EXISTS "Only Dueño can update employees" ON empleados;
DROP POLICY IF EXISTS "Only Dueño can delete employees" ON empleados;
DROP POLICY IF EXISTS "empleados_select_usuario_completo" ON empleados;
DROP POLICY IF EXISTS "empleados_insert_usuario_completo" ON empleados;
DROP POLICY IF EXISTS "empleados_update_usuario_completo" ON empleados;
DROP POLICY IF EXISTS "empleados_delete_usuario_completo" ON empleados;

-- SELECT: Todos los usuarios autenticados pueden ver empleados activos
CREATE POLICY "Usuarios pueden ver empleados activos"
ON empleados
FOR SELECT
TO authenticated
USING (activo = true);

-- INSERT: Todos los usuarios autenticados pueden crear empleados
CREATE POLICY "Usuarios pueden crear empleados"
ON empleados
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Usuario_Completo, Usuario_Ingresos, Usuario_Egresos y Dueño pueden actualizar
CREATE POLICY "Usuarios autorizados pueden actualizar empleados"
ON empleados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
);

-- DELETE: Usuario_Completo y Dueño pueden eliminar
CREATE POLICY "Usuario_Completo y Dueño pueden eliminar empleados"
ON empleados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Dueño')
  )
);

-- ============================================
-- TABLA: rutas
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view active routes" ON rutas;
DROP POLICY IF EXISTS "Authenticated users can create routes" ON rutas;
DROP POLICY IF EXISTS "Only Dueño can update routes" ON rutas;
DROP POLICY IF EXISTS "Only Dueño can delete routes" ON rutas;
DROP POLICY IF EXISTS "rutas_select_usuario_completo" ON rutas;
DROP POLICY IF EXISTS "rutas_insert_usuario_completo" ON rutas;
DROP POLICY IF EXISTS "rutas_update_usuario_completo" ON rutas;
DROP POLICY IF EXISTS "rutas_delete_usuario_completo" ON rutas;

-- SELECT: Todos los usuarios autenticados pueden ver rutas activas
CREATE POLICY "Usuarios pueden ver rutas activas"
ON rutas
FOR SELECT
TO authenticated
USING (activo = true);

-- INSERT: Todos los usuarios autenticados pueden crear rutas
CREATE POLICY "Usuarios pueden crear rutas"
ON rutas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Usuario_Completo, Usuario_Ingresos, Usuario_Egresos y Dueño pueden actualizar
CREATE POLICY "Usuarios autorizados pueden actualizar rutas"
ON rutas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño')
  )
);

-- DELETE: Usuario_Completo y Dueño pueden eliminar
CREATE POLICY "Usuario_Completo y Dueño pueden eliminar rutas"
ON rutas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('Usuario_Completo', 'Dueño')
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('conceptos', 'empleados', 'rutas')
ORDER BY tablename, cmd;
