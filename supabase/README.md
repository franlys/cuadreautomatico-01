# Configuración de Base de Datos - Supabase

Este directorio contiene todos los scripts SQL necesarios para configurar la base de datos en Supabase.

## Orden de Ejecución

Ejecutar los scripts en el siguiente orden desde el SQL Editor de Supabase:

1. **schema.sql** - Crea todas las tablas, constraints e índices
2. **triggers.sql** - Implementa los triggers para cálculo automático de balances
3. **rls.sql** - Configura las políticas de Row Level Security

## Pasos de Configuración

### 1. Crear Proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Guardar las credenciales:
   - Project URL
   - Anon/Public Key

### 2. Ejecutar Scripts SQL

1. Abrir el SQL Editor en Supabase Dashboard
2. Copiar y ejecutar el contenido de `schema.sql`
3. Copiar y ejecutar el contenido de `triggers.sql`
4. Copiar y ejecutar el contenido de `rls.sql`

### 3. Configurar Storage

1. Ir a Storage en Supabase Dashboard
2. Crear un bucket llamado `evidencias`
3. Configurar políticas de acceso:
   - Los usuarios autenticados pueden subir archivos
   - Los usuarios pueden ver sus propios archivos
   - El Dueño puede ver todos los archivos

### 4. Configurar Variables de Entorno

Copiar las credenciales al archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Estructura de la Base de Datos

### Tablas Principales

- **perfiles** - Perfiles de usuario con roles
- **empleados** - Catálogo de empleados
- **rutas** - Catálogo de rutas/zonas
- **conceptos** - Catálogo de conceptos de ingresos/egresos
- **semanas_laborales** - Semanas laborales con balances consolidados
- **folders_diarios** - Folders diarios con registros
- **registros** - Registros individuales de ingresos/egresos
- **depositos** - Depósitos bancarios
- **evidencias** - Archivos adjuntos

### Triggers Automáticos

- **trg_recalcular_folder** - Recalcula totales del folder cuando se modifica un registro
- **trg_recalcular_semana_desde_folder** - Recalcula totales de la semana cuando se actualiza un folder
- **trg_recalcular_saldo_deposito** - Recalcula saldo disponible cuando se modifica un depósito

### Columnas Generadas

- **balance_diario** = total_ingresos - total_egresos
- **balance_neto** = total_ingresos - total_egresos
- **saldo_disponible** = balance_neto - total_depositos

## Roles y Permisos

### Usuario_Ingresos
- Ver y crear registros de tipo "ingreso"
- Ver y crear depósitos
- Agregar empleados, rutas y conceptos a los catálogos

### Usuario_Egresos
- Ver y crear registros de tipo "egreso"
- Agregar empleados, rutas y conceptos a los catálogos

### Dueño
- Ver todos los registros (ingresos y egresos)
- Ver y crear depósitos
- Cerrar folders diarios
- Editar y eliminar entradas de catálogos
- Acceso completo al dashboard

## Verificación

Para verificar que todo está configurado correctamente:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar que los triggers existen
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Datos de Prueba (Opcional)

Para insertar datos de prueba, ejecutar `seed.sql` (crear este archivo según sea necesario).


## Configuración de Storage

El sistema utiliza Supabase Storage para almacenar evidencias (fotos y PDFs).

### Bucket de Evidencias

El script `init.sql` crea automáticamente el bucket `evidencias` con las siguientes características:

- **Nombre**: evidencias
- **Público**: No (requiere autenticación)
- **Políticas de acceso**:
  - Usuarios autenticados pueden subir evidencias
  - Usuarios pueden ver evidencias según su rol:
    - Dueño: puede ver todas las evidencias
    - Usuario_Ingresos: solo evidencias de ingresos
    - Usuario_Egresos: solo evidencias de egresos
  - Solo el Dueño puede eliminar evidencias

### Validaciones del Cliente

El componente `UploaderEvidencia` implementa las siguientes validaciones:

- **Tipos permitidos**: JPG, PNG, PDF
- **Tamaño máximo**: 10 MB por archivo
- **Límite por registro**: 5 evidencias
- **Previsualización**: Miniaturas para imágenes, ícono para PDFs
- **Captura directa**: Soporte para cámara del dispositivo

### Estructura de Almacenamiento

Los archivos se organizan por registro:

```
evidencias/
  ├── {registro_id}/
  │   ├── {timestamp}-{random}.jpg
  │   ├── {timestamp}-{random}.png
  │   └── {timestamp}-{random}.pdf
```

### URLs Firmadas

Las evidencias se acceden mediante URLs firmadas con expiración de 1 hora para mayor seguridad.


## Edge Functions

El sistema utiliza Edge Functions de Supabase (Deno) para funcionalidades del lado del servidor.

### notificar-bloqueo

Edge Function que envía notificación por correo al Dueño cuando un usuario es bloqueado por intentos fallidos de login.

**Ubicación**: `supabase/functions/notificar-bloqueo/index.ts`

**Trigger**: Llamado desde el frontend cuando se detecta el tercer intento fallido

**Variables de entorno requeridas**:
- `RESEND_API_KEY`: API key de Resend para envío de correos
- `DUENO_EMAIL`: Correo del Dueño para recibir notificaciones

Ver `supabase/auth-config.md` para más detalles sobre configuración de autenticación.

### notificador

Edge Function que envía reportes semanales por correo electrónico (Resend) y WhatsApp (Twilio).

**Ubicación**: `supabase/functions/notificador/index.ts`

**Características**:
- Envío de correo con HTML y texto plano
- Adjuntos PDF y XLSX
- Lógica de reintento (3 intentos, 5 minutos entre intentos)
- Envío de WhatsApp con resumen
- Manejo de errores y fallback

**Variables de entorno requeridas**:
- `RESEND_API_KEY`: API key de Resend
- `TWILIO_ACCOUNT_SID`: Account SID de Twilio
- `TWILIO_AUTH_TOKEN`: Auth Token de Twilio
- `TWILIO_WHATSAPP_FROM`: Número de WhatsApp (formato: `whatsapp:+14155238886`)
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase

Ver `supabase/functions/notificador/README.md` para documentación completa.

### Despliegue de Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-proyecto-ref

# Deploy de funciones
supabase functions deploy notificar-bloqueo
supabase functions deploy notificador

# Configurar secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set DUENO_EMAIL=dueno@empresa.com
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```
