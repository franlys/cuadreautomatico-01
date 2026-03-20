-- ============================================
-- Crear Usuario Super_Admin
-- ============================================
-- Este script crea un usuario Super_Admin para gestionar la plataforma multi-tenant.
-- IMPORTANTE: Ejecutar este script solo una vez y cambiar la contraseña inmediatamente.

-- ============================================
-- PASO 1: Crear usuario en Supabase Auth
-- ============================================

-- NOTA: En Supabase, la creación de usuarios debe hacerse a través de:
-- 1. Dashboard de Supabase (Authentication > Users > Add User)
-- 2. API de Supabase Auth
-- 3. Función de servidor

-- Para este ejemplo, asumimos que el usuario ya existe en auth.users
-- Si necesitas crear el usuario manualmente, usa el dashboard de Supabase.

-- ============================================
-- PASO 2: Crear perfil Super_Admin
-- ============================================

-- Variables (reemplazar con valores reales)
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@plataforma.com'; -- CAMBIAR ESTE EMAIL
BEGIN
  -- Obtener el ID del usuario de auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- Verificar que el usuario existe
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado en auth.users. Crear primero en Supabase Dashboard.', v_email;
  END IF;

  -- Verificar si ya existe un perfil para este usuario
  IF EXISTS (SELECT 1 FROM perfiles WHERE id = v_user_id) THEN
    RAISE NOTICE 'El usuario % ya tiene un perfil. Actualizando a Super_Admin...', v_email;
    
    -- Actualizar perfil existente a Super_Admin
    UPDATE perfiles
    SET 
      rol = 'Super_Admin',
      empresa_id = NULL,  -- Super_Admin no pertenece a ninguna empresa
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Perfil actualizado a Super_Admin exitosamente.';
  ELSE
    -- Crear nuevo perfil Super_Admin
    INSERT INTO perfiles (id, nombre, rol, empresa_id)
    VALUES (
      v_user_id,
      'Super Admin',  -- CAMBIAR ESTE NOMBRE
      'Super_Admin',
      NULL  -- Super_Admin no pertenece a ninguna empresa específica
    );
    
    RAISE NOTICE 'Perfil Super_Admin creado exitosamente para %.', v_email;
  END IF;
END $$;

-- ============================================
-- PASO 3: Verificar creación
-- ============================================

SELECT 
  p.id,
  u.email,
  p.nombre,
  p.rol,
  p.empresa_id,
  p.created_at
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'Super_Admin';

-- ============================================
-- PASO 4: Probar función is_super_admin()
-- ============================================

-- Verificar que la función is_super_admin() funciona correctamente
-- NOTA: Esta consulta debe ejecutarse con el contexto del usuario Super_Admin

-- Para probar manualmente:
-- 1. Iniciar sesión con el usuario Super_Admin en la aplicación
-- 2. Ejecutar: SELECT auth.is_super_admin();
-- 3. Debe retornar TRUE

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. SEGURIDAD:
--    - Cambiar la contraseña del Super_Admin inmediatamente después de crear
--    - Usar contraseña fuerte (mínimo 12 caracteres, mayúsculas, minúsculas, números, símbolos)
--    - Habilitar autenticación de dos factores (2FA) si está disponible
--    - Limitar el número de usuarios Super_Admin (idealmente 1-2)

-- 2. EMPRESA_ID:
--    - Super_Admin tiene empresa_id = NULL
--    - Esto permite acceso cross-tenant a todas las empresas
--    - No asignar empresa_id a Super_Admin

-- 3. PERMISOS:
--    - Super_Admin puede ver y modificar datos de todas las empresas
--    - Super_Admin puede crear, editar y desactivar empresas
--    - Super_Admin puede crear usuarios en cualquier empresa
--    - Todas las acciones deben ser auditadas

-- 4. CREAR USUARIO EN SUPABASE:
--    Opción A - Dashboard de Supabase:
--      1. Ir a Authentication > Users
--      2. Click en "Add User"
--      3. Ingresar email y contraseña
--      4. Confirmar email automáticamente
--      5. Ejecutar este script para crear el perfil

--    Opción B - SQL (requiere extensión pgcrypto):
--      INSERT INTO auth.users (
--        instance_id,
--        id,
--        aud,
--        role,
--        email,
--        encrypted_password,
--        email_confirmed_at,
--        created_at,
--        updated_at
--      ) VALUES (
--        '00000000-0000-0000-0000-000000000000',
--        gen_random_uuid(),
--        'authenticated',
--        'authenticated',
--        'admin@plataforma.com',
--        crypt('TU_CONTRASEÑA_SEGURA', gen_salt('bf')),
--        NOW(),
--        NOW(),
--        NOW()
--      );

-- 5. PRIMEROS PASOS DESPUÉS DE CREAR SUPER_ADMIN:
--    1. Iniciar sesión con el Super_Admin
--    2. Crear la primera empresa
--    3. Crear usuarios para esa empresa
--    4. Verificar que las políticas RLS funcionan correctamente
--    5. Probar cambio de contexto entre empresas

-- ============================================
-- EJEMPLO DE USO
-- ============================================

-- Después de crear el Super_Admin, puedes:

-- 1. Crear una empresa
-- INSERT INTO empresas (nombre, nivel_automatizacion)
-- VALUES ('Empresa Demo', 'parcial')
-- RETURNING id;

-- 2. Crear un usuario en esa empresa
-- INSERT INTO perfiles (id, nombre, rol, empresa_id)
-- VALUES (
--   '[uuid-del-usuario-en-auth.users]',
--   'Usuario Demo',
--   'Dueño',
--   '[uuid-de-la-empresa]'
-- );

-- 3. Verificar acceso cross-tenant
-- SELECT * FROM empresas;  -- Debe mostrar todas las empresas
-- SELECT * FROM perfiles;  -- Debe mostrar usuarios de todas las empresas
