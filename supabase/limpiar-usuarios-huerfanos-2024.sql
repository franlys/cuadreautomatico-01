-- =====================================================
-- LIMPIAR USUARIOS HUÉRFANOS - Versión 2024
-- =====================================================
-- Elimina usuarios de auth.users que NO tienen perfil
-- (usuarios creados pero que fallaron al crear el perfil)
-- =====================================================

-- PASO 1: Ver usuarios huérfanos ANTES de eliminar
SELECT 
  '=== USUARIOS HUÉRFANOS (antes de eliminar) ===' as seccion,
  u.id,
  u.email,
  u.created_at,
  'SIN PERFIL' as estado
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email NOT LIKE '%@supabase%' -- Excluir usuarios del sistema
ORDER BY u.created_at DESC;

-- PASO 2: Contar cuántos usuarios huérfanos hay
SELECT 
  '=== TOTAL DE HUÉRFANOS ===' as seccion,
  COUNT(*) as total_huerfanos
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email NOT LIKE '%@supabase%';

-- PASO 3: Eliminar usuarios huérfanos de auth.users
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN perfiles p ON u.id = p.id
  WHERE p.id IS NULL
    AND u.email NOT LIKE '%@supabase%'
);

-- PASO 4: Verificar que se eliminaron
SELECT 
  '=== USUARIOS HUÉRFANOS (después de eliminar) ===' as seccion,
  COUNT(*) as huerfanos_restantes
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email NOT LIKE '%@supabase%';

-- PASO 5: Ver usuarios válidos que quedaron
SELECT 
  '=== USUARIOS VÁLIDOS (con perfil) ===' as seccion,
  u.email,
  p.nombre,
  p.rol,
  e.nombre as empresa
FROM auth.users u
INNER JOIN perfiles p ON u.id = p.id
LEFT JOIN empresas e ON p.empresa_id = e.id
ORDER BY p.created_at;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 1. Lista de huérfanos antes de eliminar
-- 2. Total de huérfanos
-- 3. Eliminación exitosa
-- 4. 0 huérfanos restantes
-- 5. Lista de usuarios válidos (Franlys, mayckol, etc.)
-- =====================================================
