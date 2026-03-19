# Configuración de Notificaciones

## Descripción

Este documento describe cómo configurar las notificaciones por correo electrónico y WhatsApp para el sistema Cuadre Automático.

## Variables de Entorno

### Para Edge Function `notificador`

Las siguientes variables deben configurarse en Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Resend (Correo Electrónico)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Para Frontend (Opcional)

Si deseas configurar los destinatarios desde el frontend, puedes agregar estas variables en `.env`:

```bash
# Destinatarios por defecto
VITE_DUENO_EMAIL=dueno@empresa.com
VITE_DUENO_WHATSAPP=+521234567890
```

## Configuración de Servicios

### 1. Resend (Correo Electrónico)

#### Crear Cuenta
1. Ir a https://resend.com
2. Crear cuenta gratuita o de pago
3. Verificar correo electrónico

#### Verificar Dominio (Recomendado para Producción)
1. En Resend Dashboard → Domains → Add Domain
2. Agregar tu dominio (ej: `empresa.com`)
3. Configurar registros DNS según las instrucciones:
   - SPF record
   - DKIM record
   - DMARC record (opcional)
4. Esperar verificación (puede tomar hasta 48 horas)

#### Usar Dominio de Prueba (Para Testing)
- Resend proporciona un dominio de prueba: `onboarding.resend.dev`
- Solo puedes enviar a tu propio correo verificado
- Límite: 100 correos/día

#### Generar API Key
1. En Resend Dashboard → API Keys → Create API Key
2. Nombre: "Cuadre Automático - Producción"
3. Permisos: "Sending access"
4. Copiar el API Key (solo se muestra una vez)
5. Guardar en Supabase Secrets

#### Configurar Remitente
En el código de la Edge Function (`supabase/functions/notificador/index.ts`), actualizar:

```typescript
from: 'Cuadre Automático <noreply@tudominio.com>',
```

Cambiar `tudominio.com` por tu dominio verificado.

#### Límites del Plan Gratuito
- 100 correos/día
- 3,000 correos/mes
- Sin soporte prioritario

#### Planes de Pago
- **Pro**: $20/mes por 50,000 correos
- **Enterprise**: Personalizado

### 2. Twilio (WhatsApp)

#### Crear Cuenta
1. Ir a https://www.twilio.com
2. Crear cuenta (requiere verificación de teléfono)
3. Completar verificación de identidad

#### Activar WhatsApp
1. En Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Seguir instrucciones para conectar tu número de WhatsApp
3. Enviar mensaje de prueba al sandbox

#### Sandbox (Para Testing)
- Twilio proporciona un número de sandbox: `+1 415 523 8886`
- Los destinatarios deben enviar un código de activación primero
- Ejemplo: Enviar "join [código]" al número de sandbox
- Límite: Solo números registrados en el sandbox

#### Producción (WhatsApp Business API)
1. Solicitar acceso a WhatsApp Business API
2. Completar proceso de aprobación de Meta
3. Configurar plantillas de mensajes (templates)
4. Obtener número de WhatsApp Business

**Nota**: El proceso de aprobación puede tomar varios días o semanas.

#### Obtener Credenciales
1. En Twilio Console → Account → Account Info
2. Copiar:
   - Account SID
   - Auth Token
3. Para el número de WhatsApp:
   - Sandbox: `whatsapp:+14155238886`
   - Producción: `whatsapp:+[tu número]`

#### Límites del Plan Gratuito
- $15 USD de crédito inicial
- Solo sandbox (no producción)
- Mensajes limitados

#### Planes de Pago
- **Pay as you go**: ~$0.005 por mensaje (varía por país)
- **WhatsApp Business API**: Requiere aprobación de Meta

### 3. Configurar en Supabase

#### Método 1: Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-proyecto-ref

# Configurar secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

#### Método 2: Supabase Dashboard

1. Ir a Supabase Dashboard
2. Seleccionar tu proyecto
3. Settings → Edge Functions → Secrets
4. Agregar cada secret manualmente

## Testing

### 1. Testing Local

```bash
# Iniciar función localmente
supabase functions serve notificador

# Hacer request de prueba
curl -X POST http://localhost:54321/functions/v1/notificador \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "semana_id": "uuid-de-prueba",
    "destinatario_email": "test@example.com",
    "destinatario_whatsapp": "+521234567890"
  }'
```

### 2. Testing en Producción

Desde el frontend, usar el botón "Enviar Reporte" en la página de Resumen Semanal.

### 3. Verificar Logs

```bash
# Ver logs de la función
supabase functions logs notificador
```

O en Supabase Dashboard → Edge Functions → notificador → Logs

## Troubleshooting

### Correo no llega

1. **Verificar spam/junk folder**
2. **Verificar dominio**: Asegurarse de que el dominio esté verificado en Resend
3. **Revisar logs**: Ver logs de Resend Dashboard para errores
4. **Verificar API Key**: Asegurarse de que el API Key sea válido
5. **Verificar límites**: Verificar que no hayas excedido el límite diario/mensual

### WhatsApp no llega

1. **Verificar formato del número**: Debe ser `+[código país][número]` sin espacios
2. **Verificar sandbox**: Si usas sandbox, el destinatario debe estar registrado
3. **Verificar credenciales**: Account SID y Auth Token deben ser correctos
4. **Revisar logs**: Ver logs de Twilio Console para errores
5. **Verificar saldo**: Asegurarse de tener crédito suficiente en Twilio

### Error: "RESEND_API_KEY not found"

- Verificar que el secret esté configurado en Supabase
- Verificar que el nombre del secret sea exacto (case-sensitive)
- Redesplegar la función después de configurar secrets

### Error: "Invalid API key"

- Regenerar API key en Resend Dashboard
- Actualizar secret en Supabase
- Redesplegar la función

### Error: "Twilio authentication failed"

- Verificar Account SID y Auth Token
- Asegurarse de que la cuenta de Twilio esté activa
- Verificar que no haya espacios extra en las credenciales

## Costos Estimados

### Escenario: 50 empleados, 1 reporte semanal

#### Resend (Correo)
- 50 correos/semana = 200 correos/mes
- **Costo**: Gratis (dentro del plan gratuito)

#### Twilio (WhatsApp)
- 50 mensajes/semana = 200 mensajes/mes
- **Costo**: ~$1 USD/mes (varía por país)

### Escenario: 200 empleados, 1 reporte semanal

#### Resend (Correo)
- 200 correos/semana = 800 correos/mes
- **Costo**: Gratis (dentro del plan gratuito)

#### Twilio (WhatsApp)
- 200 mensajes/semana = 800 mensajes/mes
- **Costo**: ~$4 USD/mes (varía por país)

## Recomendaciones

### Para Testing
- Usar dominio de prueba de Resend
- Usar sandbox de Twilio
- Configurar solo tu correo y número como destinatarios

### Para Producción
- Verificar dominio propio en Resend
- Solicitar WhatsApp Business API de Twilio
- Configurar plantillas de mensajes
- Monitorear logs regularmente
- Configurar alertas de errores

### Seguridad
- Nunca compartir API Keys o Auth Tokens
- Rotar credenciales periódicamente
- Usar variables de entorno, nunca hardcodear
- Limitar permisos de API Keys al mínimo necesario

## Soporte

### Resend
- Documentación: https://resend.com/docs
- Soporte: support@resend.com
- Status: https://status.resend.com

### Twilio
- Documentación: https://www.twilio.com/docs
- Soporte: https://support.twilio.com
- Status: https://status.twilio.com

### Supabase
- Documentación: https://supabase.com/docs
- Soporte: https://supabase.com/support
- Status: https://status.supabase.com

