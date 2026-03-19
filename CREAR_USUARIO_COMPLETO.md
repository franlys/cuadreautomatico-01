# 🚀 Guía Rápida: Crear Usuario Completo

Esta guía te ayudará a crear un usuario con rol `Usuario_Completo` que tiene permisos completos para todas las operaciones.

---

## 📋 ¿Qué es un Usuario Completo?

El **Usuario_Completo** es el rol principal para operaciones diarias. Puede:

✅ Crear, editar y eliminar **ingresos**  
✅ Crear, editar y eliminar **egresos**  
✅ Crear, editar y eliminar **depósitos**  
✅ Gestionar **catálogos** (empleados, rutas, conceptos)  
✅ **Cerrar folders diarios**  
✅ Ver todos los registros y reportes  
✅ Exportar PDF y XLSX  

❌ No puede acceder al Dashboard del Dueño  
❌ No puede enviar reportes por correo  

---

## 🎯 Pasos para Crear Usuario Completo

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt
3. Inicia sesión si es necesario

### Paso 2: Crear Usuario en Authentication

1. En el menú lateral, haz clic en **Authentication**
2. Haz clic en **Users**
3. Haz clic en el botón **Add user** (esquina superior derecha)
4. Selecciona **Create new user**

### Paso 3: Completar Formulario

Completa los siguientes campos:

- **Email**: `operador@cuadre.com` (o el email que prefieras)
- **Password**: Genera una contraseña segura (mínimo 8 caracteres)
- **Auto Confirm User**: ✅ **IMPORTANTE: Activa esta opción**

Haz clic en **Create user**

### Paso 4: Copiar User ID

Después de crear el usuario:

1. Verás una lista de usuarios
2. Busca el usuario que acabas de crear
3. Haz clic en el usuario para ver sus detalles
4. **Copia el User ID** (es un UUID como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Paso 5: Crear Perfil con SQL

1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega este código:

```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'PEGA_AQUI_EL_USER_ID',
  'Operador Principal',
  'Usuario_Completo'
);
```

4. **IMPORTANTE**: Reemplaza `PEGA_AQUI_EL_USER_ID` con el User ID que copiaste en el Paso 4
5. Haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 6: Verificar Creación

Ejecuta esta consulta para verificar:

```sql
SELECT 
  p.nombre,
  p.rol,
  u.email
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'Usuario_Completo';
```

Deberías ver tu usuario en los resultados.

---

## ✅ ¡Listo!

Tu usuario está creado y listo para usar. Ahora puedes:

1. Ir a tu aplicación: https://tu-app.vercel.app
2. Iniciar sesión con el email y contraseña que creaste
3. Empezar a usar todas las funcionalidades

---

## 📝 Ejemplo Completo

### Datos de Ejemplo

- **Email**: `operador@cuadre.com`
- **Password**: `MiPassword123!`
- **User ID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### SQL Completo

```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Operador Principal',
  'Usuario_Completo'
);
```

---

## 🔄 Crear Múltiples Usuarios

Si necesitas crear varios usuarios completos (por ejemplo, para diferentes turnos):

### Paso 1: Crear todos los usuarios en Authentication

Crea cada usuario siguiendo los pasos 1-4 anteriores:

- `operador1@cuadre.com` → Copia su User ID
- `operador2@cuadre.com` → Copia su User ID
- `operador3@cuadre.com` → Copia su User ID

### Paso 2: Crear todos los perfiles con un solo SQL

```sql
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('USER_ID_1', 'Operador Turno Mañana', 'Usuario_Completo'),
  ('USER_ID_2', 'Operador Turno Tarde', 'Usuario_Completo'),
  ('USER_ID_3', 'Operador Turno Noche', 'Usuario_Completo');
```

---

## 🔐 Cambiar Contraseña

Si necesitas cambiar la contraseña de un usuario:

1. Ve a **Authentication** → **Users**
2. Busca el usuario por email
3. Haz clic en el usuario
4. Haz clic en **Reset password**
5. Ingresa la nueva contraseña
6. Haz clic en **Update user**

---

## 🗑️ Eliminar Usuario

Si necesitas eliminar un usuario:

1. Ve a **Authentication** → **Users**
2. Busca el usuario por email
3. Haz clic en el usuario
4. Haz clic en **Delete user**
5. Confirma la eliminación

**Nota**: El perfil se eliminará automáticamente.

---

## 🐛 Problemas Comunes

### "User already exists"

**Problema**: El email ya está registrado

**Solución**: Usa otro email o elimina el usuario existente primero

### "Foreign key violation"

**Problema**: El User ID no existe

**Solución**: Verifica que copiaste el User ID correcto del paso 4

### Usuario no puede hacer login

**Problema**: El usuario no puede entrar a la aplicación

**Solución**:
1. Verifica que activaste "Auto Confirm User" al crear el usuario
2. Verifica que el perfil se creó correctamente (ejecuta la consulta de verificación)
3. Verifica que la contraseña sea correcta

---

## 📚 Más Información

Para más detalles sobre roles y permisos, consulta:

- `supabase/CREAR_USUARIOS.md` - Guía completa de creación de usuarios
- `supabase/crear-usuario-completo-ejemplo.sql` - Script SQL con ejemplos
- `supabase/README.md` - Documentación general de Supabase

---

## 🎉 ¡Éxito!

Ahora tienes un usuario completo listo para usar el sistema. Este usuario puede realizar todas las operaciones diarias sin restricciones.

**Recomendación**: Crea al menos 2 usuarios completos para tener un backup en caso de que uno se bloquee o tenga problemas.
