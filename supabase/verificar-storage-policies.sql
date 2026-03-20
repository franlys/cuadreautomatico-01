-- ============================================
-- Verificación de Políticas de Storage Multi-Tenant
-- ============================================
-- Este script verifica que las políticas de Storage
-- para aislamiento multi-tenant estén correctamente configuradas.

\echo '============================================'
\echo 'VERIFICACIÓN DE POLÍTICAS DE STORAGE'
\echo '============================================'
\echo ''

-- ============================================
-- 1. Verificar que las funciones helper existen
-- ============================================

\echo '1. Verificando funciones helper...'
\echo ''

SELECT 
  proname AS "Función",
  pg_get_function_result(oid) AS "Retorna",
  CASE 
    WHEN proname = 'get_user_empresa_id' THEN '✓ Obtiene empresa_id del usuario'
    WHEN proname = 'extract_empresa_id_from_path' THEN '✓ Extrae empresa_id de la ruta'
    WHEN proname = 'is_super_admin' THEN '✓ Valida si es Super Admin'
  END AS "Descripción"
FROM pg_proc
WHERE proname IN ('get_user_empresa_id', 'extract_empresa_id_from_path', 'is_super_admin')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

\echo ''

-- ============================================
-- 2. Verificar políticas de Storage en bucket 'evidencias'
-- ============================================

\echo '2. Verificando políticas de Storage...'
\echo ''

SELECT 
  policyname AS "Política",
  cmd AS "Operación",
  CASE 
    WHEN qual IS NOT NULL THEN '✓ USING definido'
    ELSE '- Sin USING'
  END AS "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN '✓ WITH CHECK definido'
    ELSE '- Sin WITH CHECK'
  END AS "WITH CHECK"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'Multi-tenant:%'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

\echo ''

-- ============================================
-- 3. Contar políticas por operación
-- ============================================

\echo '3. Resumen de políticas por operación...'
\echo ''

SELECT 
  cmd AS "Operación",
  COUNT(*) AS "Cantidad de Políticas",
  CASE 
    WHEN COUNT(*) >= 1 THEN '✓ Configurado'
    ELSE '✗ Falta configurar'
  END AS "Estado"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'Multi-tenant:%'
GROUP BY cmd
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

\echo ''

-- ============================================
-- 4. Verificar que las políticas antiguas fueron eliminadas
-- ============================================

\echo '4. Verificando eliminación de políticas antiguas...'
\echo ''

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ Políticas antiguas eliminadas correctamente'
    ELSE '✗ ADVERTENCIA: Aún existen ' || COUNT(*) || ' políticas antiguas'
  END AS "Estado"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname IN (
    'Usuarios autenticados pueden subir evidencias',
    'Usuarios pueden ver sus propias evidencias',
    'Solo el Dueño puede eliminar evidencias'
  );

\echo ''

-- ============================================
-- 5. Test de función extract_empresa_id_from_path
-- ============================================

\echo '5. Probando función extract_empresa_id_from_path...'
\echo ''

WITH test_cases AS (
  SELECT 
    '550e8400-e29b-41d4-a716-446655440000/evidencias/foto.jpg' AS ruta,
    '550e8400-e29b-41d4-a716-446655440000'::UUID AS esperado,
    'Ruta válida con UUID' AS caso
  UNION ALL
  SELECT 
    'sin-uuid/evidencias/foto.jpg',
    NULL,
    'Ruta sin UUID'
  UNION ALL
  SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    NULL,
    'Solo UUID sin slash'
  UNION ALL
  SELECT 
    '550e8400-e29b-41d4-a716-446655440000/subfolder/otro/archivo.png',
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Ruta válida con múltiples carpetas'
)
SELECT 
  caso AS "Caso de Prueba",
  ruta AS "Ruta",
  esperado AS "Esperado",
  extract_empresa_id_from_path(ruta) AS "Resultado",
  CASE 
    WHEN extract_empresa_id_from_path(ruta) = esperado 
      OR (extract_empresa_id_from_path(ruta) IS NULL AND esperado IS NULL)
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS "Estado"
FROM test_cases;

\echo ''

-- ============================================
-- 6. Verificar RLS está habilitado en storage.objects
-- ============================================

\echo '6. Verificando RLS en storage.objects...'
\echo ''

SELECT 
  schemaname AS "Schema",
  tablename AS "Tabla",
  CASE 
    WHEN rowsecurity THEN '✓ RLS Habilitado'
    ELSE '✗ RLS Deshabilitado'
  END AS "Estado RLS"
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

\echo ''

-- ============================================
-- 7. Resumen de verificación
-- ============================================

\echo '============================================'
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '============================================'
\echo ''

WITH verification AS (
  SELECT 
    'Funciones helper' AS componente,
    (SELECT COUNT(*) FROM pg_proc 
     WHERE proname IN ('get_user_empresa_id', 'extract_empresa_id_from_path', 'is_super_admin')
       AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) AS actual,
    3 AS esperado
  UNION ALL
  SELECT 
    'Políticas SELECT',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' AND schemaname = 'storage' 
       AND policyname LIKE 'Multi-tenant:%' AND cmd = 'SELECT'),
    1
  UNION ALL
  SELECT 
    'Políticas INSERT',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' AND schemaname = 'storage' 
       AND policyname LIKE 'Multi-tenant:%' AND cmd = 'INSERT'),
    1
  UNION ALL
  SELECT 
    'Políticas UPDATE',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' AND schemaname = 'storage' 
       AND policyname LIKE 'Multi-tenant:%' AND cmd = 'UPDATE'),
    1
  UNION ALL
  SELECT 
    'Políticas DELETE',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' AND schemaname = 'storage' 
       AND policyname LIKE 'Multi-tenant:%' AND cmd = 'DELETE'),
    1
  UNION ALL
  SELECT 
    'Políticas antiguas eliminadas',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' AND schemaname = 'storage' 
       AND policyname IN (
         'Usuarios autenticados pueden subir evidencias',
         'Usuarios pueden ver sus propias evidencias',
         'Solo el Dueño puede eliminar evidencias'
       )),
    0
)
SELECT 
  componente AS "Componente",
  actual AS "Actual",
  esperado AS "Esperado",
  CASE 
    WHEN actual = esperado THEN '✓ OK'
    ELSE '✗ ERROR'
  END AS "Estado"
FROM verification;

\echo ''
\echo '============================================'
\echo 'VERIFICACIÓN COMPLETADA'
\echo '============================================'
\echo ''
\echo 'Si todos los estados muestran ✓, las políticas de Storage'
\echo 'multi-tenant están correctamente configuradas.'
\echo ''
\echo 'PRÓXIMOS PASOS:'
\echo '1. Actualizar código cliente para usar prefijo empresa_id/'
\echo '2. Migrar archivos existentes (si aplica)'
\echo '3. Ejecutar tests de seguridad'
\echo ''
