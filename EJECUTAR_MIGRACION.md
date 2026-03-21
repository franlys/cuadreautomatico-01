# Ejecutar Migración Multi-Tenant

## ⚠️ IMPORTANTE: Debes ejecutar este script manualmente

El script de migración **NO se ejecuta automáticamente**. Debes copiarlo y pegarlo en el SQL Editor de Supabase.

---

## Pasos para Ejecutar la Migración

### 1. Abrir Supabase SQL Editor

1. Ve a tu proyecto de Supabase: https://emifgmstkhkpgrshlsnt.supabase.co
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query** para crear una nueva consulta

### 2. Copiar el Script de Migración

Abre el archivo: `supabase/migracion-completa-empresa-1.sql`

O copia el contenido completo del script que está al final de este documento.

### 3. Pegar y Ejecutar

1. Pega el script completo en el SQL Editor
2. Haz clic en el botón **Run** (o presiona Ctrl+Enter)
3. Espera a que termine la ejecución (puede tardar unos segundos)

### 4. Verificar Resultados

Deberías ver varios mensajes de éxito:

```
✅ Empresa 1 encontrada con ID: [uuid]
✅ Migrados X perfiles a Empresa 1
✅ Migrados X empleados a Empresa 1
✅ Migradas X rutas a Empresa 1
✅ Migrados X conceptos a Empresa 1
✅ Migradas X semanas laborales a Empresa 1
✅ Migrados X folders diarios a Empresa 1
✅ Migrados X registros a Empresa 1
✅ Migrados X depósitos a Empresa 1
✅ Migradas X evidencias a Empresa 1
✅ Migración registrada en audit_logs
```

Y tres tablas de resultados:

**Tabla 1: Resumen de Empresa 1**
- Muestra el ID, nombre, nivel, y contadores de usuarios, empleados, rutas, conceptos

**Tabla 2: Usuarios de Empresa 1**
- Lista todos los usuarios asociados a Empresa 1 con sus roles

**Tabla 3: Validación de Super_Admin**
- Confirma que Super_Admin tiene empresa_id = NULL

---

## ¿Qué hace este script?

### Crea "Empresa 1"
- Nombre: "Empresa 1"
- Nivel: parcial (puedes cambiarlo después a "completa")
- Activa: true
- Límite storage: 1000 MB

### Migra todos los datos existentes
- **Perfiles (usuarios)**: Todos excepto Super_Admin
- **Empleados**: Todos los empleados del catálogo
- **Rutas**: Todas las rutas del catálogo
- **Conceptos**: Todos los conceptos del catálogo
- **Semanas laborales**: Todas las semanas históricas
- **Folders diarios**: Todos los folders históricos
- **Registros**: Todos los ingresos y egresos
- **Depósitos**: Todos los depósitos bancarios
- **Evidencias**: Todas las evidencias cargadas

### Preserva Super_Admin
- Super_Admin mantiene empresa_id = NULL
- Puede ver y gestionar todas las empresas

---

## Después de la Migración

### 1. Verificar en el Dashboard

Como Super_Admin (franlysgonzaleztejeda@gmail.com):
1. Inicia sesión en la aplicación
2. Ve al Dashboard Super Admin
3. Deberías ver "Empresa 1" en la lista
4. Haz clic en "Usuarios" para ver los usuarios migrados

### 2. Verificar como Usuario Normal

Con cualquier usuario existente:
1. Inicia sesión
2. Deberías ver todos tus datos históricos
3. Folders, registros, depósitos deben estar intactos

### 3. Cambiar Nivel de Automatización (Opcional)

Si quieres activar hojas de ruta:
1. Como Super_Admin, ve a Dashboard Super Admin
2. En la fila de "Empresa 1", haz clic en "Nivel"
3. Cambia de "Parcial" a "Completa"
4. Confirma el cambio
5. Los usuarios de Empresa 1 ahora verán el menú "Hojas de Ruta"

---

## Troubleshooting

### Error: "Empresa 1 ya existe"
Si ya ejecutaste el script antes, puedes:
1. Eliminar Empresa 1: `DELETE FROM empresas WHERE nombre = 'Empresa 1';`
2. Volver a ejecutar el script completo

### Error: "empresa_id no puede ser NULL"
Esto significa que las columnas empresa_id no se agregaron correctamente. Debes ejecutar primero:
- `supabase/multi-tenant-rls-base-fixed.sql`
- `supabase/multi-tenant-automation-tables.sql`

### No veo usuarios en Empresa 1
Verifica que los usuarios tengan perfiles creados:
```sql
SELECT u.email, p.nombre, p.rol, p.empresa_id
FROM auth.users u
LEFT JOIN perfiles p ON p.id = u.id
WHERE p.id IS NOT NULL;
```

### Super_Admin tiene empresa_id
Esto es un error. Corrígelo con:
```sql
UPDATE perfiles
SET empresa_id = NULL
WHERE rol = 'Super_Admin';
```

---

## Script Completo

```sql
-- Copia desde aquí hasta el final del archivo:
-- supabase/migracion-completa-empresa-1.sql
```

Ver el archivo completo en: `supabase/migracion-completa-empresa-1.sql`

---

## Resumen

1. ✅ Copia el script de `supabase/migracion-completa-empresa-1.sql`
2. ✅ Pégalo en Supabase SQL Editor
3. ✅ Haz clic en "Run"
4. ✅ Verifica los resultados
5. ✅ Recarga la aplicación
6. ✅ Verifica que Super_Admin ve "Empresa 1"
7. ✅ Verifica que usuarios normales ven sus datos

¡Listo para migrar! 🚀
