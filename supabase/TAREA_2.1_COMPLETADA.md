# Tarea 2.1 Completada: Políticas RLS Base Multi-Tenant

## Resumen

Se han implementado las políticas de Row Level Security (RLS) base para garantizar el aislamiento de datos por empresa_id en todas las tablas del sistema.

## Archivos Creados

### 1. `multi-tenant-rls-base.sql`
Archivo principal que implementa:
- Función helper `auth.get_user_empresa_id()` para obtener el empresa_id del usuario autenticado
- Políticas RLS para 9 tablas: perfiles, empleados, rutas, conceptos, semanas_laborales, folders_diarios, registros, depositos, evidencias
- Reemplazo de políticas RLS existentes por versiones multi-tenant

### 2. `verificar-rls-multi-tenant.sql`
Script de verificación que permite:
- Verificar que RLS está habilitado en todas las tablas
- Listar todas las políticas RLS por tabla
- Contar políticas por operación (SELECT, INSERT, UPDATE, DELETE)
- Verificar la función helper
- Generar resumen de estado

## Políticas Implementadas

### Patrón General

Todas las políticas siguen el mismo patrón de aislamiento:

1. **SELECT**: Filtran por `empresa_id = auth.get_user_empresa_id()`
2. **INSERT**: Validan que `empresa_id = auth.get_user_empresa_id()`
3. **UPDATE**: 
   - USING: Validan empresa_id original
   - WITH CHECK: Previenen cambio de empresa_id
4. **DELETE**: Validan que `empresa_id = auth.get_user_empresa_id()`

### Tablas Protegidas

#### 1. Perfiles
- **SELECT**: Ver perfiles de la misma empresa
- **UPDATE**: Actualizar solo el propio perfil
- **INSERT**: Validar que empresa_id no sea NULL

#### 2. Empleados
- **SELECT**: Ver empleados activos de la empresa
- **INSERT**: Crear empleados en la empresa del usuario
- **UPDATE**: Solo Dueño puede actualizar (con validación de empresa)
- **DELETE**: Solo Dueño puede eliminar (con validación de empresa)

#### 3. Rutas
- **SELECT**: Ver rutas activas de la empresa
- **INSERT**: Crear rutas en la empresa del usuario
- **UPDATE**: Solo Dueño puede actualizar (con validación de empresa)
- **DELETE**: Solo Dueño puede eliminar (con validación de empresa)

#### 4. Conceptos
- **SELECT**: Ver conceptos activos de la empresa
- **INSERT**: Crear conceptos en la empresa del usuario
- **UPDATE**: Solo Dueño puede actualizar (con validación de empresa)
- **DELETE**: Solo Dueño puede eliminar (con validación de empresa)

#### 5. Semanas Laborales
- **SELECT**: Ver semanas de la empresa
- **INSERT**: Crear semanas en la empresa del usuario
- **UPDATE**: Solo Dueño puede actualizar (con validación de empresa)

#### 6. Folders Diarios
- **SELECT**: Ver folders de la empresa
- **INSERT**: Crear folders en la empresa del usuario
- **UPDATE**: Solo Dueño puede cerrar folders (con validación de empresa)

#### 7. Registros
- **SELECT**: Ver registros según rol y tipo:
  - Usuario_Ingresos: solo ingresos
  - Usuario_Egresos: solo egresos
  - Dueño/Usuario_Completo: todos
- **INSERT**: Crear según rol en folders abiertos de la empresa
- **UPDATE**: Actualizar propios registros en folders abiertos
- **DELETE**: Eliminar propios registros en folders abiertos

#### 8. Depósitos
- **SELECT**: Dueño/Usuario_Ingresos/Usuario_Completo pueden ver
- **INSERT**: Dueño/Usuario_Ingresos/Usuario_Completo pueden crear
- **UPDATE**: Actualizar propios depósitos
- **DELETE**: Eliminar propios depósitos

#### 9. Evidencias
- **SELECT**: Ver evidencias de propios registros/depósitos o si es Dueño
- **INSERT**: Crear evidencias para propios registros/depósitos
- **DELETE**: Eliminar evidencias de propios registros/depósitos

## Función Helper

### `auth.get_user_empresa_id()`

```sql
CREATE OR REPLACE FUNCTION auth.get_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id 
  FROM perfiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```

**Características**:
- Retorna el empresa_id del usuario autenticado actual
- SECURITY DEFINER: Se ejecuta con privilegios del creador
- STABLE: Puede ser optimizada por el query planner
- Usada en todas las políticas RLS para obtener el contexto del tenant

## Validaciones de Seguridad

### Prevención de Cross-Tenant Access

1. **Filtrado automático**: Todas las consultas SELECT filtran por empresa_id
2. **Validación en INSERT**: No se puede insertar con empresa_id diferente
3. **Protección en UPDATE**: No se puede cambiar el empresa_id de un registro
4. **Validación en DELETE**: Solo se pueden eliminar registros de la propia empresa

### Mantenimiento de Permisos por Rol

Las políticas mantienen las restricciones de rol existentes:
- **Dueño**: Puede gestionar catálogos y cerrar folders
- **Usuario_Ingresos**: Solo ingresos
- **Usuario_Egresos**: Solo egresos
- **Usuario_Completo**: Ingresos y egresos

## Cómo Aplicar

### Paso 1: Ejecutar el script principal
```bash
psql -h <host> -U <user> -d <database> -f supabase/multi-tenant-rls-base.sql
```

### Paso 2: Verificar la aplicación
```bash
psql -h <host> -U <user> -d <database> -f supabase/verificar-rls-multi-tenant.sql
```

### Paso 3: Validar resultados

El script de verificación debe mostrar:
- ✓ RLS habilitado en todas las tablas
- ✓ Función helper creada
- ✓ Políticas tenant_isolation aplicadas
- ✓ Conteo correcto de políticas por tabla

## Próximos Pasos

### Tarea 2.2: Políticas RLS para Super_Admin
- Crear función `is_super_admin()`
- Crear políticas que permitan acceso cross-tenant a Super_Admin
- Aplicar a tabla empresas

### Tarea 2.3: Políticas de Storage
- Crear políticas de Storage con prefijo empresa_id/
- Validar acceso a archivos por empresa

## Notas Importantes

1. **Políticas antiguas eliminadas**: Las políticas RLS existentes fueron reemplazadas por versiones multi-tenant
2. **Compatibilidad**: Las nuevas políticas mantienen la misma lógica de permisos por rol
3. **Super_Admin pendiente**: Las políticas para Super_Admin se implementarán en la tarea 2.2
4. **Storage pendiente**: Las políticas de Storage se implementarán en la tarea 2.3
5. **Migración de datos**: Antes de usar estas políticas, se debe ejecutar la migración de datos (tarea 10) para asignar empresa_id a registros existentes

## Requirements Cumplidos

- ✓ **2.2**: Aplicar RLS en todas las tablas para filtrar por empresa_id
- ✓ **2.3**: Retornar únicamente datos de la empresa del usuario
- ✓ **19.1**: Validar que todas las consultas incluyan filtro por empresa_id
- ✓ **19.2**: Validar que todas las inserciones incluyan empresa_id del usuario
- ✓ **19.3**: Validar que todas las actualizaciones respeten empresa_id original

