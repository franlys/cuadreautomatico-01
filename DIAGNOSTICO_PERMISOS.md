# 🔍 Diagnóstico de Problemas de Permisos

## Problema
El usuario `franlysgonzalez@cuadre.com` no puede acceder a las funciones a pesar de tener el rol `Usuario_Completo`.

---

## Paso 1: Verificar Perfil en Base de Datos

### 1.1 Ejecutar Diagnóstico Completo

Ve a **Supabase Dashboard** → **SQL Editor** y ejecuta el archivo:
```
supabase/diagnostico-completo.sql
```

### 1.2 Verificar Resultados

**Query 1 - Usuario en Auth:**
- ✅ Debe mostrar el usuario con email `franlysgonzalez@cuadre.com`
- ✅ Debe tener `email_confirmed_at` con una fecha (email confirmado)

**Query 2 - Perfil en Tabla:**
- ✅ Debe mostrar un registro con `rol = 'Usuario_Completo'`
- ❌ Si NO aparece nada, el perfil NO EXISTE (ir a Paso 2)

**Query 7 - Acceso Directo:**
- ✅ Debe mostrar el mismo perfil
- ❌ Si NO aparece nada, hay un problema con RLS

---

## Paso 2: Crear Perfil (Si No Existe)

Si el perfil no existe, ejecuta esto en **SQL Editor**:

```sql
INSERT INTO perfiles (id, email, nombre, rol)
VALUES (
  'c596b581-3d13-456e-8340-1d2ca460f61a',
  'franlysgonzalez@cuadre.com',
  'Franlys González',
  'Usuario_Completo'
)
ON CONFLICT (id) DO UPDATE
SET 
  rol = 'Usuario_Completo',
  email = 'franlysgonzalez@cuadre.com',
  updated_at = NOW();
```

Luego verifica:
```sql
SELECT * FROM perfiles WHERE id = 'c596b581-3d13-456e-8340-1d2ca460f61a';
```

---

## Paso 3: Verificar Frontend (Componente de Debug)

### 3.1 Agregar Componente de Debug

Abre `src/pages/FolderDiarioPage.tsx` y agrega el componente de debug:

```typescript
import { DebugAuth } from '../components/DebugAuth';

export function FolderDiarioPage() {
  // ... código existente ...
  
  return (
    <Layout>
      <DebugAuth /> {/* ← AGREGAR ESTA LÍNEA */}
      
      <div className="space-y-6">
        {/* ... resto del código ... */}
      </div>
    </Layout>
  );
}
```

### 3.2 Ver Información de Debug

1. Guarda el archivo
2. Recarga la página en el navegador
3. Verás un cuadro azul en la esquina inferior derecha
4. Revisa la información mostrada:

**Lo que DEBE aparecer:**
- ✅ Authenticated: Sí
- ✅ User ID: `c596b581-3d13-456e-8340-1d2ca460f61a`
- ✅ User Email: `franlysgonzalez@cuadre.com`
- ✅ Perfil ID: `c596b581-3d13-456e-8340-1d2ca460f61a`
- ✅ Perfil Email: `franlysgonzalez@cuadre.com`
- ✅ **ROL: Usuario_Completo** ← ESTO ES LO MÁS IMPORTANTE

**Si el ROL aparece como "❌ NO HAY ROL":**
- El perfil no se está cargando correctamente
- Ir a Paso 4

---

## Paso 4: Limpiar Caché y Sesión

### 4.1 Cerrar Sesión Completamente

1. En la aplicación, haz clic en **Cerrar Sesión**
2. Cierra todas las pestañas del navegador con la aplicación
3. Abre el navegador en modo incógnito o privado

### 4.2 Limpiar Caché del Navegador

**Chrome/Edge:**
1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **Application**
3. En el menú izquierdo:
   - **Local Storage** → Elimina todo
   - **Session Storage** → Elimina todo
   - **IndexedDB** → Elimina la base de datos `cuadre-automatico-db`

**Firefox:**
1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **Storage**
3. Elimina todo en Local Storage, Session Storage e IndexedDB

### 4.3 Iniciar Sesión de Nuevo

1. Ve a la página de login
2. Ingresa: `franlysgonzalez@cuadre.com`
3. Ingresa la contraseña
4. Inicia sesión

---

## Paso 5: Verificar Consola del Navegador

### 5.1 Abrir Consola

1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **Console**

### 5.2 Buscar Errores

Busca mensajes de error relacionados con:
- ❌ `permission denied for table perfiles`
- ❌ `RLS policy violation`
- ❌ `Failed to fetch perfil`
- ❌ Cualquier error en rojo

### 5.3 Hacer Click en "Log to Console"

En el componente de debug (cuadro azul), haz click en el botón **"Log to Console"**.

Esto imprimirá toda la información de autenticación en la consola. Revisa:
- ¿El objeto `perfil` tiene datos?
- ¿El campo `rol` existe y tiene el valor correcto?

---

## Paso 6: Verificar Políticas RLS

Si después de todo lo anterior el problema persiste, verifica las políticas RLS:

### 6.1 Verificar que las Políticas Existen

En **SQL Editor**, ejecuta:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'perfiles'
  AND policyname ILIKE '%usuario_completo%';
```

Debe mostrar al menos:
- `perfiles_select_usuario_completo` (SELECT)
- `perfiles_update_usuario_completo` (UPDATE)

### 6.2 Re-ejecutar Script de Políticas

Si faltan políticas, ejecuta de nuevo:
```
supabase/fix-usuario-completo-policies.sql
```

---

## Paso 7: Verificar Permisos de Tabla

Ejecuta en **SQL Editor**:

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'perfiles'
  AND grantee = 'authenticated';
```

Debe mostrar:
- ✅ SELECT
- ✅ INSERT
- ✅ UPDATE
- ✅ DELETE

Si falta alguno, ejecuta:
```sql
GRANT ALL ON perfiles TO authenticated;
```

---

## Solución Rápida (Si Todo Falla)

Si después de todos los pasos anteriores el problema persiste:

### Opción 1: Deshabilitar RLS Temporalmente

```sql
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA:** Esto deshabilita la seguridad. Solo para diagnóstico.

### Opción 2: Crear Política Permisiva Temporal

```sql
CREATE POLICY "temp_allow_all_perfiles"
ON perfiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## Checklist Final

Antes de contactar soporte, verifica:

- [ ] El perfil existe en la tabla `perfiles`
- [ ] El perfil tiene `rol = 'Usuario_Completo'`
- [ ] El usuario puede iniciar sesión sin errores
- [ ] El componente de debug muestra el ROL correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Se limpió el caché del navegador
- [ ] Se cerró sesión y se volvió a iniciar
- [ ] Las políticas RLS existen para Usuario_Completo
- [ ] La tabla `perfiles` tiene permisos GRANT para `authenticated`

---

## Información para Soporte

Si el problema persiste, proporciona:

1. **Captura de pantalla del componente de debug** (cuadro azul)
2. **Captura de pantalla de la consola del navegador** (F12 → Console)
3. **Resultado de la Query 2** del diagnóstico completo
4. **Resultado de la Query 7** del diagnóstico completo
5. **Mensaje de error exacto** que aparece en la aplicación
