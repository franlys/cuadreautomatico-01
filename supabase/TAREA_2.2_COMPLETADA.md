# Tarea 2.2 Completada: Políticas RLS Super_Admin

## ✅ Resumen

Se han creado políticas RLS especiales para el rol Super_Admin que permiten acceso cross-tenant con filtro opcional por empresa. El Super_Admin puede gestionar todas las empresas y sus datos sin restricciones de tenant.

## 📋 Archivos Creados

### 1. `supabase/multi-tenant-rls-super-admin.sql`
Archivo principal que implementa:
- Función helper `is_super_admin()` para validar rol del usuario
- Políticas RLS cross-tenant para todas las tablas del sistema
- Políticas especiales para tabla `empresas`
- Políticas para tabla `audit_logs`

### 2. `supabase/verificar-rls-super-admin.sql`
Script de verificación que valida:
- Existencia de la función `is_super_admin()`
- Políticas creadas en todas las tablas
- RLS habilitado correctamente
- Estructura de políticas

### 3. `supabase/TAREA_2.2_COMPLETADA.md`
Este archivo de documentación.

## 🔧 Componentes Implementados

### Función Helper: `is_super_admin()`

```sql
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM perfiles 
    WHERE id = auth.uid() 
      AND rol = 'Super_Admin'
  );
$$;
```

**Características:**
- Valida si el usuario autenticado tiene rol `Super_Admin`
- Retorna `TRUE` o `FALSE`
- Usada en todas las políticas RLS de Super_Admin
- `SECURITY DEFINER` para acceso a tabla perfiles
- `STABLE` para optimización de queries

### Políticas RLS por Tabla

Se crearon 4 políticas por tabla (SELECT, INSERT, UPDATE, DELETE) para:

1. ✅ **empresas** - Gestión completa de empresas
2. ✅ **perfiles** - Gestión de usuarios cross-tenant
3. ✅ **empleados** - Acceso a empleados de todas las empresas
4. ✅ **rutas** - Acceso a rutas de todas las empresas
5. ✅ **conceptos** - Acceso a conceptos de todas las empresas
6. ✅ **semanas_laborales** - Acceso a semanas de todas las empresas
7. ✅ **folders_diarios** - Acceso a folders de todas las empresas
8. ✅ **registros** - Acceso a registros de todas las empresas
9. ✅ **depositos** - Acceso a depósitos de todas las empresas
10. ✅ **evidencias** - Acceso a evidencias de todas las empresas

**Total: 40 políticas RLS creadas**

**Nota:** Las políticas para `audit_logs` están preparadas pero comentadas, ya que la tabla se creará en una tarea futura.

## 🎯 Características Principales

### 1. Acceso Cross-Tenant
- Super_Admin puede ver y modificar datos de **cualquier empresa**
- No hay filtro por `empresa_id` en las políticas Super_Admin
- Las políticas usan solo `is_super_admin()` como condición

### 2. Validación de Integridad
- Las políticas INSERT validan que `empresa_id IS NOT NULL`
- Las políticas UPDATE incluyen `WITH CHECK` para prevenir datos inválidos
- Se mantiene la integridad referencial en todas las operaciones

### 3. Coexistencia con Políticas Base
- Las políticas Super_Admin coexisten con las políticas `tenant_isolation_*`
- PostgreSQL evalúa las políticas con OR lógico
- Si el usuario es Super_Admin, tiene acceso completo
- Si no es Super_Admin, aplican las políticas de tenant isolation

### 4. Gestión de Empresas
- Super_Admin tiene acceso exclusivo a la tabla `empresas`
- Puede crear, editar, desactivar y reactivar empresas
- RLS habilitado en tabla `empresas`

### 5. Logs de Auditoría
- Super_Admin puede ver todos los logs cross-tenant
- Los logs son inmutables por diseño
- Solo Super_Admin puede modificar/eliminar logs en casos excepcionales

## 📊 Estructura de Políticas

### Patrón SELECT
```sql
CREATE POLICY "super_admin_select_[tabla]"
  ON [tabla] FOR SELECT
  USING (auth.is_super_admin());
```

### Patrón INSERT
```sql
CREATE POLICY "super_admin_insert_[tabla]"
  ON [tabla] FOR INSERT
  WITH CHECK (
    auth.is_super_admin() 
    AND empresa_id IS NOT NULL
  );
```

### Patrón UPDATE
```sql
CREATE POLICY "super_admin_update_[tabla]"
  ON [tabla] FOR UPDATE
  USING (auth.is_super_admin())
  WITH CHECK (
    auth.is_super_admin() 
    AND empresa_id IS NOT NULL
  );
```

### Patrón DELETE
```sql
CREATE POLICY "super_admin_delete_[tabla]"
  ON [tabla] FOR DELETE
  USING (auth.is_super_admin());
```

## 🚀 Cómo Aplicar

### Paso 1: Aplicar políticas base (si no se ha hecho)
```bash
psql -h [host] -U postgres -d postgres -f supabase/multi-tenant-rls-base.sql
```

### Paso 2: Aplicar políticas Super_Admin
```bash
psql -h [host] -U postgres -d postgres -f supabase/multi-tenant-rls-super-admin.sql
```

### Paso 3: Verificar implementación
```bash
psql -h [host] -U postgres -d postgres -f supabase/verificar-rls-super-admin.sql
```

## ✅ Verificación

El script `verificar-rls-super-admin.sql` debe mostrar:

```
✓ Función is_super_admin() existe
✓ RLS en tabla empresas habilitado
✓ 40 políticas Super_Admin creadas
✓ 36+ políticas Tenant Isolation creadas
✓ Todas las políticas usan is_super_admin()
```

## 🔍 Ejemplos de Uso

### Crear un Super_Admin
```sql
-- Crear usuario en Supabase Auth
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@plataforma.com', crypt('password', gen_salt('bf')), NOW());

-- Crear perfil Super_Admin (sin empresa_id)
INSERT INTO perfiles (id, nombre, rol, empresa_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@plataforma.com'),
  'Super Admin',
  'Super_Admin',
  NULL  -- Super_Admin no pertenece a ninguna empresa específica
);
```

### Consultar datos cross-tenant
```sql
-- Como Super_Admin, ver todas las empresas
SELECT * FROM empresas;

-- Ver usuarios de todas las empresas
SELECT p.*, e.nombre as empresa_nombre
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
ORDER BY e.nombre, p.nombre;

-- Ver registros de una empresa específica
SELECT * FROM registros WHERE empresa_id = '[uuid-empresa]';
```

### Crear empresa y usuario
```sql
-- Crear nueva empresa
INSERT INTO empresas (nombre, nivel_automatizacion)
VALUES ('Empresa Demo', 'parcial')
RETURNING id;

-- Crear usuario en esa empresa
INSERT INTO perfiles (id, nombre, rol, empresa_id)
VALUES (
  '[uuid-usuario]',
  'Usuario Demo',
  'Dueño',
  '[uuid-empresa]'
);
```

## 🔐 Seguridad

### Validaciones Implementadas
1. ✅ Solo usuarios con rol `Super_Admin` tienen acceso cross-tenant
2. ✅ Todas las inserciones validan `empresa_id IS NOT NULL`
3. ✅ Las actualizaciones no pueden cambiar `empresa_id` a NULL
4. ✅ RLS habilitado en todas las tablas relevantes
5. ✅ Función `is_super_admin()` con `SECURITY DEFINER`

### Consideraciones
- Super_Admin debe ser un rol restringido y auditado
- Se recomienda limitar el número de usuarios Super_Admin
- Todas las acciones de Super_Admin deben registrarse en `audit_logs`
- El filtro por empresa en la aplicación es opcional pero recomendado

## 📝 Requirements Cumplidos

- ✅ **Requirement 2.7**: Super_Admin puede consultar datos con filtro opcional por empresa
- ✅ **Requirement 14.4**: Super_Admin puede cambiar contexto entre empresas

## 🔄 Próximos Pasos

La siguiente tarea es **2.3: Crear políticas RLS para Storage** que implementará:
- Políticas de Storage con prefijo `{empresa_id}/`
- Validación de empresa_id en uploads
- Acceso cross-tenant para Super_Admin en Storage
- Límites de storage por empresa

## 📚 Referencias

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Archivo: `supabase/multi-tenant-rls-base.sql` (Tarea 2.1)
- Design Document: `.kiro/specs/multi-tenant-platform/design.md`
- Requirements: `.kiro/specs/multi-tenant-platform/requirements.md`
