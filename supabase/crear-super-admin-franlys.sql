-- ============================================
-- Crear Usuario Super_Admin: Franlys González
-- Email: franlysgonzaleztejeda@gmail.com
-- ============================================

-- ⚠️  IMPORTANTE: PRIMERO crear el usuario en Supabase Dashboard:
--    1. Ir a: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/auth/users
--    2. Click en "Add User" o "Invite"
--    3. Email: franlysgonzaleztejeda@gmail.com
--    4. Password: [contraseña segura]
--    5. Auto Confirm User: ✓ (marcar)
--    6. Click "Create User"
--    7. LUEGO ejecutar este script

-- PASO 1: Verificar si el usuario existe en auth.users
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'franlysgonzaleztejeda@gmail.com';
BEGIN
  -- Buscar el usuario en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: Usuario con email % NO encontrado en auth.users. Crear primero en Supabase Dashboard (Authentication > Users > Add User)', v_email;
  ELSE
    RAISE NOTICE '✅ Usuario encontrado: % (ID: %)', v_email, v_user_id;
    
    -- Verificar si ya tiene perfil
    IF EXISTS (SELECT 1 FROM perfiles WHERE id = v_user_id) THEN
      RAISE NOTICE '⚠️  El usuario ya tiene un perfil. Actualizando a Super_Admin...';
      
      -- Actualizar perfil existente
      UPDATE perfiles
      SET 
        rol = 'Super_Admin',
        nombre = 'Franlys González',
        empresa_id = NULL,  -- Super_Admin no pertenece a ninguna empresa
        updated_at = NOW()
      WHERE id = v_user_id;
      
      RAISE NOTICE '✅ Perfil actualizado a Super_Admin exitosamente';
    ELSE
      RAISE NOTICE '📝 Creando nuevo perfil Super_Admin...';
      
      -- Crear nuevo perfil
      INSERT INTO perfiles (id, nombre, rol, empresa_id, intentos_fallidos, bloqueado_hasta)
      VALUES (
        v_user_id,
        'Franlys González',
        'Super_Admin',
        NULL,  -- Super_Admin no tiene empresa_id
        0,
        NULL
      );
      
      RAISE NOTICE '✅ Perfil Super_Admin creado exitosamente';
    END IF;
    
    -- Registrar en audit_logs
    INSERT INTO audit_logs (
      empresa_id,
      usuario_id,
      accion,
      recurso,
      detalles,
      exitoso,
      created_at
    ) VALUES (
      NULL,  -- Super_Admin no tiene empresa
      v_user_id,
      'crear_super_admin',
      'perfiles',
      jsonb_build_object(
        'email', v_email,
        'nombre', 'Franlys González',
        'rol', 'Super_Admin'
      ),
      TRUE,
      NOW()
    );
    
    RAISE NOTICE '✅ Acción registrada en audit_logs';
  END IF;
END $$;

-- ============================================
-- PASO 2: Verificar creación
-- ============================================

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

-- ============================================
-- PASO 3: Verificar permisos Super_Admin
-- ============================================

-- Verificar que puede ver todas las empresas
SELECT 
  COUNT(*) as total_empresas,
  COUNT(CASE WHEN activa THEN 1 END) as empresas_activas,
  COUNT(CASE WHEN NOT activa THEN 1 END) as empresas_inactivas
FROM empresas;

-- Verificar que puede ver usuarios de todas las empresas
SELECT 
  e.nombre as empresa,
  COUNT(p.id) as total_usuarios
FROM empresas e
LEFT JOIN perfiles p ON p.empresa_id = e.id
GROUP BY e.id, e.nombre
ORDER BY e.nombre;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Si todo está correcto, deberías ver:
-- ✅ Usuario encontrado
-- ✅ Perfil creado/actualizado
-- ✅ Acción registrada en audit_logs
-- ✅ Consultas de verificación muestran datos

-- ============================================
-- PRÓXIMOS PASOS
-- ============================================

-- 1. Iniciar sesión con: franlysgonzaleztejeda@gmail.com
-- 2. Cambiar contraseña si es necesario
-- 3. Acceder al Dashboard de Super Admin
-- 4. Crear una segunda empresa de prueba
-- 5. Probar cambio de contexto entre empresas
-- 6. Verificar que puedes ver datos de "Empresa 1"

-- ============================================
-- NOTAS DE SEGURIDAD
-- ============================================

-- ⚠️  IMPORTANTE:
-- 1. Usar contraseña fuerte (mínimo 12 caracteres)
-- 2. Cambiar contraseña después del primer login
-- 3. No compartir credenciales de Super_Admin
-- 4. Todas las acciones quedan registradas en audit_logs
-- 5. Super_Admin tiene acceso a TODAS las empresas

