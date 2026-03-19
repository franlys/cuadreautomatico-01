# Comandos Útiles - Cuadre Automático

## 🛠️ Desarrollo

### Iniciar Servidor de Desarrollo
```bash
npm run dev
```
El sistema estará disponible en `http://localhost:5173`

### Build para Producción
```bash
npm run build
```
Los archivos compilados estarán en `dist/`

### Preview del Build
```bash
npm run preview
```
Previsualiza el build de producción localmente

### Linting
```bash
npm run lint
```
Verifica errores de código con ESLint

## 🗄️ Base de Datos

### Ejecutar Script Completo de Inicialización
```sql
-- En Supabase SQL Editor, ejecutar:
-- Contenido de supabase/init.sql
```

### Verificar Tablas Creadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver Estructura de una Tabla
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registros';
```

### Verificar Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

## 👥 Gestión de Usuarios

### Crear Usuario Manualmente (SQL)
```sql
-- Primero crear usuario en Supabase Auth UI
-- Luego insertar perfil:
INSERT INTO perfiles (id, nombre, rol, email)
VALUES (
  'uuid-del-usuario-de-auth',
  'Nombre del Usuario',
  'Dueño', -- o 'Usuario_Ingresos' o 'Usuario_Egresos'
  'email@ejemplo.com'
);
```

### Ver Todos los Perfiles
```sql
SELECT id, nombre, rol, email, intentos_fallidos, bloqueado_hasta
FROM perfiles
ORDER BY created_at DESC;
```

### Desbloquear Usuario
```sql
UPDATE perfiles
SET intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'usuario@ejemplo.com';
```

### Cambiar Rol de Usuario
```sql
UPDATE perfiles
SET rol = 'Dueño'
WHERE email = 'usuario@ejemplo.com';
```

## 📊 Consultas Útiles

### Ver Resumen de Semana Actual
```sql
SELECT 
  sl.fecha_inicio,
  sl.fecha_fin,
  sl.total_ingresos,
  sl.total_egresos,
  sl.balance_neto,
  sl.total_depositos,
  sl.saldo_disponible
FROM semanas_laborales sl
ORDER BY fecha_inicio DESC
LIMIT 1;
```

### Ver Folders de una Semana
```sql
SELECT 
  fd.fecha_laboral,
  fd.total_ingresos,
  fd.total_egresos,
  fd.balance_diario,
  fd.cerrado
FROM folders_diarios fd
WHERE semana_laboral_id = 'uuid-de-la-semana'
ORDER BY fecha_laboral;
```

### Ver Registros de un Día
```sql
SELECT 
  r.tipo,
  r.concepto,
  r.empleado,
  r.ruta,
  r.monto,
  r.created_at
FROM registros r
JOIN folders_diarios fd ON r.folder_diario_id = fd.id
WHERE fd.fecha_laboral = '2024-03-18'
ORDER BY r.created_at;
```

### Ver Depósitos de una Semana
```sql
SELECT 
  d.fecha_deposito,
  d.monto,
  d.banco,
  d.nota
FROM depositos d
WHERE semana_laboral_id = 'uuid-de-la-semana'
ORDER BY fecha_deposito;
```

### Ver Evidencias de un Registro
```sql
SELECT 
  e.nombre_archivo,
  e.tipo_mime,
  e.tamano_bytes,
  e.storage_path
FROM evidencias e
WHERE registro_id = 'uuid-del-registro';
```

### Estadísticas Generales
```sql
SELECT 
  COUNT(*) as total_registros,
  SUM(CASE WHEN tipo = 'ingreso' THEN 1 ELSE 0 END) as total_ingresos,
  SUM(CASE WHEN tipo = 'egreso' THEN 1 ELSE 0 END) as total_egresos,
  SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as suma_ingresos,
  SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) as suma_egresos
FROM registros;
```

## 🧹 Mantenimiento

### Limpiar Datos de Prueba

```sql
-- ⚠️ CUIDADO: Esto eliminará TODOS los datos

-- Eliminar registros
DELETE FROM registros;

-- Eliminar folders
DELETE FROM folders_diarios;

-- Eliminar semanas
DELETE FROM semanas_laborales;

-- Eliminar depósitos
DELETE FROM depositos;

-- Eliminar evidencias
DELETE FROM evidencias;

-- Limpiar catálogos
DELETE FROM empleados;
DELETE FROM rutas;
DELETE FROM conceptos;
```

### Resetear Intentos Fallidos de Todos los Usuarios
```sql
UPDATE perfiles
SET intentos_fallidos = 0,
    bloqueado_hasta = NULL;
```

### Ver Tamaño de las Tablas
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Verificar Integridad de Balances
```sql
-- Verificar que los balances diarios coincidan
SELECT 
  fd.id,
  fd.fecha_laboral,
  fd.total_ingresos,
  fd.total_egresos,
  fd.balance_diario,
  (fd.total_ingresos - fd.total_egresos) as balance_calculado,
  CASE 
    WHEN fd.balance_diario = (fd.total_ingresos - fd.total_egresos) 
    THEN 'OK' 
    ELSE 'ERROR' 
  END as estado
FROM folders_diarios fd;
```

## 📦 Storage

### Ver Archivos en Storage
```sql
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'evidencias'
ORDER BY created_at DESC
LIMIT 10;
```

### Limpiar Archivos Huérfanos
```sql
-- Ver archivos sin registro asociado
SELECT so.name
FROM storage.objects so
WHERE so.bucket_id = 'evidencias'
AND NOT EXISTS (
  SELECT 1 FROM evidencias e
  WHERE e.storage_path = so.name
);

-- Eliminar (ejecutar con cuidado)
DELETE FROM storage.objects
WHERE bucket_id = 'evidencias'
AND NOT EXISTS (
  SELECT 1 FROM evidencias e
  WHERE e.storage_path = name
);
```

## 🔍 Debugging

### Ver Logs de Triggers
```sql
-- Habilitar logging de triggers (solo en desarrollo)
SET client_min_messages TO DEBUG;

-- Insertar un registro para ver los triggers en acción
INSERT INTO registros (folder_diario_id, tipo, concepto, empleado, ruta, monto)
VALUES ('uuid-del-folder', 'ingreso', 'Test', 'Test', 'Test', 100.00);
```

### Ver Conexiones Activas
```sql
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = current_database();
```

### Ver Queries Lentas
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🚀 Despliegue

### Build Optimizado
```bash
npm run build
```

### Variables de Entorno para Producción
```bash
# .env.production
VITE_SUPABASE_URL=tu_url_de_produccion
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_produccion
```

### Desplegar en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

### Desplegar en Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Desplegar
netlify deploy

# Desplegar a producción
netlify deploy --prod
```

## 📱 PWA (Futuro)

### Generar Service Worker
```bash
# Cuando se implemente PWA
npm run build
# El service worker se generará automáticamente con Workbox
```

### Probar PWA Localmente
```bash
npm run build
npm run preview
# Abrir en Chrome y usar DevTools > Application > Service Workers
```

## 🔐 Seguridad

### Rotar Claves de Supabase
1. Ve a Supabase Dashboard > Settings > API
2. Genera nuevas claves
3. Actualiza `.env` con las nuevas claves
4. Redespliega la aplicación

### Backup de Base de Datos
```bash
# Desde Supabase Dashboard
# Settings > Database > Backups
# O usar pg_dump si tienes acceso directo
```

### Restaurar Backup
```bash
# Desde Supabase Dashboard
# Settings > Database > Backups > Restore
```

## 📈 Monitoreo

### Ver Uso de API
```sql
-- En Supabase Dashboard
-- Settings > Usage
```

### Ver Logs de Errores
```sql
-- En Supabase Dashboard
-- Logs > Error Logs
```

### Métricas de Performance
```sql
-- Ver queries más ejecutadas
SELECT 
  query,
  calls,
  total_time / calls as avg_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

---

**Tip**: Guarda estos comandos en un lugar accesible para referencia rápida durante el desarrollo y mantenimiento del sistema.
