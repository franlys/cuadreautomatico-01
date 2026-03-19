-- ============================================
-- Invertir Roles: Usuario_Completo = Operador, Dueño = Solo Lectura
-- ============================================

-- IMPORTANTE: Este script invierte completamente los permisos
-- Usuario_Completo tendrá permisos de edición/eliminación
-- Dueño solo tendrá permisos de lectura y exportación

-- ============================================
-- PASO 1: Eliminar políticas existentes
-- ============================================

-- Eliminar políticas de EMPLEADOS
DROP POLICY IF EXISTS "Only Dueño can update employees" ON empleados;
DROP POLICY IF EXISTS "Only Dueño can delete employees" ON empleados;
DROP POLICY IF EXISTS "Usuario_Completo can update employees" ON empleados;
DROP POLICY IF EXISTS "Usuario_Completo can delete employees" ON empleados;

-- Eliminar políticas de RUTAS
DROP POLICY IF EXISTS "Only Dueño can update routes" ON rutas;
DROP POLICY IF EXISTS "Only Dueño can delete routes" ON rutas;
DROP POLICY IF EXISTS "Usuario_Completo can update routes" ON rutas;
DROP POLICY IF EXISTS "Usuario_Completo can delete routes" ON rutas;

-- Eliminar políticas de CONCEPTOS
DROP POLICY IF EXISTS "Only Dueño can update concepts" ON conceptos;
DROP POLICY IF EXISTS "Only Dueño can delete concepts" ON conceptos;
DROP POLICY IF EXISTS "Usuario_Completo can update concepts" ON conceptos;
DROP POLICY IF EXISTS "Usuario_Completo can delete concepts" ON conceptos;

-- Eliminar políticas de FOLDERS_DIARIOS
DROP POLICY IF EXISTS "Only Dueño can close folders" ON folders_diarios;
DROP POLICY IF EXISTS "Usuario_Completo can close folders" ON folders_diarios;

-- Eliminar políticas de SEMANAS_LABORALES
DROP POLICY IF EXISTS "Only Dueño can update weeks" ON semanas_laborales;
DROP POLICY IF EXISTS "Usuario_Completo can update weeks" ON semanas_laborales;

-- ============================================
-- PASO 2: Crear nuevas políticas para EMPLEADOS
-- ============================================

-- Usuario_Completo puede actualizar empleados
CREATE POLICY "Usuario_Completo can update employees"
  ON empleados FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede eliminar empleados
CREATE POLICY "Usuario_Completo can delete employees"
  ON empleados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- ============================================
-- PASO 3: Crear nuevas políticas para RUTAS
-- ============================================

-- Usuario_Completo puede actualizar rutas
CREATE POLICY "Usuario_Completo can update routes"
  ON rutas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede eliminar rutas
CREATE POLICY "Usuario_Completo can delete routes"
  ON rutas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- ============================================
-- PASO 4: Crear nuevas políticas para CONCEPTOS
-- ============================================

-- Usuario_Completo puede actualizar conceptos
CREATE POLICY "Usuario_Completo can update concepts"
  ON conceptos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- Usuario_Completo puede eliminar conceptos
CREATE POLICY "Usuario_Completo can delete concepts"
  ON conceptos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- ============================================
-- PASO 5: Crear nuevas políticas para FOLDERS_DIARIOS
-- ============================================

-- Usuario_Completo puede cerrar folders
CREATE POLICY "Usuario_Completo can close folders"
  ON folders_diarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- ============================================
-- PASO 6: Crear nuevas políticas para SEMANAS_LABORALES
-- ============================================

-- Usuario_Completo puede actualizar semanas laborales
CREATE POLICY "Usuario_Completo can update weeks"
  ON semanas_laborales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid() AND rol = 'Usuario_Completo'
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas de empleados
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'empleados'
ORDER BY policyname;

-- Verificar políticas de rutas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'rutas'
ORDER BY policyname;

-- Verificar políticas de conceptos
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'conceptos'
ORDER BY policyname;

-- Verificar políticas de folders_diarios
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'folders_diarios'
ORDER BY policyname;

-- ============================================
-- RESUMEN DE PERMISOS DESPUÉS DEL CAMBIO
-- ============================================

/*
USUARIO_COMPLETO (Operador Principal):
- ✅ Ver, crear, editar y eliminar empleados
- ✅ Ver, crear, editar y eliminar rutas
- ✅ Ver, crear, editar y eliminar conceptos
- ✅ Ver, crear, editar y eliminar registros (ingresos/egresos)
- ✅ Ver, crear, editar y eliminar depósitos
- ✅ Ver, crear y cerrar folders diarios
- ✅ Ver y actualizar semanas laborales

DUEÑO (Solo Supervisión):
- ✅ Ver todo (empleados, rutas, conceptos, registros, depósitos, folders, semanas)
- ✅ Exportar PDF/XLSX (funcionalidad del frontend, no requiere permisos especiales)
- ✅ Ver dashboard en tiempo real
- ❌ NO puede editar ni eliminar nada

USUARIO_INGRESOS:
- ✅ Ver y crear empleados, rutas, conceptos
- ✅ Ver y crear registros de ingreso
- ✅ Ver, crear, editar y eliminar depósitos propios
- ❌ NO puede editar/eliminar catálogos
- ❌ NO puede ver/crear egresos

USUARIO_EGRESOS:
- ✅ Ver y crear empleados, rutas, conceptos
- ✅ Ver y crear registros de egreso
- ❌ NO puede editar/eliminar catálogos
- ❌ NO puede ver/crear ingresos ni depósitos
*/
