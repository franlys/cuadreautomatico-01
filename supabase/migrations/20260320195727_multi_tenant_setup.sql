-- ============================================
-- Multi-Tenant Platform - Migración Completa
-- ============================================
-- IMPORTANTE: Esta migración debe ejecutarse en el orden especificado
-- 
-- Para ejecutar manualmente en el SQL Editor de Supabase:
-- 1. Copiar y ejecutar cada sección en orden
-- 2. Verificar que no hay errores antes de continuar
-- 3. Al final, ejecutar el script de verificación
-- ============================================

-- INSTRUCCIONES:
-- Este archivo es un índice. Los scripts reales están en archivos separados.
-- Ejecutar en este orden usando el SQL Editor del dashboard:

-- 1. supabase/multi-tenant-empresas.sql
-- 2. supabase/multi-tenant-add-empresa-id.sql  
-- 3. supabase/multi-tenant-rls-base.sql
-- 4. supabase/multi-tenant-rls-super-admin.sql
-- 5. supabase/multi-tenant-storage-policies.sql
-- 6. supabase/multi-tenant-automation-tables.sql
-- 7. supabase/migrate-to-empresa-1.sql
-- 8. supabase/verificar-migracion.sql (para validar)

-- Alternativamente, usar el CLI de Supabase:
-- supabase db push

