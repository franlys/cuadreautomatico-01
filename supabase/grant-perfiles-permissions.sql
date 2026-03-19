-- ============================================
-- Otorgar permisos explícitos en tabla perfiles
-- ============================================

-- Otorgar permisos SELECT, INSERT, UPDATE a usuarios autenticados
GRANT SELECT, INSERT, UPDATE ON perfiles TO authenticated;

-- Otorgar permisos SELECT, INSERT, UPDATE a usuarios anónimos (para el proceso de login)
GRANT SELECT ON perfiles TO anon;

-- Verificar los permisos
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'perfiles';
