# Guía para Crear Usuarios

## 📋 Roles Disponibles

| Rol | Permisos | Uso |
|-----|----------|-----|
| `Usuario_Completo` | Crear, editar, eliminar todo (registros, depósitos, catálogos, cerrar folders) | Operador principal |
| `Dueño` | Solo lectura + exportar PDF/XLSX | Supervisor |
| `Usuario_Ingresos` | Crear ingresos y depósitos, ver/crear catálogos | Operador de ingresos |
| `Usuario_Egresos` | Crear egresos, ver/crear catálogos | Operador de egresos |

---

## 🚀 Método 1: Desde Supabase Dashboard (Recomendado)

### Paso 1: Crear Usuario en Auth

1. Ve a tu proyecto en https://supabase.com
2. Ve a **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Completa el formulario:
   - **Email**: `usuario@empresa.com`
   - **Password**: Genera una contraseña segura
   - **Auto Confirm User**: ✅ Activado (para que no necesite confirmar email)
5. Haz clic en **Create user**
6. **IMPORTANTE**: Copia el **User ID** (UUID) que aparece

### Paso 2: Crear Perfil

1. Ve a **Table Editor** → **perfiles**
2. Haz clic en **Insert** → **Insert row**
3. Completa los campos:
   - **id**: Pega el User ID del paso anterior
   - **nombre**: Nombre completo del usuario
   - **rol**: Selecciona el rol apropiado
   - **intentos_fallidos**: 0
   - **bloqueado_hasta**: null
4. Haz clic en **Save**

---

## 🔧 Método 2: Usando SQL (Más Rápido)

### Crear Usuario Completo

```sql
-- 1. Primero crea el usuario en Auth (desde el Dashboard)
-- 2. Copia el User ID
-- 3. Ejecuta este SQL reemplazando el ID

INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_AQUI', 'Juan Pérez', 'Usuario_Completo');
```

### Crear Dueño

```sql
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_AQUI', 'Carlos López', 'Dueño');
```

### Crear Usuario de Ingresos

```sql
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_AQUI', 'María García', 'Usuario_Ingresos');
```

### Crear Usuario de Egresos

```sql
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_AQUI', 'Pedro Martínez', 'Usuario_Egresos');
```

---

## 📝 Ejemplo Completo: Crear 4 Usuarios

### Paso 1: Crear en Auth

Crea estos 4 usuarios en **Authentication** → **Users**:

1. `juan@cuadre.com` - Usuario Completo
2. `carlos@cuadre.com` - Dueño
3. `maria@cuadre.com` - Usuario Ingresos
4. `pedro@cuadre.com` - Usuario Egresos

### Paso 2: Copiar User IDs

Después de crear cada usuario, copia su User ID. Ejemplo:
- Juan: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Carlos: `b2c3d4e5-f6a7-8901-bcde-f12345678901`
- María: `c3d4e5f6-a7b8-9012-cdef-123456789012`
- Pedro: `d4e5f6a7-b8c9-0123-def1-234567890123`

### Paso 3: Ejecutar SQL

```sql
-- Crear perfiles para todos los usuarios
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Juan Pérez', 'Usuario_Completo'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Carlos López', 'Dueño'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'María García', 'Usuario_Ingresos'),
  ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Pedro Martínez', 'Usuario_Egresos');
```

---

## 🔐 Cambiar Contraseña de Usuario

### Desde Dashboard

1. Ve a **Authentication** → **Users**
2. Haz clic en el usuario
3. Haz clic en **Reset password**
4. Ingresa la nueva contraseña
5. Haz clic en **Update user**

### Desde SQL

```sql
-- Nota: No puedes cambiar contraseñas directamente con SQL
-- Debes usar el Dashboard o la API de Supabase
```

---

## 🗑️ Eliminar Usuario

### Desde Dashboard

1. Ve a **Authentication** → **Users**
2. Haz clic en el usuario
3. Haz clic en **Delete user**
4. Confirma la eliminación

**IMPORTANTE**: Esto también eliminará automáticamente el perfil asociado (por el trigger `on_auth_user_deleted`).

---

## ✅ Verificar Usuarios Creados

### Ver todos los usuarios

```sql
SELECT 
  p.id,
  p.nombre,
  p.rol,
  p.intentos_fallidos,
  p.bloqueado_hasta,
  u.email,
  u.created_at
FROM perfiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.nombre;
```

### Ver usuarios por rol

```sql
-- Usuarios Completos
SELECT nombre, email FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE rol = 'Usuario_Completo';

-- Dueños
SELECT nombre, email FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE rol = 'Dueño';

-- Usuarios de Ingresos
SELECT nombre, email FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE rol = 'Usuario_Ingresos';

-- Usuarios de Egresos
SELECT nombre, email FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE rol = 'Usuario_Egresos';
```

---

## 🔓 Desbloquear Usuario

Si un usuario se bloquea por intentos fallidos:

```sql
UPDATE perfiles
SET 
  intentos_fallidos = 0,
  bloqueado_hasta = NULL
WHERE id = 'USER_ID_AQUI';
```

---

## 📊 Estadísticas de Usuarios

```sql
-- Contar usuarios por rol
SELECT 
  rol,
  COUNT(*) as cantidad
FROM perfiles
GROUP BY rol
ORDER BY cantidad DESC;

-- Ver usuarios bloqueados
SELECT 
  p.nombre,
  u.email,
  p.intentos_fallidos,
  p.bloqueado_hasta
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.bloqueado_hasta > NOW();
```

---

## 🎯 Recomendaciones

### Para Empezar

Crea al menos:
1. **1 Usuario Completo** - Para operaciones diarias
2. **1 Dueño** - Para supervisión y reportes

### Para Producción

Considera crear:
- 2-3 Usuarios Completos (turnos diferentes)
- 1-2 Dueños (supervisor y backup)
- Usuarios específicos de Ingresos/Egresos según necesidad

### Seguridad

- ✅ Usa contraseñas fuertes (mínimo 8 caracteres)
- ✅ No compartas contraseñas entre usuarios
- ✅ Cambia contraseñas periódicamente
- ✅ Desactiva usuarios que ya no trabajan en la empresa
- ✅ Monitorea intentos de login fallidos

---

## 🐛 Troubleshooting

### Error: "User already exists"

**Problema**: El email ya está registrado

**Solución**: Usa otro email o elimina el usuario existente primero

### Error: "Permission denied for table perfiles"

**Problema**: No tienes permisos para insertar en la tabla

**Solución**: Ejecuta el SQL desde el SQL Editor de Supabase Dashboard (no desde la app)

### Error: "Foreign key violation"

**Problema**: El User ID no existe en auth.users

**Solución**: Primero crea el usuario en Authentication, luego crea el perfil

### Usuario no puede hacer login

**Problema**: El usuario existe pero no puede entrar

**Solución**:
1. Verifica que el usuario esté confirmado en Auth
2. Verifica que exista un perfil con el mismo ID
3. Verifica que no esté bloqueado (`bloqueado_hasta`)
4. Verifica la contraseña

---

## 📞 Soporte

Si tienes problemas creando usuarios:
1. Verifica que hayas ejecutado todos los scripts SQL de configuración
2. Revisa los logs en Supabase Dashboard
3. Consulta `supabase/README.md` para más información

