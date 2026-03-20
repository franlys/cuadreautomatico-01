# Tarea 1.4 Completada: Actualizar Roles en Tabla Perfiles

## Resumen
Se actualizó el check constraint de la tabla `perfiles` para incluir los nuevos roles del sistema multi-tenant, manteniendo compatibilidad con los roles existentes.

## Cambios Realizados

### 1. Base de Datos (supabase/multi-tenant-update-roles.sql)
- Eliminado constraint anterior `perfiles_rol_check`
- Agregado nuevo constraint con 8 roles:
  - **Roles existentes (Automatización Parcial):**
    - `Usuario_Ingresos`
    - `Usuario_Egresos`
    - `Usuario_Completo`
    - `Dueño`
  - **Nuevos roles (Automatización Completa):**
    - `Super_Admin` - Gestiona empresas y usuarios cross-tenant
    - `Encargado_Almacén` - Crea hojas de ruta y asigna montos
    - `Secretaria` - Crea hojas de ruta
    - `Empleado_Ruta` - Ejecuta rutas y registra entregas/gastos

### 2. TypeScript (src/types/index.ts)
- Actualizada interface `Perfil` con los 4 nuevos roles
- Mantenida compatibilidad con código existente

## Aplicar Migración

```bash
# Conectar a Supabase y ejecutar:
psql $DATABASE_URL -f supabase/multi-tenant-update-roles.sql
```

## Verificación

```sql
-- Verificar constraint actualizado
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'perfiles'::regclass
  AND conname = 'perfiles_rol_check';
```

## Compatibilidad
- ✅ Código existente no afectado (solo usa roles antiguos)
- ✅ TypeScript reconoce nuevos roles como válidos
- ✅ Nuevas funcionalidades podrán usar los roles agregados

## Requirements Validados
- ✅ 5.1-5.4: Roles en Automatización Parcial (mantenidos)
- ✅ 6.1-6.3: Roles en Automatización Completa (agregados)

## Próximos Pasos
Los nuevos roles se utilizarán en las siguientes tareas:
- Tarea 2.x: Implementación de hojas de ruta digitales
- Tarea 3.x: Permisos y restricciones por rol
