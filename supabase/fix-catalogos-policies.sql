-- ============================================
-- POLÍTICAS RLS PARA CATÁLOGOS - USUARIO_COMPLETO
-- ============================================
-- Este script agrega las políticas RLS faltantes para que
-- Usuario_Completo pueda acceder a las tablas de catálogos

-- ============================================
-- TABLA: conceptos
-- ============================================

-- SELECT: Usuario_Completo puede ver todos los conceptos
DROP POLICY IF EXISTS "conceptos_select_usuario_completo" ON conceptos;
CREATE POLICY "conceptos_select_usuario_completo"
ON conceptos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- INSERT: Usuario_Completo puede crear conceptos
DROP POLICY IF EXISTS "conceptos_insert_usuario_completo" ON conceptos;
CREATE POLICY "conceptos_insert_usuario_completo"
ON conceptos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- UPDATE: Usuario_Completo puede actualizar conceptos
DROP POLICY IF EXISTS "conceptos_update_usuario_completo" ON conceptos;
CREATE POLICY "conceptos_update_usuario_completo"
ON conceptos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- DELETE: Usuario_Completo puede eliminar conceptos
DROP POLICY IF EXISTS "conceptos_delete_usuario_completo" ON conceptos;
CREATE POLICY "conceptos_delete_usuario_completo"
ON conceptos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- TABLA: empleados
-- ============================================

-- SELECT: Usuario_Completo puede ver todos los empleados
DROP POLICY IF EXISTS "empleados_select_usuario_completo" ON empleados;
CREATE POLICY "empleados_select_usuario_completo"
ON empleados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- INSERT: Usuario_Completo puede crear empleados
DROP POLICY IF EXISTS "empleados_insert_usuario_completo" ON empleados;
CREATE POLICY "empleados_insert_usuario_completo"
ON empleados
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- UPDATE: Usuario_Completo puede actualizar empleados
DROP POLICY IF EXISTS "empleados_update_usuario_completo" ON empleados;
CREATE POLICY "empleados_update_usuario_completo"
ON empleados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- DELETE: Usuario_Completo puede eliminar empleados
DROP POLICY IF EXISTS "empleados_delete_usuario_completo" ON empleados;
CREATE POLICY "empleados_delete_usuario_completo"
ON empleados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- ============================================
-- TABLA: rutas
-- ============================================

-- SELECT: Usuario_Completo puede ver todas las rutas
DROP POLICY IF EXISTS "rutas_select_usuario_completo" ON rutas;
CREATE POLICY "rutas_select_usuario_completo"
ON rutas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- INSERT: Usuario_Completo puede crear rutas
DROP POLICY IF EXISTS "rutas_insert_usuario_completo" ON rutas;
CREATE POLICY "rutas_insert_usuario_completo"
ON rutas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- UPDATE: Usuario_Completo puede actualizar rutas
DROP POLICY IF EXISTS "rutas_update_usuario_completo" ON rutas;
CREATE POLICY "rutas_update_usuario_completo"
ON rutas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
  )
);

-- DELETE: Usuario_Completo puede eliminar rutas
DROP POLICY IF EXISTS "rutas_delete_usuario_completo" ON rutas;
CREATE POLICY "rutas_delete_usuario_completo"
ON rutas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'Usuario_Completo'
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
  AND policyname ILIKE '%usuario_completo%'
ORDER BY tablename, cmd;
