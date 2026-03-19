# Edge Function: Notificador

## Descripción

Edge Function para enviar reportes semanales por correo electrónico (Resend) y WhatsApp (Twilio).

## Características

- ✅ Envío de correo con HTML y texto plano
- ✅ Adjuntos PDF y XLSX
- ✅ Lógica de reintento (3 intentos, 5 minutos entre intentos)
- ✅ Envío de WhatsApp con resumen
- ✅ Manejo de errores y fallback
- ✅ Registro de errores en logs

## Variables de Entorno Requeridas

Configurar en Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtener Credenciales

#### Resend (Correo)
1. Crear cuenta en https://resend.com
2. Verificar dominio o usar dominio de prueba
3. Generar API Key en Dashboard → API Keys
4. Copiar el API Key

#### Twilio (WhatsApp)
1. Crear cuenta en https://www.twilio.com
2. Activar WhatsApp Business API
3. Obtener Account SID y Auth Token del Dashboard
4. Configurar número de WhatsApp (sandbox o producción)
5. El formato del número es: `whatsapp:+14155238886`

**Nota**: Para producción, necesitas aprobar tu cuenta de WhatsApp Business con Meta.

## Request Body

```typescript
{
  "semana_id": "uuid-de-la-semana",
  "destinatario_email": "dueno@empresa.com",
  "destinatario_whatsapp": "+521234567890",  // opcional
  "pdf_base64": "base64-encoded-pdf",        // opcional
  "xlsx_base64": "base64-encoded-xlsx",      // opcional
  "incluir_evidencias": false                // opcional
}
```

## Response

### Éxito
```json
{
  "success": true,
  "email": {
    "success": true,
    "message": "Correo enviado exitosamente"
  },
  "whatsapp": {
    "success": true,
    "message": "WhatsApp enviado exitosamente"
  }
}
```

### Error
```json
{
  "error": "Mensaje de error descriptivo"
}
```

## Lógica de Reintento

### Correo (Resend)
- **Intentos**: 3
- **Intervalo**: 5 minutos entre intentos
- **Comportamiento**: Si falla después de 3 intentos, retorna error pero no bloquea WhatsApp

### WhatsApp (Twilio)
- **Intentos**: 1 (sin reintento automático)
- **Fallback**: Si falla, se registra el error y se notifica al Dueño por correo

## Despliegue

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login en Supabase

```bash
supabase login
```

### 3. Link al proyecto

```bash
supabase link --project-ref tu-proyecto-ref
```

### 4. Deploy de la función

```bash
supabase functions deploy notificador
```

### 5. Configurar secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Testing Local

### 1. Iniciar función localmente

```bash
supabase functions serve notificador
```

### 2. Hacer request de prueba

```bash
curl -X POST http://localhost:54321/functions/v1/notificador \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "semana_id": "uuid-de-prueba",
    "destinatario_email": "test@example.com",
    "destinatario_whatsapp": "+521234567890"
  }'
```

## Uso desde el Frontend

```typescript
import { supabase } from './lib/supabase';

async function enviarReporte(semanaId: string, pdfBase64: string, xlsxBase64: string) {
  try {
    const { data, error } = await supabase.functions.invoke('notificador', {
      body: {
        semana_id: semanaId,
        destinatario_email: 'dueno@empresa.com',
        destinatario_whatsapp: '+521234567890',
        pdf_base64: pdfBase64,
        xlsx_base64: xlsxBase64,
        incluir_evidencias: false,
      },
    });

    if (error) throw error;

    if (data.success) {
      console.log('Reporte enviado exitosamente');
      if (!data.email.success) {
        console.error('Error en correo:', data.email.message);
      }
      if (!data.whatsapp.success) {
        console.error('Error en WhatsApp:', data.whatsapp.message);
      }
    }
  } catch (err) {
    console.error('Error al enviar reporte:', err);
  }
}
```

## Formato del Correo

### HTML
- Tabla con resumen consolidado
- Desglose diario con colores
- Sección de depósitos (si aplica)
- Archivos PDF y XLSX adjuntos

### Texto Plano
- Alternativa para clientes que no soportan HTML
- Mismo contenido en formato texto

## Formato de WhatsApp

Mensaje de texto con:
- Emoji para mejor visualización
- Resumen de totales
- Referencia al correo para detalles completos

## Troubleshooting

### Error: "RESEND_API_KEY not found"
- Verificar que el secret esté configurado en Supabase
- Verificar que el nombre del secret sea exacto

### Error: "Invalid API key"
- Verificar que el API key de Resend sea válido
- Regenerar API key si es necesario

### Error: "Twilio authentication failed"
- Verificar Account SID y Auth Token
- Verificar que la cuenta de Twilio esté activa

### Error: "WhatsApp number not verified"
- En sandbox, verificar que el número destinatario esté registrado
- En producción, verificar que el número esté aprobado por Meta

### Correo no llega
- Verificar spam/junk folder
- Verificar que el dominio esté verificado en Resend
- Revisar logs de Resend Dashboard

### WhatsApp no llega
- Verificar formato del número: `+[código país][número]`
- Verificar que el número tenga WhatsApp instalado
- Revisar logs de Twilio Console

## Logs

Ver logs de la función:

```bash
supabase functions logs notificador
```

O en Supabase Dashboard → Edge Functions → notificador → Logs

## Costos Estimados

### Resend
- **Free tier**: 100 correos/día, 3,000 correos/mes
- **Paid**: $20/mes por 50,000 correos

### Twilio WhatsApp
- **Sandbox**: Gratis para testing
- **Producción**: ~$0.005 por mensaje (varía por país)

## Seguridad

- ✅ Usa Service Role Key para acceso completo a datos
- ✅ Valida campos requeridos
- ✅ Maneja errores sin exponer información sensible
- ✅ Logs de errores para debugging

## Próximas Mejoras

- [ ] Soporte para múltiples destinatarios
- [ ] Plantillas personalizables
- [ ] Programación de envíos automáticos
- [ ] Historial de notificaciones enviadas
- [ ] Reenvío manual desde Dashboard
- [ ] Adjuntar evidencias en correo

