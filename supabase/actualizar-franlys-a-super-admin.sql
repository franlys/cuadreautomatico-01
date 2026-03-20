-- ============================================
-- Actualizar usuario Franlys a Super_Admin
-- ============================================

-- Actualizar el perfil de Franlys González a Super_Admin
UPDATE perfiles
SET 
  rol = 'Super_Admin',
  empresa_id = NULL,  -- Super_Admin no pertenece a ninguna empresa
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'franlysgonzaleztejeda@gmail.com'
);

-- Verificar la actualización
SELECT 
  p.id,
  u.email,
  p.nombre,
  p.rol,
  p.empresa_id,
  p.created_at,
  p.updated_at
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'franlysgonzaleztejeda@gmail.com';

-- Registrar en audit_logs
INSERT INTO audit_logs (
  empresa_id,
  usuario_id,
  accion,
  recurso,
  detalles,
  exitoso,
  created_at
) 
SELECT
  NULL,  -- Super_Admin no tiene empresa
  u.id,
  'actualizar_a_super_admin',
  'perfiles',
  jsonb_build_object(
    'email', u.email,
    'rol_anterior', 'Usuario_Completo',
    'rol_nuevo', 'Super_Admin'
  ),
  TRUE,
  NOW()
FROM auth.users u
WHERE u.email = 'franlysgonzaleztejeda@gmail.com';

-- Verificar todos los Super_Admin
SELECT 
  p.id,
  u.email,
  p.nombre,
  p.rol,
  p.empresa_id
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'Super_Admin';
