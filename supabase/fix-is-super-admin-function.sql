-- =====================================================
-- FIX CRÍTICO: Función is_super_admin()
-- =====================================================
-- Problema: La función usa 'id = auth.uid()' pero debe usar 'user_id = auth.uid()'
-- La columna 'id' es el UUID del perfil, 'user_id' es el UUID del auth.users
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.is_super_admin();

-- Crear función corregida
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE user_id = auth.uid()  -- CORRECCIÓN: usar user_id en lugar de id
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_super_admin() IS 
  'Retorna TRUE si el usuario autenticado tiene rol Super_Admin. Usa user_id para comparar con auth.uid()';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Test 1: Ver tu usuario actual
SELECT 
  'Tu usuario:' as info,
  auth.uid() as auth_user_id,
  p.id as perfil_id,
  p.user_id as perfil_user_id,
  p.nombre,
  p.rol,
  p.empresa_id
FROM perfiles p
WHERE p.user_id = auth.uid();

-- Test 2: Ejecutar función is_super_admin
SELECT 
  'Resultado función:' as info,
  is_super_admin() as es_super_admin;

-- Test 3: Intentar leer empresas
SELECT 
  'Empresas visibles:' as info,
  id,
  nombre,
  nivel_automatizacion,
  activa
FROM empresas
ORDER BY nombre;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Test 1: Debe mostrar tu usuario con rol='Super_Admin' y empresa_id=NULL
-- Test 2: is_super_admin() debe retornar TRUE
-- Test 3: Debe mostrar "Empresa 1" y cualquier otra empresa
-- =====================================================
