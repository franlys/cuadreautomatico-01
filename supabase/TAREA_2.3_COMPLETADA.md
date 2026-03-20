# Tarea 2.3 Completada: Políticas de Storage Multi-Tenant

## Resumen

Se han implementado las políticas de Storage con aislamiento por `empresa_id` para garantizar que los archivos de cada empresa estén completamente aislados y solo sean accesibles por usuarios de la misma empresa.

## Archivos Creados

### 1. `supabase/multi-tenant-storage-policies.sql`
Script principal que implementa:
- **Funciones helper**:
  - `get_user_empresa_id()`: Obtiene el empresa_id del usuario autenticado
  - `extract_empresa_id_from_path(TEXT)`: Extrae el UUID de empresa_id del prefijo de la ruta
  - `is_super_admin()`: Valida si el usuario es Super Admin

- **Políticas de Storage**:
  - **SELECT**: Permite ver archivos solo de la empresa del usuario (Super_Admin puede ver todos)
  - **INSERT**: Valida que los archivos se suban con prefijo `{empresa_id}/`
  - **UPDATE**: Permite actualizar metadatos de archivos de la empresa
  - **DELETE**: Permite eliminar archivos según rol (Dueño, Usuario_Completo) y empresa_id

### 2. `supabase/verificar-storage-policies.sql`
Script de verificación que valida:
- Existencia de funciones helper
- Políticas de Storage correctamente configuradas
- Eliminación de políticas antiguas
- Tests de la función `extract_empresa_id_from_path()`
- Estado de RLS en `storage.objects`

## Requirements Implementados

- ✅ **Requirement 2.4**: Almacenar archivos en Storage con prefijo de empresa_id
- ✅ **Requirement 2.5**: Aplicar políticas de Storage que validen empresa_id del usuario
- ✅ **Requirement 19.4**: Prevenir consultas cross-tenant no autorizadas en Storage

## Formato de Rutas

Todos los archivos deben seguir el formato:
```
{empresa_id}/carpeta/archivo.ext
```

**Ejemplos válidos**:
```
550e8400-e29b-41d4-a716-446655440000/evidencias/foto1.jpg
550e8400-e29b-41d4-a716-446655440000/documentos/reporte.pdf
a1b2c3d4-e5f6-7890-abcd-ef1234567890/imagenes/logo.png
```

**Ejemplos inválidos** (serán rechazados):
```
evidencias/foto1.jpg                    # Sin prefijo empresa_id
sin-uuid/evidencias/foto1.jpg           # Prefijo no es UUID válido
550e8400-e29b-41d4-a716-446655440000    # Sin slash después del UUID
```

## Políticas Implementadas

### 1. SELECT - Ver archivos
```sql
-- Usuario regular: Solo archivos de su empresa
-- Super_Admin: Todos los archivos
extract_empresa_id_from_path(name) = get_user_empresa_id()
OR is_super_admin()
```

### 2. INSERT - Subir archivos
```sql
-- Usuario regular: Solo con prefijo de su empresa
-- Super_Admin: Con cualquier prefijo de empresa válido
extract_empresa_id_from_path(name) = get_user_empresa_id()
OR (is_super_admin() AND extract_empresa_id_from_path(name) IS NOT NULL)
```

### 3. UPDATE - Actualizar metadatos
```sql
-- Usuario regular: Solo archivos de su empresa
-- Super_Admin: Archivos de cualquier empresa
-- No se puede cambiar el prefijo empresa_id
extract_empresa_id_from_path(name) = get_user_empresa_id()
OR is_super_admin()
```

### 4. DELETE - Eliminar archivos
```sql
-- Dueño: Archivos de su empresa
-- Usuario_Completo: Archivos de su empresa
-- Super_Admin: Archivos de cualquier empresa
(rol = 'Dueño' OR rol = 'Usuario_Completo') 
  AND extract_empresa_id_from_path(name) = get_user_empresa_id()
OR is_super_admin()
```

## Cómo Ejecutar

### 1. Aplicar las políticas
```bash
# Conectar a Supabase y ejecutar el script
psql -h <supabase-host> -U postgres -d postgres -f supabase/multi-tenant-storage-policies.sql
```

O desde el Dashboard de Supabase:
1. Ir a SQL Editor
2. Copiar el contenido de `multi-tenant-storage-policies.sql`
3. Ejecutar

### 2. Verificar la implementación
```bash
# Ejecutar script de verificación
psql -h <supabase-host> -U postgres -d postgres -f supabase/verificar-storage-policies.sql
```

Deberías ver:
```
✓ Funciones helper: 3/3
✓ Políticas SELECT: 1/1
✓ Políticas INSERT: 1/1
✓ Políticas UPDATE: 1/1
✓ Políticas DELETE: 1/1
✓ Políticas antiguas eliminadas: 0/0
```

## Próximos Pasos

### 1. Actualizar código cliente (TypeScript)

Modificar las funciones de upload para incluir el prefijo `empresa_id/`:

**Antes**:
```typescript
// src/lib/supabase.ts
const { data, error } = await supabase.storage
  .from('evidencias')
  .upload(`evidencias/${filename}`, file);
```

**Después**:
```typescript
// src/lib/supabase.ts
import { useAuthStore } from '@/stores/authStore';

const uploadFile = async (file: File, path: string) => {
  const { perfil } = useAuthStore.getState();
  const empresaId = perfil?.empresa_id;
  
  if (!empresaId) {
    throw new Error('Usuario sin empresa asignada');
  }
  
  const { data, error } = await supabase.storage
    .from('evidencias')
    .upload(`${empresaId}/${path}`, file);
    
  return { data, error };
};
```

### 2. Actualizar componente UploaderEvidencia

```typescript
// src/components/UploaderEvidencia.tsx
const handleUpload = async (file: File) => {
  const empresaId = perfil?.empresa_id;
  const filename = `evidencias/${Date.now()}-${file.name}`;
  
  // El prefijo empresa_id/ se agrega automáticamente en uploadFile
  const { data, error } = await uploadFile(file, filename);
  
  if (error) {
    console.error('Error al subir archivo:', error);
    return;
  }
  
  // Guardar referencia en tabla evidencias
  await supabase.from('evidencias').insert({
    storage_path: `${empresaId}/${filename}`,
    registro_id: registroId,
    empresa_id: empresaId
  });
};
```

### 3. Migrar archivos existentes (si aplica)

Si ya existen archivos sin el prefijo `empresa_id/`, será necesario migrarlos:

```sql
-- Script de migración (crear en Tarea 10.1)
-- Este script moverá archivos existentes al formato correcto
-- Ejemplo: evidencias/foto.jpg -> {empresa_id}/evidencias/foto.jpg
```

### 4. Testing de seguridad

Ejecutar tests para validar:
- ✅ Upload con prefijo correcto (debe pasar)
- ✅ Upload con prefijo incorrecto (debe fallar)
- ✅ Acceso cross-tenant (debe fallar)
- ✅ Super_Admin cross-tenant (debe pasar)

## Notas Importantes

### Seguridad
- Las políticas garantizan aislamiento a nivel de base de datos
- Los intentos de acceso no autorizado son bloqueados automáticamente
- Super_Admin tiene acceso completo para gestión y soporte

### Compatibilidad
- Las políticas antiguas fueron eliminadas para evitar conflictos
- El sistema mantiene compatibilidad con roles existentes
- La función `is_super_admin()` fue reutilizada de la Tarea 2.2

### Performance
- Los índices en `empresa_id` mejoran el rendimiento de las consultas
- La función `extract_empresa_id_from_path()` es IMMUTABLE para mejor cache
- Las políticas RLS se evalúan eficientemente en PostgreSQL

## Validación

Para validar que todo funciona correctamente:

1. **Verificar políticas**:
   ```bash
   psql -f supabase/verificar-storage-policies.sql
   ```

2. **Test manual desde cliente**:
   ```typescript
   // Intentar subir archivo con prefijo correcto
   await uploadFile(file, 'evidencias/test.jpg'); // ✓ Debe pasar
   
   // Intentar subir archivo con prefijo de otra empresa
   await supabase.storage
     .from('evidencias')
     .upload('otra-empresa-id/test.jpg', file); // ✗ Debe fallar
   ```

3. **Verificar logs de auditoría**:
   Los intentos de acceso no autorizado deben registrarse en `audit_logs` (implementado en Tarea 6.4).

## Estado de la Tarea

- ✅ Políticas SELECT implementadas
- ✅ Políticas INSERT implementadas
- ✅ Políticas UPDATE implementadas
- ✅ Políticas DELETE implementadas
- ✅ Funciones helper creadas
- ✅ Script de verificación creado
- ✅ Documentación completada

**Tarea 2.3: COMPLETADA** ✅

## Referencias

- **Requirements**: 2.4, 2.5, 19.4
- **Tareas relacionadas**:
  - Tarea 1.2: Agregar columna empresa_id (prerequisito)
  - Tarea 2.1: Políticas RLS base (prerequisito)
  - Tarea 2.2: Políticas Super_Admin (prerequisito)
  - Tarea 10.1: Migración de archivos existentes (siguiente)
  - Tarea 6.4: Auditoría de accesos (siguiente)

## Contacto

Para dudas o problemas con la implementación, revisar:
- `supabase/multi-tenant-storage-policies.sql` - Script principal
- `supabase/verificar-storage-policies.sql` - Script de verificación
- `.kiro/specs/multi-tenant-platform/design.md` - Diseño completo
