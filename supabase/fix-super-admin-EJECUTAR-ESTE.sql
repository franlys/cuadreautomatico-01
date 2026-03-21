-- =====================================================
-- FIX SUPER ADMIN - EJECUTAR ESTE SCRIPT
-- =====================================================
-- Este script corrige la función is_super_admin() para que
-- Super Admin pueda ver la tabla empresas
-- =====================================================

-- Reemplazar función is_super_admin con la versión corregida
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE user_id = auth.uid()  -- CORRECCIÓN: user_id en lugar de id
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Test 1: Ver tu usuario actual
SELECT 
  '1. Tu usuario:' as test,
  auth.uid() as auth_user_id,
  p.user_id as perfil_user_id,
  p.nombre,
  p.rol,
  p.empresa_id
FROM perfiles p
WHERE p.user_id = auth.uid();

-- Test 2: Ejecutar función is_super_admin
SELECT 
  '2. Función is_super_admin:' as test,
  is_super_admin() as resultado;

-- Test 3: Intentar leer empresas
SELECT 
  '3. Empresas visibles:' as test,
  id,
  nombre,
  nivel_automatizacion,
  activa
FROM empresas
ORDER BY nombre;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Test 1: rol='Super_Admin', empresa_id=NULL
-- Test 2: resultado=TRUE
-- Test 3: Debe mostrar "Empresa 1"
-- =====================================================
