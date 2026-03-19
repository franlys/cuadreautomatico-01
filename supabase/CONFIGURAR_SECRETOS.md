# Configurar Secretos en Supabase Edge Functions

Para que el envío de reportes por correo funcione, necesitas configurar los secretos en Supabase.

## Paso 1: Obtener tu API Key de Resend

1. Ve a [Resend Dashboard](https://resend.com/api-keys)
2. Crea una nueva API Key o copia una existente
3. Guarda la API Key (empieza con `re_`)

## Paso 2: Configurar Secretos en Supabase

### Opción A: Usando Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login a Supabase
supabase login

# Vincular tu proyecto
supabase link --project-ref emifgmstkhkpgrshlsnt

# Configurar secretos
supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
supabase secrets set DUENO_EMAIL=franlys@cuadre.com
```

### Opción B: Usando el Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt)
2. En el menú lateral, ve a **Edge Functions**
3. Haz clic en la pestaña **Secrets**
4. Agrega los siguientes secretos:
   - **Nombre**: `RESEND_API_KEY`
     **Valor**: Tu API Key de Resend (ej: `re_123abc...`)
   
   - **Nombre**: `DUENO_EMAIL`
     **Valor**: `franlys@cuadre.com`

## Paso 3: Desplegar las Edge Functions

Después de configurar los secretos, necesitas desplegar las funciones:

```bash
# Desplegar todas las funciones
supabase functions deploy notificador
```

## Paso 4: Verificar Configuración

Para verificar que los secretos están configurados correctamente:

```bash
# Listar secretos (no muestra los valores)
supabase secrets list
```

Deberías ver:
```
RESEND_API_KEY
DUENO_EMAIL
```

## Paso 5: Probar el Envío

1. Ve a tu aplicación desplegada en Vercel
2. Inicia sesión como Dueño
3. Ve al Dashboard del Dueño
4. Haz clic en "Enviar Reporte al Dueño"
5. Verifica que recibas el correo con los archivos PDF y XLSX adjuntos

## Notas Importantes

- Los secretos son variables de entorno que solo están disponibles en las Edge Functions
- No se pueden leer desde el frontend
- Si cambias un secreto, necesitas redesplegar las funciones para que tome efecto
- Los secretos son específicos del proyecto de Supabase

## Solución de Problemas

### Error: "RESEND_API_KEY is not defined"
- Verifica que el secreto esté configurado correctamente
- Redesplega la función después de configurar el secreto

### Error: "Failed to send email"
- Verifica que tu API Key de Resend sea válida
- Verifica que el dominio de correo esté verificado en Resend
- Revisa los logs de la Edge Function en Supabase Dashboard

### Ver Logs de Edge Functions

1. Ve a **Edge Functions** en Supabase Dashboard
2. Selecciona la función `notificador`
3. Ve a la pestaña **Logs**
4. Aquí verás todos los errores y mensajes de la función
