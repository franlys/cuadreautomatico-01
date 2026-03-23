-- =====================================================
-- FIX RLS PERFILES - Solución con Service Role
-- =====================================================
-- Problema: Las políticas RLS usan auth.uid() que requiere
-- que el usuario esté autenticado en la sesión.
-- 
-- Solución: Crear una función SECURITY DEFINER que bypasea RLS
-- para que Super Admin pueda crear usuarios desde la app.
-- =====================================================

-- OPCIÓN 1: Función para crear perfiles (bypasea RLS)
CREATE OR REPLACE FUNCTION public.create_perfil_as_super_admin(
  p_id UUID,
  p_nombre TEXT,
  p_rol TEXT,
  p_empresa_id UUID
)
RETURNS SETOF perfiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es Super Admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Solo Super Admin puede crear perfiles';
  END IF;

  -- Insertar perfil (bypasea RLS porque es SECURITY DEFINER)
  RETURN QUERY
  INSERT INTO perfiles (id, nombre, rol, empresa_id, intentos_fallidos, bloqueado_hasta)
  VALUES (p_id, p_nombre, p_rol::perfiles_rol, p_empresa_id, 0, NULL)
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.create_perfil_as_super_admin IS 
  'Crea un perfil como Super Admin, bypasseando RLS';

-- OPCIÓN 2: Política RLS más permisiva para INSERT
-- Esta permite INSERT si el usuario autenticado es Super Admin
-- O si el perfil que se está creando pertenece a la misma empresa

DROP POLICY IF EXISTS perfiles_insert_policy ON perfiles;

CREATE POLICY "perfiles_insert_policy"
ON perfiles FOR INSERT
TO authenticated
WITH CHECK (
  -- Super Admin puede crear en cualquier empresa
  public.is_super_admin()
  OR
  -- O el perfil se crea en la empresa del usuario autenticado
  empresa_id = public.get_user_empresa_id()
);

-- Verificar que la política se creó correctamente
SELECT 
  'Política INSERT actualizada:' as resultado,
  policyname,
  cmd,
  with_check::text as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'perfiles'
  AND cmd = 'INSERT';

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
-- 
-- OPCIÓN A: Usar la función (recomendado)
-- Modifica UserService.ts para usar:
-- 
-- const { data: perfil } = await supabase.rpc('create_perfil_as_super_admin', {
--   p_id: authData.user.id,
--   p_nombre: data.nombre,
--   p_rol: data.rol,
--   p_empresa_id: data.empresa_id
-- });
--
-- OPCIÓN B: Usar la política actualizada
-- Mantén el código actual, la política ahora es más permisiva
-- 
-- =====================================================
