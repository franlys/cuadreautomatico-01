# 🔧 Solución: Super Admin no puede ver Empresas

## Problema Identificado

```
Error: permission denied for table empresas
```

El Super Admin no puede leer la tabla `empresas` porque la función `is_super_admin()` tiene un error.

### Causa Raíz

La función `is_super_admin()` está usando:
```sql
WHERE id = auth.uid()  -- ❌ INCORRECTO
```

Pero debería usar:
```sql
WHERE user_id = auth.uid()  -- ✅ CORRECTO
```

**Explicación**:
- `id` = UUID del perfil (generado por la tabla perfiles)
- `user_id` = UUID del usuario de autenticación (viene de auth.users)
- `auth.uid()` retorna el UUID de auth.users, no el UUID del perfil

---

## 🚀 Solución Rápida

### Paso 1: Ejecutar Diagnóstico (Opcional)

Si quieres ver el problema en detalle:

1. Ve a Supabase SQL Editor
2. Copia y pega el contenido de: `supabase/diagnostico-super-admin-completo.sql`
3. Ejecuta
4. Verás que `is_super_admin()` retorna FALSE cuando debería retornar TRUE

### Paso 2: Aplicar Corrección (REQUERIDO)

1. Ve a Supabase SQL Editor
2. Copia y pega el contenido de: `supabase/fix-is-super-admin-function.sql`
3. Ejecuta
4. Verifica que los 3 tests al final muestren:
   - ✅ Tu usuario con rol='Super_Admin'
   - ✅ is_super_admin() = TRUE
   - ✅ Lista de empresas (incluyendo "Empresa 1")

---

## 📋 Script de Corrección

Si prefieres copiar directamente, aquí está el script completo:

```sql
-- =====================================================
-- FIX CRÍTICO: Función is_super_admin()
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.is_super_admin();

-- Crear función corregida
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE user_id = auth.uid()  -- CORRECCIÓN: usar user_id
    AND rol = 'Super_Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar que funciona
SELECT 
  auth.uid() as tu_user_id,
  is_super_admin() as es_super_admin,
  (SELECT rol FROM perfiles WHERE user_id = auth.uid()) as tu_rol;

-- Intentar leer empresas
SELECT * FROM empresas ORDER BY nombre;
```

---

## ✅ Verificación Post-Corrección

Después de ejecutar el script:

### En Supabase SQL Editor:

```sql
-- Debe retornar TRUE
SELECT is_super_admin();

-- Debe mostrar "Empresa 1"
SELECT * FROM empresas;
```

### En la Aplicación Web:

1. Refresca la página (F5)
2. Ve a "Super Admin"
3. Deberías ver:
   - ✅ Empresas Activas: 1
   - ✅ Total Empresas: 1
   - ✅ Lista con "Empresa 1"

---

## 🔍 ¿Por qué pasó esto?

El archivo `supabase/multi-tenant-rls-super-admin-fixed.sql` que ejecutaste anteriormente tenía la función con el error:

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $
  SELECT EXISTS (
    SELECT 1 
    FROM public.perfiles 
    WHERE id = auth.uid()  -- ❌ Aquí está el error
      AND rol = 'Super_Admin'
  );
$;
```

Esto causó que todas las políticas RLS que dependen de `is_super_admin()` fallaran.

---

## 📊 Estructura de Tabla Perfiles

Para referencia:

```
perfiles
├── id (UUID)              ← Generado por la tabla
├── user_id (UUID)         ← Referencia a auth.users (auth.uid())
├── nombre (TEXT)
├── rol (TEXT)
├── empresa_id (INTEGER)   ← NULL para Super_Admin
├── activo (BOOLEAN)
└── created_at (TIMESTAMP)
```

---

## 🎯 Próximos Pasos

Una vez ejecutado el script:

1. ✅ Refresca la aplicación web
2. ✅ Verifica que ves "Empresa 1" en el dashboard
3. ✅ Prueba crear un usuario desde la UI
4. ✅ Prueba cambiar el nivel de automatización
5. ✅ Continúa con las pruebas desde móvil

---

## 📞 Si Aún No Funciona

Si después de ejecutar el script sigues sin ver empresas:

1. Verifica que estás logueado como franlysgonzaleztejeda@gmail.com
2. Cierra sesión y vuelve a entrar
3. Ejecuta este diagnóstico en SQL Editor:

```sql
-- Ver tu usuario
SELECT 
  auth.uid() as mi_user_id,
  p.*
FROM perfiles p
WHERE p.user_id = auth.uid();

-- Ver función
SELECT is_super_admin();

-- Ver políticas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'empresas';
```

4. Comparte los resultados para más ayuda

---

## 📚 Archivos Relacionados

- `supabase/fix-is-super-admin-function.sql` - Script de corrección (EJECUTAR ESTE)
- `supabase/diagnostico-super-admin-completo.sql` - Diagnóstico detallado (opcional)
- `supabase/multi-tenant-rls-super-admin-fixed.sql` - Archivo original con el error
- `LISTO_PARA_PROBAR.md` - Guía de pruebas completa

---

## ✨ Resumen

**Problema**: `permission denied for table empresas`
**Causa**: Función `is_super_admin()` usa `id` en lugar de `user_id`
**Solución**: Ejecutar `supabase/fix-is-super-admin-function.sql`
**Tiempo**: 30 segundos
**Resultado**: Dashboard mostrará "Empresa 1" correctamente
