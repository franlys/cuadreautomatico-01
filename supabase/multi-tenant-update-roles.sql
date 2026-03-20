-- ============================================
-- Multi-Tenant Platform - Actualización de Roles
-- Tarea 1.4: Actualizar roles en tabla perfiles
-- ============================================

-- Eliminar el constraint existente
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- Agregar nuevo constraint con todos los roles
-- Roles existentes: Usuario_Ingresos, Usuario_Egresos, Usuario_Completo, Dueño
-- Nuevos roles: Super_Admin, Encargado_Almacén, Secretaria, Empleado_Ruta
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN (
    'Usuario_Ingresos',
    'Usuario_Egresos', 
    'Usuario_Completo',
    'Dueño',
    'Super_Admin',
    'Encargado_Almacén',
    'Secretaria',
    'Empleado_Ruta'
  ));

-- Verificar que el constraint se aplicó correctamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'perfiles'::regclass
  AND conname = 'perfiles_rol_check';

-- Comentario sobre los roles
COMMENT ON COLUMN perfiles.rol IS 'Rol del usuario. Automatización Parcial: Usuario_Ingresos, Usuario_Egresos, Usuario_Completo, Dueño. Automatización Completa: Super_Admin, Encargado_Almacén, Secretaria, Empleado_Ruta, Usuario_Completo, Dueño';
