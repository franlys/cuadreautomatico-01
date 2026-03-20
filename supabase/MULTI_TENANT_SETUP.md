# Multi-Tenant Platform - Guía de Configuración

## Descripción

Esta guía documenta el proceso de transformación del sistema actual a una plataforma multi-tenant. La implementación se realiza en fases para minimizar el riesgo y permitir rollback si es necesario.

## Fase 1: Tabla Empresas (Tarea 1.1)

### Archivos Creados

- `supabase/multi-tenant-empresas.sql` - Tabla empresas y tipo ENUM
- `src/types/index.ts` - Interfaces TypeScript actualizadas

### Aplicar Cambios

```bash
# Conectarse a Supabase y ejecutar el script
psql $DATABASE_URL -f supabase/multi-tenant-empresas.sql
```

O desde el Dashboard de Supabase:
1. Ir a SQL Editor
2. Copiar el contenido de `supabase/multi-tenant-empresas.sql`
3. Ejecutar el script

### Verificar Instalación

```sql
-- Verificar que la tabla existe
SELECT * FROM empresas;

-- Verificar que el tipo ENUM existe
SELECT enum_range(NULL::nivel_automatizacion_enum);

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'empresas';
```

### Estructura Creada

#### Tabla: empresas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único (PK) |
| nombre | TEXT | Nombre de la empresa |
| nivel_automatizacion | ENUM | 'parcial' o 'completa' |
| logo_url | TEXT | URL del logo (opcional) |
| activa | BOOLEAN | Estado de la empresa |
| limite_storage_mb | INT | Límite de almacenamiento |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de actualización |

#### Índices Creados

- `idx_empresas_activa` - Para filtrar empresas activas/inactivas
- `idx_empresas_nivel` - Para filtrar por nivel de automatización
- `idx_empresas_nombre` - Para búsquedas por nombre

### Próximos Pasos

Una vez completada esta fase, las siguientes tareas serán:

1. **Tarea 1.2**: Agregar columna empresa_id a tablas existentes
2. **Tarea 1.3**: Crear empresa de migración "Empresa 1"
3. **Tarea 2.1**: Implementar políticas RLS para aislamiento de datos

### Rollback

Si necesitas revertir los cambios:

```sql
-- Eliminar tabla empresas
DROP TABLE IF EXISTS empresas CASCADE;

-- Eliminar tipo ENUM
DROP TYPE IF EXISTS nivel_automatizacion_enum CASCADE;
```

## Notas Importantes

- Esta es la primera fase de la transformación multi-tenant
- No afecta el funcionamiento actual del sistema
- Los datos existentes permanecen intactos
- La tabla empresas está lista para recibir la primera empresa de migración

## Requirements Implementados

- **Requirement 1.2**: Estructura base para gestión de empresas
- **Requirement 1.3**: Campo nivel_automatizacion para configuración por empresa
- **Requirement 2.1**: Preparación para aislamiento de datos (empresa_id)
