-- ============================================
-- Multi-Tenant Platform - Super Admin RLS Policies (FIXED)
-- ============================================
-- Este archivo implementa políticas RLS especiales para el rol Super_Admin
-- que permiten acceso cross-tenant con filtro opcional por empresa.
-- Requirements: 2.7, 14.4
-- Tarea: 2.2

-- ============================================
-- PASO 1: Crear función helper is_super_admin()
-- ============================================

-- Función que valida si el usuario autenticado es Super_Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE id = auth.uid() 
      AND rol = 'Super_Admin'
  );
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 
  'Retorna TRUE si el usuario autenticado tiene rol Super_Admin';

-- ============================================
-- PASO 2: Políticas RLS para tabla EMPRESAS
-- ============================================

-- Super_Admin puede ver todas las empresas
CREATE POLICY "super_admin_select_empresas"
  ON empresas FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear empresas
CREATE POLICY "super_admin_insert_empresas"
  ON empresas FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Super_Admin puede actualizar empresas
CREATE POLICY "super_admin_update_empresas"
  ON empresas FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Super_Admin puede desactivar empresas (no eliminar físicamente)
CREATE POLICY "super_admin_delete_empresas"
  ON empresas FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 3: Políticas RLS cross-tenant para PERFILES
-- ============================================

-- Super_Admin puede ver perfiles de todas las empresas
CREATE POLICY "super_admin_select_perfiles"
  ON perfiles FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear usuarios en cualquier empresa
CREATE POLICY "super_admin_insert_perfiles"
  ON perfiles FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar perfiles de cualquier empresa
CREATE POLICY "super_admin_update_perfiles"
  ON perfiles FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede desactivar usuarios de cualquier empresa
CREATE POLICY "super_admin_delete_perfiles"
  ON perfiles FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 4: Políticas RLS cross-tenant para EMPLEADOS
-- ============================================

-- Super_Admin puede ver empleados de todas las empresas
CREATE POLICY "super_admin_select_empleados"
  ON empleados FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear empleados en cualquier empresa
CREATE POLICY "super_admin_insert_empleados"
  ON empleados FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar empleados de cualquier empresa
CREATE POLICY "super_admin_update_empleados"
  ON empleados FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar empleados de cualquier empresa
CREATE POLICY "super_admin_delete_empleados"
  ON empleados FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 5: Políticas RLS cross-tenant para RUTAS
-- ============================================

-- Super_Admin puede ver rutas de todas las empresas
CREATE POLICY "super_admin_select_rutas"
  ON rutas FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear rutas en cualquier empresa
CREATE POLICY "super_admin_insert_rutas"
  ON rutas FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar rutas de cualquier empresa
CREATE POLICY "super_admin_update_rutas"
  ON rutas FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar rutas de cualquier empresa
CREATE POLICY "super_admin_delete_rutas"
  ON rutas FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 6: Políticas RLS cross-tenant para CONCEPTOS
-- ============================================

-- Super_Admin puede ver conceptos de todas las empresas
CREATE POLICY "super_admin_select_conceptos"
  ON conceptos FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear conceptos en cualquier empresa
CREATE POLICY "super_admin_insert_conceptos"
  ON conceptos FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar conceptos de cualquier empresa
CREATE POLICY "super_admin_update_conceptos"
  ON conceptos FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar conceptos de cualquier empresa
CREATE POLICY "super_admin_delete_conceptos"
  ON conceptos FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 7: Políticas RLS cross-tenant para SEMANAS_LABORALES
-- ============================================

-- Super_Admin puede ver semanas laborales de todas las empresas
CREATE POLICY "super_admin_select_semanas"
  ON semanas_laborales FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear semanas laborales en cualquier empresa
CREATE POLICY "super_admin_insert_semanas"
  ON semanas_laborales FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar semanas laborales de cualquier empresa
CREATE POLICY "super_admin_update_semanas"
  ON semanas_laborales FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar semanas laborales de cualquier empresa
CREATE POLICY "super_admin_delete_semanas"
  ON semanas_laborales FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 8: Políticas RLS cross-tenant para FOLDERS_DIARIOS
-- ============================================

-- Super_Admin puede ver folders diarios de todas las empresas
CREATE POLICY "super_admin_select_folders"
  ON folders_diarios FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear folders diarios en cualquier empresa
CREATE POLICY "super_admin_insert_folders"
  ON folders_diarios FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar folders diarios de cualquier empresa
CREATE POLICY "super_admin_update_folders"
  ON folders_diarios FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar folders diarios de cualquier empresa
CREATE POLICY "super_admin_delete_folders"
  ON folders_diarios FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 9: Políticas RLS cross-tenant para REGISTROS
-- ============================================

-- Super_Admin puede ver registros de todas las empresas
CREATE POLICY "super_admin_select_registros"
  ON registros FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear registros en cualquier empresa
CREATE POLICY "super_admin_insert_registros"
  ON registros FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar registros de cualquier empresa
CREATE POLICY "super_admin_update_registros"
  ON registros FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar registros de cualquier empresa
CREATE POLICY "super_admin_delete_registros"
  ON registros FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 10: Políticas RLS cross-tenant para DEPOSITOS
-- ============================================

-- Super_Admin puede ver depósitos de todas las empresas
CREATE POLICY "super_admin_select_depositos"
  ON depositos FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear depósitos en cualquier empresa
CREATE POLICY "super_admin_insert_depositos"
  ON depositos FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar depósitos de cualquier empresa
CREATE POLICY "super_admin_update_depositos"
  ON depositos FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar depósitos de cualquier empresa
CREATE POLICY "super_admin_delete_depositos"
  ON depositos FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 11: Políticas RLS cross-tenant para EVIDENCIAS
-- ============================================

-- Super_Admin puede ver evidencias de todas las empresas
CREATE POLICY "super_admin_select_evidencias"
  ON evidencias FOR SELECT
  USING (public.is_super_admin());

-- Super_Admin puede crear evidencias en cualquier empresa
CREATE POLICY "super_admin_insert_evidencias"
  ON evidencias FOR INSERT
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede actualizar evidencias de cualquier empresa
CREATE POLICY "super_admin_update_evidencias"
  ON evidencias FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin() 
    AND empresa_id IS NOT NULL
  );

-- Super_Admin puede eliminar evidencias de cualquier empresa
CREATE POLICY "super_admin_delete_evidencias"
  ON evidencias FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PASO 12: Habilitar RLS en tabla empresas
-- ============================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. La función is_super_admin() valida el rol del usuario autenticado
-- 2. Todas las políticas Super_Admin permiten acceso cross-tenant (sin filtro empresa_id)
-- 3. Las políticas INSERT/UPDATE validan que empresa_id no sea NULL
-- 4. Super_Admin puede filtrar por empresa específica en la capa de aplicación
-- 5. Las políticas Super_Admin tienen prioridad sobre las políticas base (se evalúan con OR)
-- 6. Storage tendrá políticas separadas en la tarea 2.3
