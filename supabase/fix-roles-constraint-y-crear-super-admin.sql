-- ============================================
-- Fix: Actualizar constraint de roles y crear Super Admin
-- ============================================

-- PASO 1: Actualizar el check constraint de roles en perfiles
-- (Esto debería haberse hecho en la migración, pero lo hacemos ahora)

ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN (
    'Super_Admin',
    'Usuario_Ingresos', 
    'Usuario_Egresos', 
    'Usuario_Completo',
    'Dueño',
    'Encargado_Almacén',
    'Secretaria',
    'Empleado_Ruta'
  ));

-- Verificar que el constraint se actualizó
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'perfiles_rol_check';

-- PASO 2: Crear perfil Super_Admin para Franlys González

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
    RAISE EXCEPTION 'ERROR: Usuario con email % NO encontrado en auth.users', v_email;
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

-- PASO 3: Verificar creación del Super Admin

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

-- PASO 4: Verificar que puede ver todas las empresas

SELECT 
  id,
  nombre,
  nivel_automatizacion,
  activa,
  created_at
FROM empresas
ORDER BY nombre;

-- PASO 5: Verificar usuarios por empresa

SELECT 
  e.nombre as empresa,
  p.nombre as usuario,
  p.rol,
  p.created_at
FROM empresas e
LEFT JOIN perfiles p ON p.empresa_id = e.id
ORDER BY e.nombre, p.nombre;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Deberías ver:
-- ✅ Constraint actualizado con 'Super_Admin'
-- ✅ Usuario encontrado
-- ✅ Perfil Super_Admin creado
-- ✅ Acción registrada en audit_logs
-- ✅ Tabla con el perfil de Franlys González
-- ✅ Lista de empresas (debería mostrar "Empresa 1")
-- ✅ Lista de usuarios por empresa

-- ============================================
-- PRÓXIMOS PASOS
-- ============================================

-- 1. Iniciar sesión con: franlysgonzaleztejeda@gmail.com
-- 2. Verificar que puedes acceder al sistema
-- 3. Probar crear una segunda empresa
-- 4. Probar cambio de contexto entre empresas

