# Solución Error 429: Rate Limit Exceeded

## Problema
```
Error: email rate limit exceeded
Status: 429 (Too Many Requests)
```

## Causa
Supabase Auth tiene límites de creación de usuarios:
- **Desarrollo**: 4 usuarios por hora por IP
- **Producción**: Depende del plan

## Soluciones

### Solución 1: Esperar (Más Simple)
Espera 15-30 minutos antes de intentar crear más usuarios.

### Solución 2: Deshabilitar Confirmación de Email (Recomendado)
Ya lo tienes deshabilitado según el contexto, pero verifica:

1. Ve a tu proyecto Supabase: https://emifgmstkhkpgrshlsnt.supabase.co
2. Settings → Authentication
3. Busca "Enable email confirmations"
4. Asegúrate que esté **DESHABILITADO** (OFF)

### Solución 3: Crear Usuarios Directamente en la Base de Datos (TEMPORAL)
Para desarrollo, puedes crear usuarios directamente sin pasar por Auth:

```sql
-- Crear usuario directamente en auth.users (SOLO PARA DESARROLLO)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'nuevo@ejemplo.com',
  crypt('password123', gen_salt('bf')), -- Requiere extensión pgcrypto
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Nombre Usuario"}',
  false,
  'authenticated'
) RETURNING id;

-- Luego crear el perfil con el ID retornado
INSERT INTO perfiles (id, nombre, rol, empresa_id)
VALUES (
  '[ID_RETORNADO_ARRIBA]',
  'Nombre Usuario',
  'Usuario_Completo',
  '4bacc04d-8d1a-4bea-a9d5-c320869e9581' -- ID de Empresa 1
);
```

### Solución 4: Aumentar Límite (Producción)
Para producción, contacta a Supabase Support para aumentar el límite.

## Verificar Estado Actual

Ejecuta este SQL para ver usuarios creados recientemente:

```sql
-- Ver usuarios creados en la última hora
SELECT 
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## Recomendación Inmediata

1. **Ejecuta** `supabase/permisos-super-admin-directo.sql` para asegurar permisos
2. **Espera 30 minutos** antes de crear más usuarios
3. **Verifica** que email confirmations esté deshabilitado en Supabase Dashboard
4. **Intenta crear** un solo usuario para probar

## Estado Actual de tu Sistema

✅ RLS deshabilitado en perfiles
✅ Permisos otorgados a authenticated
✅ Super Admin configurado correctamente
❌ Rate limit alcanzado (temporal, se resuelve esperando)

## Próximos Pasos

1. Ejecuta `permisos-super-admin-directo.sql` en Supabase SQL Editor
2. Espera 30 minutos
3. Intenta crear UN usuario
4. Si funciona, espera 15 minutos entre cada usuario adicional
