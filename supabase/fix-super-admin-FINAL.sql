-- =====================================================
-- FIX FINAL: Función is_super_admin()
-- =====================================================
-- La tabla perfiles usa 'id' como FK a auth.users
-- NO tiene columna 'user_id'
-- =====================================================

-- Reemplazar función is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE id = auth.uid()  -- CORRECTO: usar 'id' que es la FK a auth.users
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Test 1: Ver tu perfil de Super Admin
SELECT 
  '1. Tu perfil:' as test,
  id,
  nombre,
  rol,
  empresa_id
FROM perfiles
WHERE rol = 'Super_Admin';

-- Test 2: Ejecutar función is_super_admin (desde la app funcionará)
-- Nota: En SQL Editor puede retornar FALSE porque auth.uid() es NULL
-- Pero en la aplicación web funcionará correctamente
SELECT 
  '2. Función (puede ser FALSE en SQL Editor):' as test,
  is_super_admin() as resultado;

-- Test 3: Ver empresas (sin filtro RLS desde SQL Editor)
SELECT 
  '3. Empresas en la base de datos:' as test,
  id,
  nombre,
  nivel_automatizacion,
  activa
FROM empresas
ORDER BY nombre;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Test 1: Debe mostrar "Franlys González" con rol='Super_Admin' y empresa_id=NULL
-- Test 2: Puede ser FALSE en SQL Editor (normal), será TRUE en la app
-- Test 3: Debe mostrar "Empresa 1"
-- =====================================================
