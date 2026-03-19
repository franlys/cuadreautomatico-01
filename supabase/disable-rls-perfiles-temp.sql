-- ============================================
-- TEMPORAL: Deshabilitar RLS en perfiles para debugging
-- ============================================

-- Deshabilitar RLS temporalmente
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'perfiles';
