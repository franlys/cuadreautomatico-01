# Pasos de Configuración Inicial

## ✅ Completado
- [x] Base de datos configurada (schema.sql, triggers.sql, rls.sql ejecutados)
- [x] Bucket de storage `evidencias` creado
- [x] Políticas de storage configuradas
- [x] Archivo `.env` configurado
- [x] Dependencias instaladas y servidor de desarrollo corriendo en http://localhost:5174/

## 📋 Pasos Siguientes

### 1. Crear Usuario de Prueba en Supabase

1. Ve a tu proyecto de Supabase: https://emifgmstkhkpgrshlsnt.supabase.co
2. En el menú lateral, ve a **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Ingresa:
   - **Email**: tu-email@ejemplo.com (usa un email real si quieres recibir notificaciones)
   - **Password**: una contraseña segura (mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ Activado (para no tener que confirmar por email)
5. Haz clic en **Create user**
6. **IMPORTANTE**: Copia el **User UID** que aparece en la lista de usuarios (lo necesitarás en el siguiente paso)

### 2. Insertar Perfil del Usuario

1. En Supabase, ve a **SQL Editor**
2. Crea una nueva query y ejecuta el siguiente SQL (reemplaza los valores):

```sql
-- Reemplaza 'USER_UID_AQUI' con el UID del usuario que creaste
-- Reemplaza 'Tu Nombre' con el nombre que quieras
-- rol puede ser: 'Dueño' o 'Usuario_Ingresos'

INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'USER_UID_AQUI',
  'Tu Nombre',
  'Dueño'
);
```

**Ejemplo**:
```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Juan Pérez',
  'Dueño'
);
```

3. Ejecuta la query (botón **Run** o `Ctrl+Enter`)

### 3. Probar el Login

1. Abre tu navegador en http://localhost:5174/
2. Deberías ver la pantalla de login
3. Ingresa el email y contraseña del usuario que creaste
4. Haz clic en **Iniciar Sesión**
5. Si todo está correcto, deberías ver el dashboard correspondiente a tu rol

### 4. Crear Datos de Catálogo Iniciales

Una vez que hayas iniciado sesión, necesitas crear algunos datos de catálogo para poder registrar ingresos/egresos:

#### Opción A: Desde la Interfaz (Recomendado)
1. Ve a la página **Catálogos** en el menú
2. Crea algunos empleados de ejemplo:
   - Nombre: "Juan Pérez"
   - Nombre: "María García"
3. Crea algunas rutas de ejemplo:
   - Nombre: "Ruta Centro"
   - Nombre: "Ruta Norte"
4. Crea algunos conceptos de ejemplo:
   - Nombre: "Envío Nacional"
   - Nombre: "Envío Internacional"
   - Nombre: "Paquetería Express"

#### Opción B: Desde SQL Editor
```sql
-- Insertar empleados de ejemplo
INSERT INTO empleados (nombre) VALUES
  ('Juan Pérez'),
  ('María García'),
  ('Carlos López');

-- Insertar rutas de ejemplo
INSERT INTO rutas (nombre) VALUES
  ('Ruta Centro'),
  ('Ruta Norte'),
  ('Ruta Sur');

-- Insertar conceptos de ejemplo
INSERT INTO conceptos (nombre) VALUES
  ('Envío Nacional'),
  ('Envío Internacional'),
  ('Paquetería Express'),
  ('Sobrepeso'),
  ('Seguro');
```

### 5. Probar Funcionalidad Básica

1. **Crear un Folder Diario**:
   - Ve a la página principal
   - Haz clic en **Crear Folder Diario**
   - Verifica que se cree correctamente

2. **Registrar un Ingreso**:
   - Selecciona un empleado del catálogo
   - Selecciona una ruta del catálogo
   - Selecciona un concepto del catálogo (o escribe uno manual)
   - Ingresa un monto
   - Opcionalmente sube una evidencia (foto/PDF)
   - Haz clic en **Guardar**

3. **Verificar el Registro**:
   - El registro debería aparecer en la lista
   - El balance neto debería actualizarse automáticamente

4. **Probar Exportación**:
   - Haz clic en **Exportar PDF** o **Exportar Excel**
   - Verifica que se descargue el archivo correctamente

### 6. Configurar Notificaciones (Opcional)

Si quieres probar las notificaciones por email y WhatsApp:

1. Lee el archivo `supabase/notificaciones-config.md` para instrucciones detalladas
2. Configura las variables de entorno en Supabase Edge Functions
3. Despliega la función `notificador`

## 🔧 Solución de Problemas

### Error de Login
- Verifica que el usuario esté en la tabla `auth.users`
- Verifica que el perfil esté en la tabla `perfiles` con el mismo `id`
- Verifica que las credenciales en `.env` sean correctas

### Error al Crear Folder
- Verifica que los triggers estén instalados correctamente
- Revisa la consola del navegador (F12) para ver errores específicos

### Error al Subir Evidencias
- Verifica que el bucket `evidencias` exista
- Verifica que las políticas de storage estén configuradas
- Verifica que el usuario esté autenticado

### Error de CORS
- Verifica que la URL de Supabase en `.env` sea correcta
- Verifica que no haya espacios o caracteres extra en las variables

## 📚 Documentación Adicional

- `GUIA_INICIO_RAPIDO.md` - Guía rápida de uso del sistema
- `GUIA_MODO_OFFLINE.md` - Cómo funciona el modo offline
- `supabase/README.md` - Documentación de la base de datos
- `supabase/notificaciones-config.md` - Configuración de notificaciones
- `COMANDOS_UTILES.md` - Comandos útiles para desarrollo

## ✨ Próximos Pasos

Una vez que hayas probado la funcionalidad básica:

1. Configura las notificaciones (Resend + Twilio)
2. Prueba el modo offline (desconecta internet y sigue trabajando)
3. Prueba la sincronización (reconecta y verifica que los datos se suban)
4. Configura PWA cuando `vite-plugin-pwa` soporte Vite 8
5. Despliega a producción (Vercel, Netlify, o similar)

Lee `PROXIMOS_PASOS.md` para más detalles sobre el despliegue y configuración avanzada.
