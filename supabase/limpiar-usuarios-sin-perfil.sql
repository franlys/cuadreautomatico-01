-- =====================================================
-- Limpiar usuarios en auth.users que no tienen perfil
-- =====================================================

-- Ver usuarios en auth.users que NO tienen perfil
SELECT 
  '1. Usuarios en auth sin perfil:' as paso,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN perfiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Ver todos los emails registrados
SELECT 
  '2. Todos los emails en auth.users:' as paso,
  email,
  created_at,
  CASE 
    WHEN id IN (SELECT id FROM perfiles) THEN 'Con perfil'
    ELSE 'Sin perfil'
  END as estado
FROM auth.users
ORDER BY created_at DESC;

-- OPCIONAL: Eliminar usuarios sin perfil
-- DESCOMENTA las siguientes líneas si quieres eliminar los usuarios huérfanos

DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN perfiles p ON p.id = u.id
  WHERE p.id IS NULL
);

SELECT '3. Usuarios sin perfil eliminados' as resultado;

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
-- 1. Ejecuta este script primero para ver los usuarios sin perfil
-- 2. Si quieres eliminarlos, descomenta la sección OPCIONAL
-- 3. Después podrás crear usuarios con esos emails de nuevo
-- =====================================================
