-- ============================================
-- GRANT PERMISOS PARA TABLAS DE CATÁLOGOS
-- ============================================
-- Dar permisos completos al rol authenticated para acceder a las tablas

-- Dar todos los permisos en conceptos
GRANT ALL ON conceptos TO authenticated;
GRANT ALL ON conceptos TO anon;

-- Dar todos los permisos en empleados
GRANT ALL ON empleados TO authenticated;
GRANT ALL ON empleados TO anon;

-- Dar todos los permisos en rutas
GRANT ALL ON rutas TO authenticated;
GRANT ALL ON rutas TO anon;

-- Verificar los permisos
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('conceptos', 'empleados', 'rutas')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;
