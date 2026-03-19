# Guía de Inicio Rápido - Cuadre Automático

## 🚀 Pasos para Poner en Marcha el Sistema

### 1. Configurar Supabase (5 minutos)

#### a) Crear Proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales (URL y anon key)

#### b) Ejecutar Script de Base de Datos
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido completo de `supabase/init.sql`
4. Ejecuta el script (botón "Run")
5. Verifica que se crearon las tablas correctamente

### 2. Configurar el Proyecto Local (2 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Editar .env con tus credenciales de Supabase
# VITE_SUPABASE_URL=tu_url_aqui
# VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Crear Usuarios Iniciales (3 minutos)

#### Opción A: Desde Supabase Dashboard
1. Ve a **Authentication** → **Users**
2. Crea 3 usuarios con estos correos:
   - `dueno@empresa.com`
   - `ingresos@empresa.com`
   - `egresos@empresa.com`
3. Asigna contraseñas temporales

#### Opción B: Desde SQL Editor
```sql
-- Insertar perfiles después de crear usuarios en Auth
INSERT INTO perfiles (id, nombre, rol) VALUES
  ('uuid_del_dueno', 'Juan Pérez', 'Dueño'),
  ('uuid_ingresos', 'María García', 'Usuario_Ingresos'),
  ('uuid_egresos', 'Carlos López', 'Usuario_Egresos');
```

### 4. Iniciar el Sistema (1 minuto)

```bash
# Modo desarrollo
npm run dev

# El sistema estará disponible en http://localhost:5173
```

### 5. Primer Login y Configuración (5 minutos)

#### a) Iniciar Sesión como Dueño
1. Abre el navegador en `http://localhost:5173`
2. Inicia sesión con `dueno@empresa.com`
3. Verás el Dashboard del Dueño

#### b) Configurar Catálogos Iniciales
1. Ve a **Catálogos**
2. Agrega algunos empleados:
   - Robert Bani
   - Deyvi Bani
   - Juan Pérez
3. Agrega algunas rutas:
   - Ruta Norte
   - Ruta Sur
   - Ruta Centro
4. Agrega algunos conceptos:
   - Pago de Nómina
   - Combustible
   - Mantenimiento
   - Envío Cobrado

### 6. Probar el Sistema (10 minutos)

#### a) Registrar Ingresos
1. Cierra sesión y entra como `ingresos@empresa.com`
2. Ve a **Folder Diario**
3. Registra un ingreso:
   - Concepto: Envío Cobrado
   - Empleado: Robert Bani
   - Ruta: Ruta Norte
   - Monto: 500.00
4. Opcionalmente agrega una evidencia (foto o PDF)

#### b) Registrar Egresos
1. Cierra sesión y entra como `egresos@empresa.com`
2. Ve a **Folder Diario**
3. Registra un egreso:
   - Concepto: Combustible
   - Empleado: Deyvi Bani
   - Ruta: Ruta Sur
   - Monto: 150.00

#### c) Ver Dashboard como Dueño
1. Cierra sesión y entra como `dueno@empresa.com`
2. Ve a **Dashboard**
3. Verás el desglose completo con:
   - Total Ingresos: $500.00
   - Total Egresos: $150.00
   - Balance Neto: $350.00

#### d) Exportar Reporte
1. En el Dashboard o Resumen Semanal
2. Haz clic en **Exportar PDF** o **Exportar XLSX**
3. Se descargará el reporte con todos los datos

#### e) Registrar Depósito
1. Ve a **Depósitos**
2. Registra un depósito:
   - Monto: 300.00
   - Fecha: Hoy
   - Banco: Bancomer
3. Verás el Saldo Disponible actualizado: $50.00

## 📱 Flujo de Trabajo Diario

### Para Usuario de Ingresos
1. **Iniciar sesión** cada mañana
2. **Ir a Folder Diario**
3. **Registrar cada ingreso** conforme ocurre:
   - Seleccionar concepto, empleado y ruta
   - Ingresar monto
   - Agregar foto de evidencia si es necesario
4. **Ver resumen** al final del día
5. **Exportar reporte** si es necesario

### Para Usuario de Egresos
1. **Iniciar sesión** cada mañana
2. **Ir a Folder Diario**
3. **Registrar cada egreso** conforme ocurre:
   - Seleccionar concepto, empleado y ruta
   - Ingresar monto
   - Agregar factura/recibo como evidencia
4. **Ver resumen** al final del día

### Para el Dueño
1. **Ver Dashboard** en cualquier momento para:
   - Revisar balance del día en tiempo real
   - Ver desglose de ingresos y egresos
   - Consultar semanas anteriores
2. **Cerrar folders** al final del día (opcional)
3. **Registrar depósitos** cuando se realicen
4. **Exportar reportes** semanales
5. **Gestionar catálogos** cuando sea necesario

## 🔧 Configuraciones Adicionales (Opcional)

### Configurar Notificaciones por Email
1. Lee `supabase/auth-config.md`
2. Crea cuenta en [Resend](https://resend.com)
3. Configura la API key en Supabase
4. Despliega la Edge Function `notificar-bloqueo`

### Configurar Storage para Evidencias
El bucket ya está configurado en `init.sql`, pero verifica:
1. Ve a **Storage** en Supabase
2. Confirma que existe el bucket `evidencias`
3. Verifica las políticas de acceso

## 🎯 Reglas Importantes del Sistema

### Regla del Lunes
- **Los registros del lunes pertenecen al sábado anterior**
- Esto es automático, no requiere acción del usuario
- El sistema muestra una alerta cuando es lunes

### Semana Laboral
- **Lunes a Sábado** (6 días)
- Los domingos no se trabaja
- Los reportes se generan por semana laboral

### Permisos por Rol
- **Usuario_Ingresos**: Solo ve y registra ingresos
- **Usuario_Egresos**: Solo ve y registra egresos
- **Dueño**: Ve todo, puede cerrar folders y gestionar depósitos

### Evidencias
- **Formatos**: JPG, PNG, PDF
- **Tamaño máximo**: 10 MB por archivo
- **Límite**: 5 evidencias por registro
- **Captura directa**: Usa la cámara del dispositivo

### Folders Cerrados
- Solo el **Dueño** puede cerrar folders
- Una vez cerrado, **no se pueden agregar más registros**
- Útil para "congelar" el día y evitar modificaciones

## 🆘 Solución de Problemas Comunes

### "No puedo iniciar sesión"
- Verifica que el usuario existe en Supabase Auth
- Verifica que existe un perfil en la tabla `perfiles`
- Revisa que las credenciales en `.env` sean correctas

### "No veo mis registros"
- Verifica que estás en el folder del día correcto
- Si es lunes, recuerda que los registros van al sábado
- Verifica que tu rol tenga permisos para ver ese tipo de registro

### "Error al subir evidencias"
- Verifica que el bucket `evidencias` existe en Storage
- Verifica que el archivo sea JPG, PNG o PDF
- Verifica que el archivo sea menor a 10 MB

### "No se calculan los balances"
- Verifica que los triggers se ejecutaron correctamente
- Revisa la consola del navegador por errores
- Refresca la página para forzar actualización

### "No puedo exportar reportes"
- Verifica que hay datos en la semana seleccionada
- Revisa la consola del navegador por errores
- Verifica que las librerías jsPDF y xlsx estén instaladas

## 📊 Datos de Prueba Sugeridos

### Empleados
- Robert Bani
- Deyvi Bani
- Juan Pérez
- María García
- Carlos López

### Rutas
- Ruta Norte
- Ruta Sur
- Ruta Centro
- Ruta Este
- Ruta Oeste

### Conceptos de Ingresos
- Envío Cobrado
- Paquete Express
- Servicio Especial
- Recolección

### Conceptos de Egresos
- Combustible
- Mantenimiento
- Pago de Nómina
- Peajes
- Reparaciones

## 🎓 Próximos Pasos

1. **Familiarízate con la interfaz** durante 1-2 días
2. **Capacita a los usuarios** en sus respectivos roles
3. **Establece rutinas diarias** de registro
4. **Define cuándo cerrar folders** (diario o semanal)
5. **Configura notificaciones** si las necesitas
6. **Considera implementar PWA** para uso offline

## 📞 Soporte

Para dudas o problemas:
1. Revisa `IMPLEMENTACION_COMPLETADA.md` para detalles técnicos
2. Consulta `supabase/README.md` para temas de base de datos
3. Revisa la consola del navegador para errores específicos

---

**¡Listo!** El sistema está completamente funcional y listo para usar. Comienza con datos de prueba y luego migra a datos reales cuando te sientas cómodo.
