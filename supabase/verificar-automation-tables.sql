-- ============================================
-- Script de Verificación - Tablas de Automatización Completa
-- ============================================
-- Este script verifica que todas las tablas, índices, constraints
-- y políticas RLS se hayan creado correctamente.
-- ============================================

\echo '============================================'
\echo 'VERIFICACIÓN DE TABLAS DE AUTOMATIZACIÓN'
\echo '============================================'
\echo ''

-- ============================================
-- 1. Verificar existencia de tablas
-- ============================================
\echo '1. Verificando existencia de tablas...'
\echo ''

SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN '✓ Todas las tablas existen'
    ELSE '✗ Faltan ' || (5 - COUNT(*))::text || ' tablas'
  END as resultado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  );

\echo ''
\echo 'Detalle de tablas:'
SELECT 
  table_name as "Tabla",
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    ) THEN '✓ Existe'
    ELSE '✗ No existe'
  END as "Estado"
FROM (
  VALUES 
    ('hojas_ruta'),
    ('facturas_ruta'),
    ('gastos_ruta'),
    ('balance_ruta_historico'),
    ('audit_logs')
) AS t(table_name)
ORDER BY table_name;

-- ============================================
-- 2. Verificar columnas de hojas_ruta
-- ============================================
\echo ''
\echo '2. Verificando columnas de hojas_ruta...'
\echo ''

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable",
  column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hojas_ruta'
ORDER BY ordinal_position;

-- ============================================
-- 3. Verificar columnas de facturas_ruta
-- ============================================
\echo ''
\echo '3. Verificando columnas de facturas_ruta...'
\echo ''

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'facturas_ruta'
ORDER BY ordinal_position;

-- ============================================
-- 4. Verificar columnas de gastos_ruta
-- ============================================
\echo ''
\echo '4. Verificando columnas de gastos_ruta...'
\echo ''

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gastos_ruta'
ORDER BY ordinal_position;

-- ============================================
-- 5. Verificar columnas de balance_ruta_historico
-- ============================================
\echo ''
\echo '5. Verificando columnas de balance_ruta_historico...'
\echo ''

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'balance_ruta_historico'
ORDER BY ordinal_position;

-- ============================================
-- 6. Verificar columnas de audit_logs
-- ============================================
\echo ''
\echo '6. Verificando columnas de audit_logs...'
\echo ''

SELECT 
  column_name as "Columna",
  data_type as "Tipo",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- ============================================
-- 7. Verificar constraints
-- ============================================
\echo ''
\echo '7. Verificando constraints...'
\echo ''

SELECT 
  tc.table_name as "Tabla",
  tc.constraint_name as "Constraint",
  tc.constraint_type as "Tipo"
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 8. Verificar foreign keys
-- ============================================
\echo ''
\echo '8. Verificando foreign keys...'
\echo ''

SELECT 
  tc.table_name as "Tabla Origen",
  kcu.column_name as "Columna",
  ccu.table_name as "Tabla Referenciada",
  ccu.column_name as "Columna Referenciada"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 9. Verificar índices
-- ============================================
\echo ''
\echo '9. Verificando índices...'
\echo ''

SELECT 
  tablename as "Tabla",
  indexname as "Índice",
  indexdef as "Definición"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY tablename, indexname;

-- ============================================
-- 10. Verificar RLS habilitado
-- ============================================
\echo ''
\echo '10. Verificando RLS habilitado...'
\echo ''

SELECT 
  tablename as "Tabla",
  CASE 
    WHEN rowsecurity THEN '✓ RLS Habilitado'
    ELSE '✗ RLS Deshabilitado'
  END as "Estado RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY tablename;

-- ============================================
-- 11. Verificar políticas RLS
-- ============================================
\echo ''
\echo '11. Verificando políticas RLS...'
\echo ''

SELECT 
  schemaname as "Schema",
  tablename as "Tabla",
  policyname as "Política",
  cmd as "Comando",
  CASE 
    WHEN qual IS NOT NULL THEN 'Con USING'
    ELSE 'Sin USING'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN 'Con CHECK'
    ELSE 'Sin CHECK'
  END as "CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 12. Contar políticas por tabla
-- ============================================
\echo ''
\echo '12. Conteo de políticas por tabla...'
\echo ''

SELECT 
  tablename as "Tabla",
  COUNT(*) as "Total Políticas",
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as "SELECT",
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as "INSERT",
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as "UPDATE",
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as "DELETE"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 13. Verificar triggers
-- ============================================
\echo ''
\echo '13. Verificando triggers...'
\echo ''

SELECT 
  event_object_table as "Tabla",
  trigger_name as "Trigger",
  event_manipulation as "Evento",
  action_timing as "Timing"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 14. Verificar CHECK constraints específicos
-- ============================================
\echo ''
\echo '14. Verificando CHECK constraints específicos...'
\echo ''

SELECT 
  tc.table_name as "Tabla",
  tc.constraint_name as "Constraint",
  cc.check_clause as "Condición"
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'hojas_ruta',
    'facturas_ruta',
    'gastos_ruta',
    'balance_ruta_historico',
    'audit_logs'
  )
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 15. Resumen final
-- ============================================
\echo ''
\echo '============================================'
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '============================================'
\echo ''

WITH verification AS (
  SELECT 
    'Tablas creadas' as check_name,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('hojas_ruta', 'facturas_ruta', 'gastos_ruta', 'balance_ruta_historico', 'audit_logs')
    ) as actual,
    5 as expected
  UNION ALL
  SELECT 
    'RLS habilitado',
    (SELECT COUNT(*) FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename IN ('hojas_ruta', 'facturas_ruta', 'gastos_ruta', 'balance_ruta_historico', 'audit_logs')
       AND rowsecurity = true
    ),
    5
  UNION ALL
  SELECT 
    'Políticas RLS',
    (SELECT COUNT(*) FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('hojas_ruta', 'facturas_ruta', 'gastos_ruta', 'balance_ruta_historico', 'audit_logs')
    ),
    19 -- Total esperado de políticas
  UNION ALL
  SELECT 
    'Índices creados',
    (SELECT COUNT(*) FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename IN ('hojas_ruta', 'facturas_ruta', 'gastos_ruta', 'balance_ruta_historico', 'audit_logs')
       AND indexname NOT LIKE '%_pkey' -- Excluir primary keys
    ),
    17 -- Total esperado de índices (sin contar PKs)
  UNION ALL
  SELECT 
    'Foreign Keys',
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE table_schema = 'public'
       AND table_name IN ('hojas_ruta', 'facturas_ruta', 'gastos_ruta', 'balance_ruta_historico', 'audit_logs')
       AND constraint_type = 'FOREIGN KEY'
    ),
    10 -- Total esperado de FKs
  UNION ALL
  SELECT 
    'Triggers',
    (SELECT COUNT(*) FROM information_schema.triggers
     WHERE event_object_schema = 'public'
       AND event_object_table IN ('hojas_ruta', 'facturas_ruta')
    ),
    2 -- Triggers de updated_at
)
SELECT 
  check_name as "Verificación",
  actual as "Actual",
  expected as "Esperado",
  CASE 
    WHEN actual = expected THEN '✓ OK'
    WHEN actual > expected THEN '⚠ Más de lo esperado'
    ELSE '✗ Faltan ' || (expected - actual)::text
  END as "Estado"
FROM verification
ORDER BY check_name;

\echo ''
\echo '============================================'
\echo 'VERIFICACIÓN COMPLETADA'
\echo '============================================'
\echo ''
\echo 'Si todos los checks muestran ✓ OK, la estructura está correcta.'
\echo 'Si hay diferencias, revisa los detalles arriba.'
\echo ''
