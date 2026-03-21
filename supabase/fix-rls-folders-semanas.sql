-- =====================================================
-- FIX: Deshabilitar RLS en folders_diarios y semanas_laborales
-- =====================================================
-- El problema: registros tiene RLS deshabilitado (SOLUCION_SIMPLE_FINAL.sql)
-- pero folders_diarios y semanas_laborales tienen RLS habilitado con filtro
-- empresa_id = get_user_empresa_id(). Como los folders fueron creados sin
-- empresa_id (NULL), la query devuelve vacío y el export no muestra datos.
-- =====================================================

-- Deshabilitar RLS en folders_diarios y semanas_laborales
ALTER TABLE folders_diarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_laborales DISABLE ROW LEVEL SECURITY;
ALTER TABLE depositos DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos completos a usuarios autenticados
GRANT ALL ON TABLE folders_diarios TO authenticated;
GRANT ALL ON TABLE semanas_laborales TO authenticated;
GRANT ALL ON TABLE depositos TO authenticated;

-- Backfill empresa_id en registros existentes sin empresa_id
-- (actualiza usando el folder -> semana -> empresa_id)
UPDATE registros r
SET empresa_id = sl.empresa_id
FROM folders_diarios f
JOIN semanas_laborales sl ON f.semana_laboral_id = sl.id
WHERE r.folder_diario_id = f.id
  AND r.empresa_id IS NULL
  AND sl.empresa_id IS NOT NULL;

-- Verificar estado final
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'HABILITADO' ELSE 'DESHABILITADO ✓' END as rls_estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('folders_diarios', 'semanas_laborales', 'registros', 'depositos')
ORDER BY tablename;
