# Guía del Super Admin - Plataforma Multi-Tenant

## Introducción

Como Super Admin, tienes acceso completo a la plataforma multi-tenant. Puedes crear y gestionar múltiples empresas, administrar usuarios, monitorear el uso de recursos y cambiar niveles de automatización.

## Tabla de Contenidos

1. [Gestión de Empresas](#gestión-de-empresas)
2. [Gestión de Usuarios](#gestión-de-usuarios)
3. [Cambio de Nivel de Automatización](#cambio-de-nivel-de-automatización)
4. [Monitoreo de Storage](#monitoreo-de-storage)
5. [Logs de Auditoría](#logs-de-auditoría)
6. [Cambio de Contexto](#cambio-de-contexto)
7. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)

---

## Gestión de Empresas

### Crear una Nueva Empresa

1. Accede al Dashboard de Super Admin
2. Haz clic en "Crear Nueva Empresa"
3. Completa el formulario:
   - **Nombre**: Nombre de la empresa cliente
   - **Nivel de Automatización**: 
     - **Parcial**: Sistema actual de cuadre automático (folders diarios, ingresos/egresos)
     - **Completa**: Incluye hojas de ruta digitales con seguimiento en tiempo real
   - **Logo** (opcional): Imagen de la empresa
   - **Límite de Storage**: Espacio en MB (por defecto 1000 MB)
4. Haz clic en "Crear Empresa"

### Editar una Empresa

1. En el Dashboard, localiza la empresa en la lista
2. Haz clic en el botón "Editar"
3. Modifica los campos necesarios
4. Guarda los cambios

### Desactivar/Reactivar una Empresa

**Desactivar:**
- Bloquea el acceso a todos los usuarios de la empresa
- Los datos se mantienen intactos
- Útil para suspensión temporal de servicio

**Reactivar:**
- Restaura el acceso a todos los usuarios
- Los datos permanecen sin cambios

**Pasos:**
1. Localiza la empresa en el Dashboard
2. Haz clic en "Desactivar" o "Reactivar"
3. Confirma la acción

---

## Gestión de Usuarios

### Crear un Usuario

1. Selecciona la empresa en el Dashboard
2. Haz clic en "Gestionar Usuarios"
3. Haz clic en "Crear Nuevo Usuario"
4. Completa el formulario:
   - **Nombre**: Nombre completo del usuario
   - **Email**: Correo electrónico único
   - **Contraseña**: Contraseña inicial (el usuario puede cambiarla después)
   - **Rol**: Selecciona según el nivel de automatización de la empresa
   - **Empresa**: Pre-seleccionada automáticamente
5. Haz clic en "Crear Usuario"

### Roles Disponibles

**Para Automatización Parcial:**
- **Usuario_Ingresos**: Solo puede registrar ingresos
- **Usuario_Egresos**: Solo puede registrar egresos
- **Usuario_Completo**: Puede registrar ingresos y egresos
- **Dueño**: Acceso completo de solo lectura

**Para Automatización Completa:**
- **Encargado_Almacén**: Crea y gestiona hojas de ruta, puede cerrarlas
- **Secretaria**: Crea hojas de ruta pero no puede cerrarlas
- **Empleado_Ruta**: Ejecuta rutas, registra entregas, cobros y gastos
- **Usuario_Completo**: Cierra hojas de ruta y registra ingresos/egresos
- **Dueño**: Acceso completo de solo lectura

### Editar Rol de Usuario

1. En la lista de usuarios, localiza al usuario
2. Haz clic en "Editar Rol"
3. Selecciona el nuevo rol
4. Confirma el cambio

### Desactivar un Usuario

1. Localiza al usuario en la lista
2. Haz clic en "Desactivar"
3. El usuario no podrá iniciar sesión pero sus datos se mantienen

---

## Cambio de Nivel de Automatización

### De Parcial a Completa

**Cuándo hacerlo:**
- El cliente quiere digitalizar completamente sus rutas
- Necesitan seguimiento en tiempo real de entregas y cobros
- Requieren gestión de gastos con evidencias

**Pasos:**
1. Accede a la empresa en el Dashboard
2. Haz clic en "Cambiar Nivel de Automatización"
3. Selecciona "Automatización Completa"
4. Lee la advertencia sobre los cambios
5. Confirma el cambio

**Efectos:**
- Se habilitan nuevos menús de hojas de ruta digitales
- Los usuarios verán nuevas opciones en la interfaz
- Los datos históricos se mantienen intactos
- Se registra el cambio en los logs de auditoría

### De Completa a Parcial

**Cuándo hacerlo:**
- El cliente quiere simplificar su operación
- No necesitan las funcionalidades avanzadas

**Efectos:**
- Se ocultan los menús de hojas de ruta digitales
- Los datos históricos de hojas de ruta se mantienen pero no son accesibles
- Los usuarios solo verán las funcionalidades básicas

---

## Monitoreo de Storage

### Ver Uso de Storage

1. Accede a la empresa en el Dashboard
2. Haz clic en "Monitoreo de Storage"
3. Verás:
   - Uso actual en MB/GB
   - Límite configurado
   - Porcentaje utilizado
   - Barra de progreso con colores:
     - **Verde**: < 75% usado
     - **Amarillo**: 75-90% usado
     - **Rojo**: > 90% usado

### Ajustar Límite de Storage

1. En la vista de Monitoreo de Storage
2. Haz clic en "Ajustar Límite"
3. Ingresa el nuevo límite en MB
4. El límite mínimo es el uso actual
5. Guarda los cambios

### Alertas de Storage

**Alerta Amarilla (75-90%):**
- Advertencia preventiva
- Monitorea el crecimiento

**Alerta Roja (>90%):**
- Límite casi alcanzado
- Considera aumentar el límite o eliminar archivos antiguos
- Los usuarios no podrán subir nuevos archivos al alcanzar el 100%

---

## Logs de Auditoría

### Acceder a los Logs

1. En el Dashboard, haz clic en "Logs de Auditoría"
2. Verás una tabla con todas las acciones registradas

### Filtrar Logs

Puedes filtrar por:
- **Acción**: Tipo de operación (crear, editar, eliminar, etc.)
- **Fecha Inicio/Fin**: Rango de fechas
- **Resultado**: Exitoso o Fallido
- **Empresa**: Específica o todas

### Exportar Logs

1. Aplica los filtros deseados
2. Haz clic en "Exportar CSV"
3. Se descargará un archivo con todos los logs filtrados

### Tipos de Eventos Registrados

- Creación/edición/desactivación de empresas
- Creación/modificación de usuarios
- Cambios de nivel de automatización
- Intentos de acceso no autorizado
- Violaciones de seguridad cross-tenant
- Modificaciones de límites de storage

---

## Cambio de Contexto

Como Super Admin, puedes cambiar entre empresas sin cerrar sesión.

### Cambiar a una Empresa Específica

1. En el header, haz clic en el selector de empresa
2. Selecciona la empresa deseada
3. La interfaz se actualizará para mostrar solo datos de esa empresa
4. El nombre de la empresa aparecerá en el header

### Regresar a Vista Global

1. En el selector de empresa, selecciona "Vista Global"
2. Verás el Dashboard con todas las empresas

### Importante

- Al cambiar de contexto, solo verás datos de la empresa seleccionada
- Las operaciones que realices afectarán solo a esa empresa
- El contexto se mantiene durante toda la sesión

---

## Seguridad y Mejores Prácticas

### Gestión de Contraseñas

- Usa contraseñas fuertes para tu cuenta de Super Admin
- Cambia tu contraseña regularmente
- No compartas tus credenciales

### Creación de Usuarios

- Verifica que el email sea correcto antes de crear un usuario
- Asigna el rol apropiado según las responsabilidades
- Informa al usuario sobre su contraseña inicial de forma segura

### Monitoreo Regular

- Revisa los logs de auditoría semanalmente
- Monitorea el uso de storage de cada empresa
- Verifica que no haya intentos de acceso no autorizado

### Cambios de Nivel de Automatización

- Comunica el cambio a los usuarios de la empresa antes de realizarlo
- Verifica que los usuarios entiendan las nuevas funcionalidades
- Proporciona capacitación si es necesario

### Desactivación de Empresas

- Comunica con anticipación antes de desactivar una empresa
- Verifica que no haya operaciones pendientes
- Documenta el motivo de la desactivación

### Respaldo de Datos

- Los datos se respaldan automáticamente en Supabase
- En caso de necesitar un respaldo manual, contacta al equipo técnico

### Violaciones de Seguridad

Si detectas violaciones de seguridad en los logs:
1. Identifica el usuario involucrado
2. Verifica si fue un error o un intento malicioso
3. Desactiva el usuario si es necesario
4. Contacta al equipo técnico para investigación

---

## Soporte Técnico

Si necesitas ayuda o encuentras problemas:
- Revisa esta guía primero
- Consulta los logs de auditoría para más detalles
- Contacta al equipo de desarrollo con información específica del problema

---

## Resumen de Acciones Rápidas

| Acción | Ubicación | Pasos |
|--------|-----------|-------|
| Crear empresa | Dashboard → Crear Nueva Empresa | Completar formulario → Guardar |
| Crear usuario | Dashboard → Empresa → Gestionar Usuarios | Completar formulario → Guardar |
| Cambiar nivel | Dashboard → Empresa → Cambiar Nivel | Seleccionar nivel → Confirmar |
| Ver storage | Dashboard → Empresa → Monitoreo Storage | Ver estadísticas |
| Ver logs | Dashboard → Logs de Auditoría | Aplicar filtros → Ver/Exportar |
| Cambiar contexto | Header → Selector de Empresa | Seleccionar empresa |

---

**Última actualización:** Marzo 2026
