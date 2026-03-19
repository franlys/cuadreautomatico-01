-- ============================================
-- CREAR USUARIO COMPLETO - EJEMPLO
-- ============================================
-- Este script crea un usuario con rol Usuario_Completo
-- que tiene permisos completos para todas las operaciones

-- IMPORTANTE: 
-- 1. Primero debes crear el usuario en Supabase Dashboard:
--    - Ve a Authentication → Users → Add user
--    - Email: operador@cuadre.com (o el que prefieras)
--    - Password: (genera una contraseña segura)
--    - Auto Confirm User: ✅ Activado
-- 2. Copia el User ID que se genera
-- 3. Reemplaza 'USER_ID_AQUI' con el ID real
-- 4. Ejecuta este script en SQL Editor

-- ============================================
-- PASO 1: Crear perfil para Usuario Completo
-- ============================================

INSERT INTO perfiles (id, nombre, rol, intentos_fallidos, bloqueado_hasta)
VALUES (
  'USER_ID_AQUI',  -- ⚠️ REEMPLAZAR con el User ID real
  'Operador Principal',  -- Nombre del usuario
  'Usuario_Completo',  -- Rol con permisos completos
  0,  -- Sin intentos fallidos
  NULL  -- No bloqueado
);

-- ============================================
-- VERIFICAR CREACIÓN
-- ============================================

-- Ver el usuario recién creado
SELECT 
  p.id,
  p.nombre,
  p.rol,
  u.email,
  u.created_at as fecha_creacion
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'Usuario_Completo'
ORDER BY u.created_at DESC
LIMIT 1;

-- ============================================
-- PERMISOS DEL USUARIO_COMPLETO
-- ============================================

-- Este rol puede:
-- ✅ Crear, editar, eliminar INGRESOS
-- ✅ Crear, editar, eliminar EGRESOS
-- ✅ Crear, editar, eliminar DEPÓSITOS
-- ✅ Crear, editar, eliminar EMPLEADOS
-- ✅ Crear, editar, eliminar RUTAS
-- ✅ Crear, editar, eliminar CONCEPTOS
-- ✅ Cerrar FOLDERS DIARIOS
-- ✅ Ver todos los registros y reportes
-- ✅ Exportar PDF y XLSX

-- ============================================
-- EJEMPLO: Crear múltiples usuarios completos
-- ============================================

-- Si necesitas crear varios usuarios completos a la vez:
/*
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_1', 'Operador Turno Mañana', 'Usuario_Completo'),
  ('USER_ID_2', 'Operador Turno Tarde', 'Usuario_Completo'),
  ('USER_ID_3', 'Operador Turno Noche', 'Usuario_Completo');
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. El Usuario_Completo es el rol principal para operaciones diarias
-- 2. Tiene acceso completo a todas las funcionalidades excepto:
--    - No puede ver el Dashboard del Dueño (solo lectura)
--    - No puede enviar reportes por correo (solo el Dueño)
-- 3. Es ideal para empleados de confianza que manejan el sistema
-- 4. Recomendación: Crear 2-3 usuarios completos para diferentes turnos

-- ============================================
-- CAMBIAR CONTRASEÑA
-- ============================================

-- Para cambiar la contraseña de un usuario:
-- 1. Ve a Authentication → Users en Supabase Dashboard
-- 2. Busca el usuario por email
-- 3. Haz clic en "Reset password"
-- 4. Ingresa la nueva contraseña
-- 5. Haz clic en "Update user"

-- ============================================
-- DESBLOQUEAR USUARIO
-- ============================================

-- Si el usuario se bloquea por intentos fallidos:
/*
UPDATE perfiles
SET 
  intentos_fallidos = 0,
  bloqueado_hasta = NULL
WHERE id = 'USER_ID_AQUI';
*/

-- ============================================
-- ELIMINAR USUARIO
-- ============================================

-- Para eliminar un usuario (esto también elimina su perfil):
-- 1. Ve a Authentication → Users en Supabase Dashboard
-- 2. Busca el usuario
-- 3. Haz clic en "Delete user"
-- 4. Confirma la eliminación
-- El perfil se eliminará automáticamente por el trigger

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
