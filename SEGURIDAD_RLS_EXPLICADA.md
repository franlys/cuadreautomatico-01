# Seguridad RLS - Explicación Completa

## ¿Qué es RLS (Row Level Security)?

RLS es seguridad a nivel de **fila** en PostgreSQL. Significa que la base de datos **automáticamente** filtra qué filas puede ver/modificar cada usuario, **sin importar** qué consultas SQL se ejecuten desde la aplicación.

## ¿Por qué es seguro contra ataques?

### Sin RLS (INSEGURO) ❌
```typescript
// Si un atacante modifica el código JavaScript:
const { data } = await supabase
  .from('registros')
  .select('*')
  .eq('empresa_id', 'CUALQUIER_EMPRESA_ID'); // ← Puede ver otras empresas
```
**Resultado**: El atacante puede ver datos de otras empresas.

### Con RLS (SEGURO) ✅
```typescript
// Aunque el atacante modifique el código:
const { data } = await supabase
  .from('registros')
  .select('*')
  .eq('empresa_id', 'CUALQUIER_EMPRESA_ID'); // ← PostgreSQL filtra automáticamente
```
**Resultado**: PostgreSQL **automáticamente** filtra y solo devuelve datos de SU empresa, ignorando el parámetro malicioso.

## Cómo funciona la solución implementada

### 1. Funciones Helper (Seguras)

```sql
-- Valida si el usuario es Super Admin
is_super_admin() → TRUE/FALSE

-- Obtiene la empresa del usuario
get_user_empresa_id() → UUID de su empresa
```

Estas funciones son `SECURITY DEFINER`, lo que significa que se ejecutan con privilegios elevados y **no pueden ser manipuladas** por el usuario.

### 2. Políticas RLS por Tabla

Cada tabla tiene 4 políticas (SELECT, INSERT, UPDATE, DELETE):

#### Ejemplo: Tabla REGISTROS

**SELECT (Leer)**
```sql
Super Admin: Ve TODO
Usuario normal: Solo ve registros de SU empresa
```

**INSERT (Crear)**
```sql
Super Admin: Puede crear en CUALQUIER empresa
Usuario normal: Solo puede crear en SU empresa
```

**UPDATE (Actualizar)**
```sql
Super Admin: Puede actualizar TODO
Usuario normal: Solo puede actualizar de SU empresa
```

**DELETE (Eliminar)**
```sql
Super Admin: Puede eliminar TODO
Usuario normal: Solo puede eliminar de SU empresa
```

### 3. Tabla EMPRESAS (Especial)

```sql
Super Admin: CRUD completo (Create, Read, Update, Delete)
Usuario normal: Solo puede VER su empresa (no crear/modificar/eliminar)
```

### 4. Tabla PERFILES (Crítica)

```sql
Super Admin: CRUD completo en TODOS los perfiles
Usuario normal: 
  - SELECT: Ve perfiles de su empresa
  - UPDATE: Solo puede actualizar SU PROPIO perfil
  - INSERT/DELETE: NO PUEDE
```

### 5. Tabla AUDIT_LOGS (Solo Super Admin)

```sql
Super Admin: Puede ver todos los logs
Usuario normal: NO puede ver logs (pero sí insertarlos para tracking)
```

## Protecciones Implementadas

### ✅ Contra SQL Injection
RLS se aplica **después** de cualquier consulta SQL, incluso si un atacante inyecta código malicioso.

### ✅ Contra Acceso Cross-Tenant
Un usuario de "Empresa A" **nunca** puede ver datos de "Empresa B", sin importar qué haga en el frontend.

### ✅ Contra Modificación de Código Frontend
Aunque un atacante modifique el JavaScript en el navegador, PostgreSQL filtra los datos en el servidor.

### ✅ Contra Escalación de Privilegios
Un usuario normal **no puede** cambiar su rol a Super_Admin porque:
1. Solo puede actualizar su propio perfil
2. La política valida que `empresa_id` no cambie
3. El campo `rol` está protegido por la aplicación

### ✅ Super Admin con Acceso Total
El Super Admin puede:
- Ver todas las empresas
- Crear/modificar/eliminar usuarios en cualquier empresa
- Ver todos los registros de todas las empresas
- Gestionar configuraciones globales
- Ver audit logs

## Cómo Probar la Seguridad

### Test 1: Usuario Normal Intenta Ver Otra Empresa
```sql
-- Usuario de Empresa A intenta ver Empresa B
SELECT * FROM registros WHERE empresa_id = 'empresa-b-uuid';
-- Resultado: 0 filas (PostgreSQL filtra automáticamente)
```

### Test 2: Usuario Normal Intenta Crear en Otra Empresa
```sql
-- Usuario de Empresa A intenta crear registro en Empresa B
INSERT INTO registros (empresa_id, ...) VALUES ('empresa-b-uuid', ...);
-- Resultado: ERROR - new row violates row-level security policy
```

### Test 3: Super Admin Ve Todo
```sql
-- Super Admin consulta sin filtro
SELECT * FROM registros;
-- Resultado: TODOS los registros de TODAS las empresas
```

### Test 4: Usuario Normal Intenta Cambiar su Empresa
```sql
-- Usuario intenta cambiar su empresa_id
UPDATE perfiles SET empresa_id = 'otra-empresa' WHERE id = auth.uid();
-- Resultado: ERROR - new row violates row-level security policy
```

## Diferencia con la Solución Anterior

### Antes (RLS Deshabilitado) ❌
```
- Cualquier usuario autenticado podía hacer CUALQUIER cosa
- Sin protección contra ataques
- Dependía 100% del código frontend (inseguro)
```

### Ahora (RLS Habilitado) ✅
```
- Super Admin: Acceso total controlado
- Usuarios normales: Aislados por empresa
- Protección a nivel de base de datos (seguro)
- Independiente del código frontend
```

## Ejecutar la Solución

1. **Copia** el contenido de `supabase/rls-seguro-completo-final.sql`
2. **Pega** en Supabase SQL Editor
3. **Ejecuta** el script completo
4. **Verifica** los resultados al final del script

## Verificación Post-Ejecución

El script muestra automáticamente:
- ✓ Estado de RLS en cada tabla
- ✓ Políticas creadas (4 por tabla)
- ✓ Funciones helper disponibles

## Mantenimiento Futuro

### Agregar Nueva Tabla
```sql
-- 1. Habilitar RLS
ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas (copiar patrón de otras tablas)
CREATE POLICY "nueva_tabla_select_policy" ON nueva_tabla FOR SELECT TO authenticated
USING (public.is_super_admin() OR empresa_id = public.get_user_empresa_id());

-- 3. Repetir para INSERT, UPDATE, DELETE
```

### Modificar Permisos de un Rol
Edita las políticas específicas en el script y re-ejecuta.

## Resumen

🔒 **Seguridad Máxima**: RLS protege a nivel de base de datos
👑 **Super Admin Poderoso**: Acceso total sin restricciones
🏢 **Multi-Tenant Seguro**: Cada empresa aislada de las demás
🛡️ **Anti-Ataques**: Protección contra SQL injection y manipulación frontend
📊 **Auditable**: Logs solo visibles para Super Admin
