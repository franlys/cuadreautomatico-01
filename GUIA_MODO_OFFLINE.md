# Guía de Modo Offline - Cuadre Automático

## Descripción

El sistema Cuadre Automático incluye funcionalidad completa de PWA (Progressive Web App) con soporte offline, permitiendo a los usuarios trabajar sin conexión a internet y sincronizar automáticamente cuando recuperan la conexión.

## Características del Modo Offline

### ✅ Funcionalidades Disponibles Offline

1. **Login Offline**
   - Iniciar sesión con credenciales previamente guardadas
   - Las credenciales se guardan automáticamente después del primer login exitoso online
   - Válidas por 7 días desde la última actualización

2. **Registro de Ingresos y Egresos**
   - Crear registros de ingresos y egresos sin conexión
   - Los registros se guardan localmente en IndexedDB
   - Se sincronizan automáticamente al recuperar conexión

3. **Consulta de Catálogos**
   - Acceso a empleados, rutas y conceptos previamente sincronizados
   - Los catálogos se actualizan automáticamente cada 5 minutos cuando hay conexión

4. **Visualización de Datos**
   - Ver folders diarios previamente cargados
   - Ver resumen semanal en caché
   - Ver registros guardados localmente

### ❌ Funcionalidades NO Disponibles Offline

1. **Carga de Evidencias**
   - No se pueden subir fotos o PDFs sin conexión
   - Las evidencias requieren conexión para subir a Supabase Storage

2. **Exportación de Reportes**
   - La generación de PDF y XLSX requiere datos actualizados del servidor

3. **Envío de Notificaciones**
   - El botón "Enviar Reporte" requiere conexión para enviar correos y WhatsApp

4. **Dashboard en Tiempo Real**
   - Los datos del dashboard requieren conexión para actualizarse

## Instalación como PWA

### En Android (Chrome/Edge)

1. Abrir el sitio en Chrome o Edge
2. Tocar el menú (⋮) en la esquina superior derecha
3. Seleccionar "Agregar a pantalla de inicio" o "Instalar aplicación"
4. Confirmar la instalación
5. El ícono aparecerá en la pantalla de inicio

### En iOS (Safari)

1. Abrir el sitio en Safari
2. Tocar el botón de compartir (□↑)
3. Desplazarse y seleccionar "Agregar a pantalla de inicio"
4. Editar el nombre si es necesario
5. Tocar "Agregar"
6. El ícono aparecerá en la pantalla de inicio

### En Desktop (Chrome/Edge)

1. Abrir el sitio en Chrome o Edge
2. Buscar el ícono de instalación (+) en la barra de direcciones
3. Hacer clic en "Instalar"
4. La aplicación se abrirá en una ventana independiente

## Uso del Modo Offline

### Primer Uso (Requiere Conexión)

1. **Login Inicial Online**
   - Iniciar sesión con conexión a internet
   - El sistema guardará automáticamente las credenciales en caché
   - Los catálogos se descargarán automáticamente

2. **Sincronización Inicial**
   - Los datos actuales se guardarán en caché
   - Los catálogos se almacenarán localmente

### Trabajando Sin Conexión

1. **Indicador de Estado**
   - En la esquina inferior derecha verás un indicador de conexión
   - 🟢 Verde = En línea
   - 🔴 Rojo = Sin conexión

2. **Crear Registros Offline**
   - Navegar a "Folder Diario"
   - Llenar el formulario normalmente
   - Al guardar, verás el mensaje: "Guardado localmente (sin conexión)"
   - El registro se agregará a la cola de sincronización

3. **Contador de Pendientes**
   - El indicador mostrará cuántos registros están pendientes de sincronizar
   - Ejemplo: "3 pendientes"

### Recuperación de Conexión

1. **Sincronización Automática**
   - Cuando recuperes la conexión, el sistema detectará automáticamente
   - Iniciará la sincronización de todos los registros pendientes
   - Verás una notificación con el resultado

2. **Sincronización Manual**
   - Si la sincronización automática no inicia, puedes hacerlo manualmente
   - Hacer clic en el botón "Sincronizar" en el indicador de estado

3. **Resultado de Sincronización**
   - **Exitosa**: "Sincronización exitosa: X registros sincronizados"
   - **Con errores**: Se mostrará qué falló y por qué
   - **Con conflictos**: Se abrirá un modal para resolver conflictos

## Resolución de Conflictos

### ¿Qué es un Conflicto?

Un conflicto ocurre cuando:
- Modificaste un registro offline
- Alguien más modificó el mismo registro online
- Ambas versiones tienen timestamps diferentes

### Cómo Resolver Conflictos

1. **Modal de Conflictos**
   - Se abrirá automáticamente si hay conflictos
   - Mostrará las dos versiones lado a lado:
     - **Versión Local** (azul): Tu versión offline
     - **Versión Servidor** (verde): La versión online

2. **Comparar Versiones**
   - Revisa los campos de ambas versiones
   - Verifica cuál tiene la información correcta
   - Considera el timestamp de actualización

3. **Seleccionar Versión**
   - Hacer clic en "Usar esta versión" en la versión que deseas conservar
   - La versión seleccionada se guardará en el servidor
   - La otra versión se descartará

4. **Resolver Todos los Conflictos**
   - Debes resolver todos los conflictos uno por uno
   - No puedes cerrar el modal hasta resolver todos
   - Una vez resueltos, verás: "Todos los conflictos han sido resueltos"

## Seguridad del Modo Offline

### Almacenamiento de Credenciales

- Las credenciales se almacenan con un hash simple en IndexedDB
- **NOTA**: En producción, se debe usar criptografía real (Web Crypto API)
- Las credenciales expiran después de 7 días
- Se eliminan automáticamente al hacer logout

### Datos Locales

- Todos los datos se almacenan en IndexedDB del navegador
- Los datos son específicos del dispositivo y navegador
- No se comparten entre dispositivos
- Se pueden limpiar desde la configuración del navegador

### Recomendaciones de Seguridad

1. **No usar en dispositivos compartidos**
   - El modo offline guarda credenciales localmente
   - Siempre hacer logout en dispositivos compartidos

2. **Mantener el dispositivo seguro**
   - Usar contraseña/PIN en el dispositivo
   - No dejar el dispositivo desbloqueado

3. **Sincronizar regularmente**
   - No acumular muchos registros offline
   - Sincronizar al menos una vez al día

## Troubleshooting

### No puedo hacer login offline

**Posibles causas:**
- Nunca has hecho login online en este dispositivo
- Las credenciales expiraron (>7 días)
- Limpiaste los datos del navegador

**Solución:**
- Conectarte a internet y hacer login online
- Las credenciales se guardarán automáticamente

### Los registros no se sincronizan

**Posibles causas:**
- No hay conexión a internet
- Error en el servidor
- Conflictos sin resolver

**Solución:**
1. Verificar conexión a internet
2. Hacer clic en "Sincronizar" manualmente
3. Revisar si hay conflictos pendientes
4. Verificar logs en la consola del navegador

### Los catálogos están desactualizados

**Posibles causas:**
- No has tenido conexión por mucho tiempo
- La sincronización automática falló

**Solución:**
1. Conectarte a internet
2. Esperar 5 minutos (sincronización automática)
3. O recargar la página

### El indicador de estado no aparece

**Posibles causas:**
- No hay registros pendientes
- Estás online y todo está sincronizado

**Solución:**
- Esto es normal, el indicador solo aparece cuando hay pendientes o estás offline

### Perdí datos offline

**Posibles causas:**
- Limpiaste los datos del navegador
- Desinstalaste la PWA
- Cambiaste de dispositivo

**Solución:**
- Los datos offline son locales al dispositivo
- No se pueden recuperar si se eliminan
- Siempre sincronizar antes de limpiar datos

## Limitaciones del Modo Offline

### Limitaciones Técnicas

1. **Almacenamiento Limitado**
   - IndexedDB tiene límites de almacenamiento por navegador
   - Típicamente 50-100 MB en móviles
   - Más en desktop

2. **Sin Validaciones del Servidor**
   - Las validaciones offline son solo del cliente
   - El servidor puede rechazar registros al sincronizar

3. **Sin Actualizaciones en Tiempo Real**
   - No verás cambios de otros usuarios mientras estés offline
   - Los datos se actualizan solo al sincronizar

### Limitaciones de Negocio

1. **Folders Cerrados**
   - No puedes verificar si un folder está cerrado offline
   - El servidor rechazará registros en folders cerrados al sincronizar

2. **Balances Desactualizados**
   - Los balances calculados offline pueden no ser exactos
   - Se recalculan correctamente al sincronizar

3. **Evidencias**
   - No se pueden subir evidencias offline
   - Debes conectarte para subir fotos/PDFs

## Mejores Prácticas

### Para Usuarios

1. **Sincronizar Diariamente**
   - Conectarse al menos una vez al día
   - Sincronizar antes de terminar la jornada

2. **No Acumular Muchos Registros**
   - Sincronizar cada 10-20 registros
   - Evitar acumular más de 50 registros offline

3. **Verificar Sincronización**
   - Revisar que el contador de pendientes llegue a 0
   - Verificar que no haya errores

4. **Mantener Credenciales Actualizadas**
   - Hacer login online al menos una vez por semana
   - Esto renueva las credenciales en caché

### Para Administradores

1. **Monitorear Sincronizaciones**
   - Revisar logs de sincronización
   - Identificar usuarios con problemas recurrentes

2. **Capacitar Usuarios**
   - Explicar cómo funciona el modo offline
   - Enseñar a resolver conflictos

3. **Establecer Políticas**
   - Definir frecuencia mínima de sincronización
   - Establecer límites de registros offline

## Soporte Técnico

### Información para Reportar Problemas

Al reportar un problema con el modo offline, incluir:

1. **Información del Dispositivo**
   - Sistema operativo y versión
   - Navegador y versión
   - ¿PWA instalada o navegador?

2. **Descripción del Problema**
   - ¿Qué estabas haciendo?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?

3. **Logs de la Consola**
   - Abrir DevTools (F12)
   - Ir a la pestaña Console
   - Copiar mensajes de error

4. **Estado de Sincronización**
   - ¿Cuántos registros pendientes?
   - ¿Hay conflictos?
   - ¿Cuándo fue la última sincronización exitosa?

### Contacto

Para soporte técnico, contactar al administrador del sistema con la información anterior.

