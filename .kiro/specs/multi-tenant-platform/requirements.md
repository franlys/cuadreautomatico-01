# Requirements Document

## Introduction

La Plataforma Multi-Tenant transforma el sistema actual de cuadre automático en una plataforma SaaS donde un Super Admin puede crear y gestionar múltiples empresas independientes. Cada empresa opera con sus propios datos aislados, usuarios y nivel de automatización (parcial o completa). El nivel de automatización parcial mantiene el sistema actual de registro manual, mientras que el nivel completo introduce hojas de ruta digitales con seguimiento en tiempo real de entregas, cobros y gastos.

## Glossary

- **Plataforma_Multi_Tenant**: El sistema completo que gestiona múltiples empresas con datos aislados
- **Super_Admin**: Usuario administrador de la plataforma con acceso a todas las empresas
- **Empresa**: Entidad organizacional independiente con sus propios usuarios, datos y configuración
- **Nivel_Automatización**: Configuración que determina las funcionalidades disponibles (Parcial o Completa)
- **Automatización_Parcial**: Nivel que mantiene el sistema actual de registro manual de ingresos/egresos
- **Automatización_Completa**: Nivel que incluye hojas de ruta digitales con seguimiento en tiempo real
- **Hoja_Ruta_Digital**: Documento digital que contiene facturas asignadas, montos y seguimiento de entregas
- **Encargado_Almacén**: Rol que crea y gestiona hojas de ruta digitales
- **Empleado_Ruta**: Rol que ejecuta rutas y registra entregas, cobros y gastos desde dispositivo móvil
- **Secretaria**: Rol que crea hojas de ruta digitales pero no puede cerrarlas
- **Factura**: Documento de cobro con monto en RD$ o USD, puede estar pagada (PA) o pendiente
- **Monto_Asignado**: Dinero entregado al empleado para gastos de la ruta
- **Gasto_Fijo**: Gasto predefinido sin evidencia obligatoria (agua, comida, pago empleados)
- **Gasto_Con_Evidencia**: Gasto que requiere foto obligatoria (peaje, combustible)
- **Gasto_Inesperado**: Gasto no planificado con descripción y foto opcional
- **Balance_Tiempo_Real**: Cálculo automático del dinero disponible durante la ejecución de la ruta
- **Cierre_Ruta**: Proceso de validación final donde se compara el cálculo automático con el dinero físico
- **RLS**: Row Level Security, mecanismo de seguridad que aísla datos por empresa
- **Tenant_ID**: Identificador único de empresa usado para aislamiento de datos (empresa_id)

## Requirements

### Requirement 1: Gestión de Empresas por Super Admin

**User Story:** Como Super Admin, quiero crear y gestionar múltiples empresas en la plataforma, para que cada cliente tenga su propio espacio aislado.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin crear nuevas empresas
2. WHEN Super_Admin crea una empresa, THE Plataforma_Multi_Tenant SHALL solicitar nombre de empresa, nivel de automatización y logo opcional
3. THE Plataforma_Multi_Tenant SHALL generar un Tenant_ID único para cada empresa
4. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin editar nombre, logo y nivel de automatización de empresas existentes
5. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin desactivar empresas sin eliminar sus datos
6. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin reactivar empresas desactivadas
7. WHEN una empresa está desactivada, THE Plataforma_Multi_Tenant SHALL bloquear el acceso a todos sus usuarios
8. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin una lista de todas las empresas con su estado y nivel de automatización

### Requirement 2: Aislamiento de Datos Multi-Tenant

**User Story:** Como administrador de seguridad, quiero que los datos de cada empresa estén completamente aislados, para garantizar privacidad y seguridad.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL agregar columna empresa_id a todas las tablas de datos
2. THE Plataforma_Multi_Tenant SHALL aplicar RLS en todas las tablas para filtrar por empresa_id
3. WHEN un usuario consulta datos, THE Plataforma_Multi_Tenant SHALL retornar únicamente datos de su empresa
4. THE Plataforma_Multi_Tenant SHALL almacenar archivos en Storage con prefijo de empresa_id
5. THE Plataforma_Multi_Tenant SHALL aplicar políticas de Storage que validen empresa_id del usuario
6. THE Plataforma_Multi_Tenant SHALL mantener catálogos independientes por empresa (empleados, rutas, conceptos)
7. WHEN Super_Admin consulta datos, THE Plataforma_Multi_Tenant SHALL permitir filtrar por empresa específica
8. THE Plataforma_Multi_Tenant SHALL prevenir cualquier consulta cross-tenant no autorizada

### Requirement 3: Dashboard Super Admin

**User Story:** Como Super Admin, quiero un dashboard con estadísticas globales, para monitorear el estado de la plataforma.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el total de empresas activas
2. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el total de empresas desactivadas
3. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el total de usuarios por empresa
4. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el nivel de automatización de cada empresa
5. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el uso de almacenamiento por empresa
6. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin la fecha de última actividad por empresa
7. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin ordenar empresas por nombre, fecha de creación o actividad
8. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin buscar empresas por nombre

### Requirement 4: Gestión de Usuarios por Empresa

**User Story:** Como Super Admin, quiero crear usuarios dentro de cada empresa, para que puedan acceder al sistema con sus roles específicos.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin crear usuarios en cualquier empresa
2. WHEN Super_Admin crea un usuario, THE Plataforma_Multi_Tenant SHALL solicitar nombre, email, contraseña, rol y empresa
3. THE Plataforma_Multi_Tenant SHALL asociar automáticamente el usuario a la empresa seleccionada
4. THE Plataforma_Multi_Tenant SHALL validar que el email sea único en toda la plataforma
5. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin editar rol y estado de usuarios
6. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin desactivar usuarios sin eliminarlos
7. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin la lista de usuarios filtrada por empresa
8. WHEN un usuario inicia sesión, THE Plataforma_Multi_Tenant SHALL cargar automáticamente el contexto de su empresa

### Requirement 5: Roles en Automatización Parcial

**User Story:** Como empresa con automatización parcial, quiero mantener los roles actuales del sistema, para continuar operando sin cambios.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL habilitar rol Usuario_Ingresos
2. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL habilitar rol Usuario_Egresos
3. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL habilitar rol Usuario_Completo
4. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL habilitar rol Dueño
5. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL mantener todas las funcionalidades actuales
6. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL ocultar funcionalidades de hojas de ruta digitales

### Requirement 6: Roles en Automatización Completa

**User Story:** Como empresa con automatización completa, quiero roles adicionales para gestionar hojas de ruta digitales, para digitalizar completamente el proceso.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar rol Encargado_Almacén
2. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar rol Empleado_Ruta
3. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar rol Secretaria
4. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar rol Usuario_Completo
5. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar rol Dueño
6. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar funcionalidades de hojas de ruta digitales
7. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL mantener compatibilidad con registro manual

### Requirement 7: Creación de Hoja de Ruta Digital

**User Story:** Como Encargado_Almacén o Secretaria, quiero crear hojas de ruta digitales con facturas y montos asignados, para que los empleados ejecuten sus rutas.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL permitir a Encargado_Almacén crear hojas de ruta digitales
2. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL permitir a Secretaria crear hojas de ruta digitales
3. WHEN se crea una hoja de ruta, THE Plataforma_Multi_Tenant SHALL solicitar empleado, ruta y fecha
4. THE Plataforma_Multi_Tenant SHALL generar identificador único con formato "Empleado Ruta Fecha" (ej: "Jose Bani 20/03/2026")
5. THE Plataforma_Multi_Tenant SHALL permitir agregar facturas pagadas con monto en RD$ o USD
6. THE Plataforma_Multi_Tenant SHALL permitir agregar facturas pendientes con monto en RD$ o USD
7. THE Plataforma_Multi_Tenant SHALL permitir asignar monto para gastos en RD$
8. THE Plataforma_Multi_Tenant SHALL calcular automáticamente el total de facturas y monto asignado
9. WHEN se completa la creación, THE Plataforma_Multi_Tenant SHALL asignar la hoja al Empleado_Ruta seleccionado

### Requirement 8: Ejecución de Ruta por Empleado

**User Story:** Como Empleado_Ruta, quiero ver mi hoja de ruta asignada y registrar entregas, cobros y gastos desde mi móvil, para mantener el control en tiempo real.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL mostrar a Empleado_Ruta únicamente sus hojas asignadas
2. WHEN Empleado_Ruta abre su hoja, THE Plataforma_Multi_Tenant SHALL mostrar lista de facturas con estado (pendiente/entregada/cobrada)
3. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta marcar facturas como entregadas
4. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta marcar facturas como cobradas con monto en RD$ o USD
5. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta registrar gastos fijos sin evidencia
6. THE Plataforma_Multi_Tenant SHALL requerir foto obligatoria para gastos de peaje y combustible
7. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta registrar gastos inesperados con descripción y foto opcional
8. WHEN Empleado_Ruta registra un gasto, THE Plataforma_Multi_Tenant SHALL descontar primero del Monto_Asignado
9. WHEN Monto_Asignado se agota, THE Plataforma_Multi_Tenant SHALL descontar gastos del dinero cobrado
10. THE Plataforma_Multi_Tenant SHALL calcular y mostrar Balance_Tiempo_Real después de cada operación

### Requirement 9: Cálculo Automático de Balance

**User Story:** Como sistema, quiero calcular automáticamente el balance de la ruta en tiempo real, para que el empleado y el encargado conozcan el estado financiero.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL calcular total de facturas cobradas en RD$ y USD
2. THE Plataforma_Multi_Tenant SHALL calcular total de gastos registrados
3. THE Plataforma_Multi_Tenant SHALL calcular dinero disponible como (Monto_Asignado + Cobros - Gastos)
4. WHEN se registra un cobro, THE Plataforma_Multi_Tenant SHALL actualizar Balance_Tiempo_Real inmediatamente
5. WHEN se registra un gasto, THE Plataforma_Multi_Tenant SHALL actualizar Balance_Tiempo_Real inmediatamente
6. THE Plataforma_Multi_Tenant SHALL mostrar Balance_Tiempo_Real en la interfaz del Empleado_Ruta
7. THE Plataforma_Multi_Tenant SHALL mostrar Balance_Tiempo_Real en la interfaz del Encargado_Almacén
8. THE Plataforma_Multi_Tenant SHALL mantener historial de cambios en el balance

### Requirement 10: Cierre de Ruta

**User Story:** Como Usuario_Completo, quiero cerrar hojas de ruta completadas validando el dinero físico, para registrar automáticamente el ingreso sin entrada manual.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL permitir a Usuario_Completo seleccionar hojas completadas
2. WHEN Usuario_Completo selecciona una hoja, THE Plataforma_Multi_Tenant SHALL mostrar cálculo automático de monto esperado
3. THE Plataforma_Multi_Tenant SHALL mostrar total de facturas cobradas en RD$ y USD
4. THE Plataforma_Multi_Tenant SHALL mostrar total de gastos registrados
5. THE Plataforma_Multi_Tenant SHALL mostrar monto esperado a recibir
6. THE Plataforma_Multi_Tenant SHALL permitir a Usuario_Completo confirmar o ajustar el monto físico contado
7. WHEN Usuario_Completo confirma el cierre, THE Plataforma_Multi_Tenant SHALL crear registro de ingreso automáticamente
8. THE Plataforma_Multi_Tenant SHALL asociar el ingreso al Folder_Diario de la fecha correspondiente
9. THE Plataforma_Multi_Tenant SHALL marcar la hoja de ruta como cerrada
10. THE Plataforma_Multi_Tenant SHALL prevenir modificaciones a hojas cerradas

### Requirement 11: Restricciones de Permisos por Rol

**User Story:** Como administrador de seguridad, quiero que cada rol tenga permisos específicos según el nivel de automatización, para mantener la seguridad operacional.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL permitir a Encargado_Almacén crear, editar y ver todas las hojas de ruta
2. THE Plataforma_Multi_Tenant SHALL permitir a Secretaria crear y ver hojas de ruta sin poder cerrarlas
3. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta ver únicamente sus hojas asignadas
4. THE Plataforma_Multi_Tenant SHALL permitir a Empleado_Ruta modificar únicamente sus hojas no cerradas
5. THE Plataforma_Multi_Tenant SHALL permitir a Usuario_Completo cerrar hojas de ruta y registrar ingresos/egresos
6. THE Plataforma_Multi_Tenant SHALL permitir a Dueño ver todas las hojas sin poder modificarlas
7. WHEN un usuario intenta acceder a funcionalidad no autorizada, THE Plataforma_Multi_Tenant SHALL denegar el acceso
8. THE Plataforma_Multi_Tenant SHALL registrar intentos de acceso no autorizado en logs de auditoría

### Requirement 12: Migración de Datos Existentes

**User Story:** Como administrador de la plataforma, quiero migrar los datos actuales a una empresa predeterminada, para no perder información existente.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL crear una empresa llamada "Empresa 1" durante la migración
2. THE Plataforma_Multi_Tenant SHALL configurar "Empresa 1" con Automatización_Parcial
3. THE Plataforma_Multi_Tenant SHALL asociar todos los usuarios existentes a "Empresa 1"
4. THE Plataforma_Multi_Tenant SHALL asociar todos los datos existentes a "Empresa 1" mediante empresa_id
5. THE Plataforma_Multi_Tenant SHALL mantener todos los registros históricos sin pérdida de datos
6. THE Plataforma_Multi_Tenant SHALL mantener todas las relaciones entre tablas existentes
7. THE Plataforma_Multi_Tenant SHALL validar integridad referencial después de la migración
8. WHEN la migración falla, THE Plataforma_Multi_Tenant SHALL revertir todos los cambios mediante rollback

### Requirement 13: Cambio de Nivel de Automatización

**User Story:** Como Super Admin, quiero cambiar el nivel de automatización de una empresa, para adaptarme a las necesidades cambiantes del cliente.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin cambiar de Automatización_Parcial a Automatización_Completa
2. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin cambiar de Automatización_Completa a Automatización_Parcial
3. WHEN se cambia a Automatización_Completa, THE Plataforma_Multi_Tenant SHALL habilitar funcionalidades de hojas de ruta digitales
4. WHEN se cambia a Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL ocultar funcionalidades de hojas de ruta digitales
5. WHEN se cambia a Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL mantener datos históricos de hojas de ruta
6. THE Plataforma_Multi_Tenant SHALL mostrar advertencia antes de cambiar nivel de automatización
7. THE Plataforma_Multi_Tenant SHALL registrar cambios de nivel en logs de auditoría
8. THE Plataforma_Multi_Tenant SHALL notificar a usuarios de la empresa sobre el cambio

### Requirement 14: Selector de Contexto de Empresa

**User Story:** Como Super Admin, quiero cambiar entre empresas fácilmente, para gestionar múltiples clientes sin cerrar sesión.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin un selector de empresa en la interfaz
2. THE Plataforma_Multi_Tenant SHALL listar todas las empresas activas en el selector
3. WHEN Super_Admin selecciona una empresa, THE Plataforma_Multi_Tenant SHALL cambiar el contexto a esa empresa
4. WHEN el contexto cambia, THE Plataforma_Multi_Tenant SHALL mostrar únicamente datos de la empresa seleccionada
5. THE Plataforma_Multi_Tenant SHALL mantener el contexto seleccionado durante la sesión
6. THE Plataforma_Multi_Tenant SHALL mostrar el nombre de la empresa actual en la interfaz
7. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin regresar a vista global sin contexto específico

### Requirement 15: Logs de Auditoría Global

**User Story:** Como Super Admin, quiero ver logs de actividad de todas las empresas, para monitorear operaciones y detectar problemas.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL registrar todas las acciones de Super_Admin con timestamp y empresa afectada
2. THE Plataforma_Multi_Tenant SHALL registrar creación, edición y desactivación de empresas
3. THE Plataforma_Multi_Tenant SHALL registrar creación y modificación de usuarios
4. THE Plataforma_Multi_Tenant SHALL registrar cambios de nivel de automatización
5. THE Plataforma_Multi_Tenant SHALL registrar intentos de acceso no autorizado
6. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin filtrar logs por empresa, usuario, fecha y tipo de acción
7. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin exportar logs en formato CSV
8. THE Plataforma_Multi_Tenant SHALL retener logs por al menos 90 días

### Requirement 16: Gestión de Storage por Empresa

**User Story:** Como Super Admin, quiero monitorear el uso de almacenamiento por empresa, para gestionar costos y capacidad.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL calcular el tamaño total de archivos por empresa
2. THE Plataforma_Multi_Tenant SHALL mostrar a Super_Admin el uso de storage por empresa en MB o GB
3. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin establecer límites de storage por empresa
4. WHEN una empresa alcanza su límite, THE Plataforma_Multi_Tenant SHALL bloquear nuevas cargas de archivos
5. WHEN se bloquea carga por límite, THE Plataforma_Multi_Tenant SHALL mostrar mensaje al usuario
6. THE Plataforma_Multi_Tenant SHALL permitir a Super_Admin aumentar límite de storage
7. THE Plataforma_Multi_Tenant SHALL mostrar tendencia de crecimiento de storage por empresa

### Requirement 17: Soporte Offline Multi-Tenant

**User Story:** Como usuario de cualquier empresa, quiero trabajar offline con mis datos, para mantener productividad sin conexión.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL sincronizar únicamente datos de la empresa del usuario
2. WHEN un usuario trabaja offline, THE Plataforma_Multi_Tenant SHALL almacenar cambios localmente con empresa_id
3. WHEN se recupera conexión, THE Plataforma_Multi_Tenant SHALL sincronizar cambios a la empresa correcta
4. THE Plataforma_Multi_Tenant SHALL prevenir sincronización cross-tenant de datos offline
5. THE Plataforma_Multi_Tenant SHALL validar empresa_id antes de sincronizar cada registro
6. WHEN la validación falla, THE Plataforma_Multi_Tenant SHALL marcar el registro como conflicto
7. THE Plataforma_Multi_Tenant SHALL notificar al usuario sobre conflictos de sincronización

### Requirement 18: Interfaz Adaptativa por Nivel

**User Story:** Como usuario, quiero ver únicamente las funcionalidades disponibles para mi nivel de automatización, para evitar confusión.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Parcial, THE Plataforma_Multi_Tenant SHALL ocultar menús de hojas de ruta digitales
2. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL mostrar menús de hojas de ruta digitales
3. THE Plataforma_Multi_Tenant SHALL adaptar la interfaz automáticamente según el nivel de la empresa del usuario
4. THE Plataforma_Multi_Tenant SHALL mostrar indicador visual del nivel de automatización actual
5. WHEN el nivel cambia, THE Plataforma_Multi_Tenant SHALL actualizar la interfaz sin requerir logout
6. THE Plataforma_Multi_Tenant SHALL mantener consistencia visual entre niveles de automatización

### Requirement 19: Validación de Integridad Multi-Tenant

**User Story:** Como administrador de seguridad, quiero validar que no existan fugas de datos entre empresas, para garantizar aislamiento total.

#### Acceptance Criteria

1. THE Plataforma_Multi_Tenant SHALL validar que todas las consultas incluyan filtro por empresa_id
2. THE Plataforma_Multi_Tenant SHALL validar que todas las inserciones incluyan empresa_id del usuario
3. THE Plataforma_Multi_Tenant SHALL validar que todas las actualizaciones respeten empresa_id original
4. WHEN se detecta intento de acceso cross-tenant, THE Plataforma_Multi_Tenant SHALL bloquear la operación
5. WHEN se bloquea una operación, THE Plataforma_Multi_Tenant SHALL registrar el incidente en logs de seguridad
6. THE Plataforma_Multi_Tenant SHALL ejecutar validaciones de integridad periódicamente
7. THE Plataforma_Multi_Tenant SHALL notificar a Super_Admin sobre violaciones de seguridad

### Requirement 20: Moneda Multi-Divisa en Hojas de Ruta

**User Story:** Como Empleado_Ruta, quiero registrar cobros y gastos en RD$ o USD, para manejar transacciones en ambas monedas.

#### Acceptance Criteria

1. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL permitir registrar facturas en RD$ o USD
2. WHERE Empresa tiene Automatización_Completa, THE Plataforma_Multi_Tenant SHALL permitir registrar gastos en RD$ o USD
3. THE Plataforma_Multi_Tenant SHALL mostrar totales separados por moneda en Balance_Tiempo_Real
4. THE Plataforma_Multi_Tenant SHALL mostrar totales separados por moneda en Cierre_Ruta
5. THE Plataforma_Multi_Tenant SHALL permitir a Usuario_Completo validar montos físicos por moneda
6. THE Plataforma_Multi_Tenant SHALL crear registros de ingreso separados por moneda al cerrar ruta
7. THE Plataforma_Multi_Tenant SHALL mantener trazabilidad de moneda en todos los registros
