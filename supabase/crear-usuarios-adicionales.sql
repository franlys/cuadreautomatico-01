-- ============================================
-- Crear Usuarios Adicionales
-- ============================================

-- INSTRUCCIONES:
-- 1. Primero ejecuta el script add-usuario-completo-rol.sql para agregar el nuevo rol
-- 2. Luego crea los usuarios en Supabase Authentication (UI)
-- 3. Copia los UIDs de cada usuario
-- 4. Reemplaza los UIDs en este script
-- 5. Ejecuta este script

-- ============================================
-- Usuario de Ingresos
-- ============================================
-- Crear usuario en Authentication primero:
-- Email: ingresos@cuadre.com
-- Password: (tu contraseña segura)
-- Auto Confirm: ✅

-- Luego ejecuta esto (reemplaza USER_UID_INGRESOS con el UID real):
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'USER_UID_INGRESOS',  -- Reemplazar con el UID del usuario
  'Usuario Ingresos',
  'Usuario_Ingresos'
);

-- ============================================
-- Usuario de Egresos
-- ============================================
-- Crear usuario en Authentication primero:
-- Email: egresos@cuadre.com
-- Password: (tu contraseña segura)
-- Auto Confirm: ✅

-- Luego ejecuta esto (reemplaza USER_UID_EGRESOS con el UID real):
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'USER_UID_EGRESOS',  -- Reemplazar con el UID del usuario
  'Usuario Egresos',
  'Usuario_Egresos'
);

-- ============================================
-- Usuario Completo (Ingresos + Egresos + Depósitos)
-- ============================================
-- Crear usuario en Authentication primero:
-- Email: completo@cuadre.com
-- Password: (tu contraseña segura)
-- Auto Confirm: ✅

-- Luego ejecuta esto (reemplaza USER_UID_COMPLETO con el UID real):
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'USER_UID_COMPLETO',  -- Reemplazar con el UID del usuario
  'Usuario Completo',
  'Usuario_Completo'
);

-- ============================================
-- Verificar que se crearon correctamente
-- ============================================
SELECT id, nombre, rol, created_at 
FROM perfiles 
ORDER BY created_at DESC;
