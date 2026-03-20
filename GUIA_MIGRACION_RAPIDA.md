# Guía Rápida de Migración Multi-Tenant

## ✅ Preparación Completada

- ✅ Supabase CLI instalado y configurado
- ✅ Proyecto vinculado: `emifgmstkhkpgrshlsnt`
- ✅ Scripts SQL listos para ejecutar

## 🚀 Ejecutar Migración

### Opción Recomendada: SQL Editor del Dashboard

**URL del SQL Editor**: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/sql

### Pasos a Seguir:

Ejecuta cada script en orden, copiando y pegando el contenido en el SQL Editor:

#### 1️⃣ Crear Tabla Empresas
**Archivo**: `supabase/multi-tenant-empresas.sql`
- Crea la tabla `empresas` y el tipo enum
- Verifica: Debe mostrar "Success"

#### 2️⃣ Agregar empresa_id a Tablas
**Archivo**: `supabase/multi-tenant-add-empresa-id.sql`
- Agrega columna `empresa_id` a todas las tablas
- Verifica: Debe mostrar "Success"

#### 3️⃣ Políticas RLS Base
**Archivo**: `supabase/multi-tenant-rls-base.sql`
- Crea políticas de aislamiento por empresa
- Verifica: Debe mostrar "Success"

#### 4️⃣ Políticas RLS Super_Admin
**Archivo**: `supabase/multi-tenant-rls-super-admin.sql`
- Crea políticas para acceso cross-tenant
- Verifica: Debe mostrar "Success"

#### 5️⃣ Políticas de Storage
**Archivo**: `supabase/multi-tenant-storage-policies.sql`
- Crea políticas de Storage con aislamiento
- Verifica: Debe mostrar "Success"

#### 6️⃣ Tablas de Automatización
**Archivo**: `supabase/multi-tenant-automation-tables.sql`
- Crea tablas para hojas de ruta digitales
- Verifica: Debe mostrar "Success"

#### 7️⃣ Migrar Datos a "Empresa 1"
**Archivo**: `supabase/migrate-to-empresa-1.sql`
- Crea "Empresa 1" y migra todos los datos
- Verifica: Debe mostrar mensajes NOTICE con el progreso
- Debe terminar con "✓ Migración completada exitosamente"

#### 8️⃣ Verificar Migración
**Archivo**: `supabase/verificar-migracion.sql`
- Verifica que todos los datos se migraron correctamente
- Debe mostrar un resumen con conteos de registros

## 📋 Checklist de Verificación

Después de ejecutar todos los scripts:

- [ ] Todos los scripts se ejecutaron sin errores
- [ ] El script de verificación muestra que "Empresa 1" existe
- [ ] Todos los registros tienen `empresa_id` asignado
- [ ] No hay registros huérfanos (sin empresa_id)

## 🎯 Próximos Pasos

Una vez completada la migración:

1. **Probar el login**
   - Los usuarios existentes deben poder iniciar sesión
   - Deben ver sus datos históricos

2. **Crear Super_Admin**
   - Ejecutar: `supabase/crear-super-admin.sql`

3. **Continuar con Tarea 12**
   - Implementar funciones avanzadas de Super_Admin

## 🆘 En Caso de Error

Si algo sale mal:

1. **Copia el mensaje de error completo**
2. **NO continúes con los siguientes scripts**
3. **Ejecuta el rollback**: `supabase/rollback-empresa-1.sql`
4. **Revisa el error y corrige antes de reintentar**

## 📞 Información de Conexión

- **Proyecto**: emifgmstkhkpgrshlsnt
- **URL**: https://emifgmstkhkpgrshlsnt.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt

