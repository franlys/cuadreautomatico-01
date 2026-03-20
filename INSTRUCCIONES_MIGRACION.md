# Instrucciones para Ejecutar la Migración Multi-Tenant

## Opción 1: Usando el SQL Editor del Dashboard de Supabase (RECOMENDADO)

Esta es la forma más sencilla y segura de ejecutar la migración.

### Pasos:

1. **Abrir el SQL Editor**
   - Ve a https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/sql
   - O desde tu dashboard: SQL Editor (en el menú lateral)

2. **Ejecutar los scripts en este orden:**

   Copia y pega el contenido de cada archivo en el SQL Editor y haz clic en "Run" después de cada uno:

   **Script 1: Crear tabla empresas**
   ```
   Archivo: supabase/multi-tenant-empresas.sql
   ```
   - Crea la tabla `empresas` y el tipo enum `nivel_automatizacion_enum`
   - Verifica que se ejecutó correctamente (debe mostrar "Success")

   **Script 2: Agregar empresa_id a tablas existentes**
   ```
   Archivo: supabase/multi-tenant-add-empresa-id.sql
   ```
   - Agrega la columna `empresa_id` a todas las tablas
   - Crea índices y actualiza constraints de unicidad

   **Script 3: Políticas RLS base**
   ```
   Archivo: supabase/multi-tenant-rls-base.sql
   ```
   - Crea políticas RLS para aislamiento por empresa
   - Elimina políticas antiguas y crea nuevas

   **Script 4: Políticas RLS para Super_Admin**
   ```
   Archivo: supabase/multi-tenant-rls-super-admin.sql
   ```
   - Crea políticas especiales para acceso cross-tenant del Super_Admin

   **Script 5: Políticas de Storage**
   ```
   Archivo: supabase/multi-tenant-storage-policies.sql
   ```
   - Crea políticas de Storage con aislamiento por empresa_id

   **Script 6: Tablas de automatización completa**
   ```
   Archivo: supabase/multi-tenant-automation-tables.sql
   ```
   - Crea tablas: hojas_ruta, facturas_ruta, gastos_ruta, balance_ruta_historico, audit_logs

   **Script 7: Migrar datos existentes a "Empresa 1"**
   ```
   Archivo: supabase/migrate-to-empresa-1.sql
   ```
   - Crea "Empresa 1" con nivel de automatización parcial
   - Migra todos los datos existentes a esta empresa
   - Valida la integridad de los datos

   **Script 8: Verificar migración (IMPORTANTE)**
   ```
   Archivo: supabase/verificar-migracion.sql
   ```
   - Verifica que todos los datos se migraron correctamente
   - Muestra un resumen de la migración

3. **Revisar los resultados**
   - Cada script debe mostrar "Success" o mensajes NOTICE con el progreso
   - El script de verificación debe mostrar que todos los registros tienen empresa_id
   - Si hay errores, NO continúes con el siguiente script

## Opción 2: Usando el CLI de Supabase (Avanzado)

Si prefieres usar el CLI, necesitas instalar PostgreSQL client (psql):

### Instalar PostgreSQL client:

```powershell
# Usando Scoop (ya tienes Scoop instalado)
scoop install postgresql

# O descargar desde: https://www.postgresql.org/download/windows/
```

### Ejecutar la migración:

```powershell
# Ejecutar el script de PowerShell
.\ejecutar-migracion.ps1
```

El script te pedirá la contraseña de la base de datos y ejecutará todos los archivos SQL en orden.

## Información de Conexión

- **Host**: db.emifgmstkhkpgrshlsnt.supabase.co
- **Puerto**: 5432
- **Base de datos**: postgres
- **Usuario**: postgres
- **Contraseña**: (la que configuraste en Supabase)

Para obtener la contraseña:
1. Ve a Dashboard → Settings → Database
2. Busca "Database Password" o "Connection String"
3. Copia la contraseña

## Qué hace cada script

### 1. multi-tenant-empresas.sql
- Crea el tipo enum `nivel_automatizacion_enum` con valores 'parcial' y 'completa'
- Crea la tabla `empresas` con campos: id, nombre, nivel_automatizacion, logo_url, activa, limite_storage_mb

### 2. multi-tenant-add-empresa-id.sql
- Agrega columna `empresa_id UUID` a todas las tablas existentes
- Crea índices en `empresa_id` para mejorar rendimiento
- Actualiza constraints de unicidad para incluir `empresa_id`

### 3. multi-tenant-rls-base.sql
- Crea función `auth.get_user_empresa_id()` para obtener empresa del usuario
- Elimina políticas RLS antiguas
- Crea nuevas políticas RLS que filtran por `empresa_id`
- Mantiene restricciones de rol existentes (Dueño, Usuario_Ingresos, etc.)

### 4. multi-tenant-rls-super-admin.sql
- Crea función `auth.is_super_admin()` para validar rol Super_Admin
- Crea políticas RLS especiales para Super_Admin con acceso cross-tenant
- Habilita RLS en tabla `empresas`

### 5. multi-tenant-storage-policies.sql
- Crea funciones helper para validar empresa_id en rutas de archivos
- Crea políticas de Storage que validan prefijo `{empresa_id}/` en rutas
- Permite a Super_Admin acceso cross-tenant a archivos

### 6. multi-tenant-automation-tables.sql
- Crea tabla `hojas_ruta` para hojas de ruta digitales
- Crea tabla `facturas_ruta` para facturas con seguimiento de entrega/cobro
- Crea tabla `gastos_ruta` para gastos de ruta (fijo, peaje, combustible, inesperado)
- Crea tabla `balance_ruta_historico` para trazabilidad financiera
- Crea tabla `audit_logs` para logs de auditoría
- Crea políticas RLS para todas las tablas nuevas
- Crea triggers para actualizar `updated_at`

### 7. migrate-to-empresa-1.sql
- Crea "Empresa 1" con nivel de automatización parcial
- Migra todos los usuarios existentes a "Empresa 1"
- Migra todos los catálogos (empleados, rutas, conceptos)
- Migra todos los datos operacionales (semanas, folders, registros, depósitos, evidencias)
- Valida integridad referencial
- Valida relaciones entre tablas
- Muestra resumen de migración

### 8. verificar-migracion.sql
- Verifica que "Empresa 1" existe
- Cuenta registros migrados en cada tabla
- Verifica que no hay registros sin `empresa_id`
- Muestra resumen completo de la migración

## Rollback (en caso de error)

Si algo sale mal durante la migración, puedes revertir los cambios:

```sql
-- Ejecutar en el SQL Editor:
-- Archivo: supabase/rollback-empresa-1.sql
```

Este script:
- Elimina "Empresa 1"
- Elimina la columna `empresa_id` de todas las tablas
- Restaura políticas RLS antiguas
- Elimina tablas de automatización completa

## Próximos Pasos

Después de ejecutar la migración exitosamente:

1. **Crear un usuario Super_Admin**
   ```sql
   -- Ejecutar en SQL Editor:
   -- Archivo: supabase/crear-super-admin.sql
   ```

2. **Probar el login**
   - Los usuarios existentes deben poder iniciar sesión
   - Deben ver sus datos históricos
   - Deben estar asociados a "Empresa 1"

3. **Verificar RLS**
   - Los usuarios solo deben ver datos de su empresa
   - Super_Admin debe ver datos de todas las empresas

4. **Continuar con Task 12** (funciones avanzadas de Super_Admin)

## Soporte

Si encuentras errores durante la migración:

1. **Copia el mensaje de error completo**
2. **Identifica en qué script falló**
3. **NO continúes con los siguientes scripts**
4. **Revisa el script que falló para entender el problema**
5. **Si es necesario, ejecuta el rollback**

