-- ============================================
-- DIAGNÓSTICO: Verificar usuario y permisos
-- ============================================

-- 1. Ver todos los usuarios y sus roles
SELECT 
  u.id,
  u.email,
  p.nombre,
  p.rol,
  p.intentos_fallidos,
  p.bloqueado_hasta,
  u.created_at
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. Ver políticas activas para registros
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'registros'
ORDER BY cmd, policyname;

-- 3. Verificar si el usuario actual tiene perfil
SELECT 
  auth.uid() as user_id,
  p.nombre,
  p.rol
FROM perfiles p
WHERE p.id = auth.uid();

-- 4. Probar si el usuario puede ver registros
SELECT COUNT(*) as total_registros
FROM registros;

-- 5. Ver todas las políticas para Usuario_Completo
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Usuario_Completo%'
ORDER BY tablename, cmd;
