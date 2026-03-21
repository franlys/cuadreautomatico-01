# Solución: Permisos y Empresas Duplicadas

## Problemas Identificados

1. **Empresas duplicadas**: Aparecen 2 registros de "Empresa 1" en el dashboard
2. **Error 403 en evidencias**: `permission denied for table evidencias`
3. **Falta scroll horizontal**: No se pueden ver todas las columnas de la tabla en pantallas pequeñas

## Soluciones Aplicadas

### 1. Script SQL Completo

He creado el archivo `supabase/fix-all-permissions-and-duplicates.sql` que:

- ✅ Elimina la empresa "Empresa 1" duplicada (la que tiene 0 usuarios)
- ✅ Otorga permisos SELECT, INSERT, UPDATE, DELETE a TODAS las tablas necesarias
- ✅ Verifica el estado final de permisos y RLS

**Tablas con permisos otorgados:**
- empresas, perfiles, empleados, rutas, conceptos
- semanas_laborales, folders_diarios, registros, depositos, evidencias
- audit_logs, hojas_ruta, entregas_hoja_ruta, pagos_hoja_ruta, gastos_hoja_ruta

### 2. Scroll Horizontal en Dashboard

He modificado `src/pages/DashboardSuperAdmin.tsx`:
- Cambié `overflow-hidden` por `overflow-x-auto` en el contenedor de la tabla
- Ahora puedes hacer scroll horizontal para ver todas las columnas

## Instrucciones de Ejecución

### Paso 1: Ejecutar el script SQL

1. Abre Supabase SQL Editor: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/sql/new
2. Copia y pega el contenido de `supabase/fix-all-permissions-and-duplicates.sql`
3. Haz clic en "Run"
4. Revisa los resultados:
   - Paso 1-2: Debe quedar solo UNA "Empresa 1" con 2 usuarios
   - Paso 3: Todas las tablas deben tener permisos SELECT, INSERT, UPDATE, DELETE
   - Paso 4: RLS debe estar DISABLED en empresas
   - Paso 5: Función is_super_admin debe existir

### Paso 2: Limpiar caché del navegador

Después de ejecutar el script:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. Haz clic derecho en "Local Storage" → "Clear"
4. Haz clic derecho en "Session Storage" → "Clear"
5. Cierra sesión en la aplicación
6. Vuelve a iniciar sesión con: franlysgonzaleztejeda@gmail.com

### Paso 3: Verificar funcionamiento

Después de iniciar sesión:

1. ✅ Debes ver solo UNA "Empresa 1" en el dashboard
2. ✅ No debe aparecer error 403 en la consola
3. ✅ Puedes hacer scroll horizontal en la tabla para ver todas las columnas
4. ✅ El botón "Usuarios" debe funcionar correctamente

## Verificación de Usuarios por Empresa

Para ver los usuarios de cada empresa:

1. En el dashboard de Super Admin, busca la columna "Acciones"
2. Haz clic en el botón "Usuarios" de la empresa que quieras ver
3. Se abrirá el componente `GestionUsuariosEmpresa` con la lista de usuarios

## Próximos Pasos (Opcional)

Una vez que todo funcione correctamente, puedes:

1. **Re-habilitar RLS en empresas** (para mayor seguridad):
   ```sql
   ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
   ```

2. **Verificar que las políticas RLS funcionan** con is_super_admin()

## Notas Importantes

- El Super Admin (franlysgonzaleztejeda@gmail.com) tiene acceso a TODAS las empresas
- El Super Admin tiene `empresa_id = NULL` en su perfil
- La función `is_super_admin()` usa `WHERE id = auth.uid()` (correcto para la estructura de perfiles)
- RLS está temporalmente DESHABILITADO en empresas para evitar problemas de permisos

## Archivos Modificados

1. `supabase/fix-all-permissions-and-duplicates.sql` - Script SQL completo (NUEVO)
2. `src/pages/DashboardSuperAdmin.tsx` - Agregado scroll horizontal (MODIFICADO)
