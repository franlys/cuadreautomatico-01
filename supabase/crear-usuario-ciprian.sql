-- =====================================================
-- Crear usuario Ciprian directamente en Supabase
-- =====================================================
-- Esto evita el rate limit de emails
-- =====================================================

-- PASO 1: Crear usuario en auth.users (sin enviar email)
-- NOTA: Ejecuta esto en Supabase SQL Editor
-- El usuario podrá hacer login con: ciprian@cuadre.com / Cuadre2024!

-- Primero, obtener el ID de Empresa 1
SELECT 
  '1. ID de Empresa 1:' as paso,
  id,
  nombre
FROM empresas
WHERE nombre = 'Empresa 1';

-- IMPORTANTE: Copia el ID de arriba y úsalo en el siguiente INSERT

-- PASO 2: Insertar en auth.users manualmente
-- REEMPLAZA 'EMPRESA_1_ID_AQUI' con el ID real de Empresa 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ciprian@cuadre.com',
  crypt('Cuadre2024!', gen_salt('bf')), -- Contraseña: Cuadre2024!
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id, email;

-- PASO 3: Crear perfil para el usuario
-- REEMPLAZA 'USER_ID_AQUI' con el ID retornado arriba
-- REEMPLAZA 'EMPRESA_1_ID_AQUI' con el ID de Empresa 1
INSERT INTO perfiles (
  id,
  nombre,
  rol,
  empresa_id,
  created_at,
  updated_at
) VALUES (
  'USER_ID_AQUI', -- ID del usuario creado arriba
  'Ciprian',
  'Encargado_Almacen',
  'EMPRESA_1_ID_AQUI', -- ID de Empresa 1
  NOW(),
  NOW()
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver el usuario creado
SELECT 
  '4. Usuario creado:' as paso,
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nombre,
  p.rol,
  e.nombre as empresa
FROM auth.users u
LEFT JOIN perfiles p ON p.id = u.id
LEFT JOIN empresas e ON e.id = p.empresa_id
WHERE u.email = 'ciprian@cuadre.com';

-- =====================================================
-- CREDENCIALES DE LOGIN
-- =====================================================
-- Email: ciprian@cuadre.com
-- Contraseña: Cuadre2024!
-- =====================================================
