# Configuración de Autenticación en Supabase

## Timeout de Sesión (8 horas de inactividad)

Para configurar el timeout de sesión a 8 horas de inactividad, debes ajustar la configuración de JWT en tu proyecto de Supabase:

### Opción 1: Desde el Dashboard de Supabase

1. Ve a tu proyecto en [https://app.supabase.com](https://app.supabase.com)
2. Navega a **Authentication** → **Settings**
3. En la sección **JWT Settings**, configura:
   - **JWT expiry limit**: `28800` (8 horas en segundos)
   - **Refresh token expiry**: `28800` (8 horas en segundos)
4. Guarda los cambios

### Opción 2: Mediante configuración local (supabase/config.toml)

Si estás usando Supabase CLI localmente, agrega esta configuración:

```toml
[auth]
# Tiempo de expiración del JWT en segundos (8 horas = 28800 segundos)
jwt_expiry = 28800

# Tiempo de expiración del refresh token en segundos (8 horas = 28800 segundos)
refresh_token_expiry = 28800

# Habilitar auto-refresh del token
enable_refresh_token_rotation = true
```

### Verificación

Para verificar que la configuración está funcionando:

1. Inicia sesión en la aplicación
2. Espera 8 horas sin actividad
3. Intenta realizar una acción que requiera autenticación
4. El sistema debería redirigirte al login automáticamente

### Notas Importantes

- El timeout de 8 horas se reinicia con cada actividad del usuario
- Si el usuario cierra el navegador, la sesión se mantiene activa hasta que expire
- El refresh token se renueva automáticamente mientras el usuario esté activo
- Después de 8 horas de inactividad, el usuario deberá iniciar sesión nuevamente

## Edge Function: notificar-bloqueo

### Configuración de Variables de Entorno

Para que la Edge Function `notificar-bloqueo` funcione correctamente, debes configurar la API key de Resend:

1. Crea una cuenta en [Resend](https://resend.com)
2. Obtén tu API key desde el dashboard
3. Configura la variable de entorno en Supabase:

```bash
# Usando Supabase CLI
supabase secrets set RESEND_API_KEY=tu_api_key_aqui
```

O desde el Dashboard:
1. Ve a **Settings** → **Edge Functions**
2. Agrega la variable `RESEND_API_KEY` con tu API key

### Despliegue de la Edge Function

```bash
# Desplegar la función
supabase functions deploy notificar-bloqueo

# Verificar que está funcionando
supabase functions list
```

### Prueba Manual

Puedes probar la función manualmente:

```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/notificar-bloqueo \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "emailDueno": "dueno@ejemplo.com",
    "usuarioBloqueado": "Juan Pérez",
    "emailBloqueado": "juan@ejemplo.com",
    "bloqueadoHasta": "2024-03-18T15:30:00Z"
  }'
```

## Configuración del Email en Resend

Para que los correos se envíen correctamente:

1. Verifica tu dominio en Resend
2. Configura los registros DNS (SPF, DKIM, DMARC)
3. Actualiza el campo `from` en la Edge Function con tu dominio verificado:
   ```typescript
   from: 'Cuadre Automático <notificaciones@tu-dominio.com>'
   ```

Si no tienes un dominio verificado, puedes usar el dominio de prueba de Resend:
```typescript
from: 'onboarding@resend.dev'
```

**Nota**: El dominio de prueba solo puede enviar correos a la dirección de email registrada en tu cuenta de Resend.
