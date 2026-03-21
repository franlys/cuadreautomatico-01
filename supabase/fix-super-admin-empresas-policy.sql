-- =====================================================
-- FIX: Política RLS para Super_Admin en tabla empresas
-- =====================================================
-- Problema: Super_Admin no puede leer la tabla empresas
-- Solución: Crear política SELECT que permita a Super_Admin ver todas las empresas
-- =====================================================

-- Primero, verificar si existe la función is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE user_id = auth.uid() 
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Super_Admin puede ver todas las empresas" ON public.empresas;

-- Crear política para que Super_Admin pueda ver todas las empresas
CREATE POLICY "Super_Admin puede ver todas las empresas"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  is_super_admin()
);

-- Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'empresas' 
AND policyname = 'Super_Admin puede ver todas las empresas';

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'empresas';

-- Test: Verificar que la función is_super_admin funciona
SELECT 
  auth.uid() as current_user_id,
  is_super_admin() as es_super_admin,
  (SELECT rol FROM perfiles WHERE user_id = auth.uid()) as rol_actual;

-- Test: Intentar leer empresas
SELECT 
  id,
  nombre,
  nivel_automatizacion,
  activa,
  created_at
FROM empresas
ORDER BY nombre;
