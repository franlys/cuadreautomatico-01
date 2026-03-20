# Requirements Document

## Introduction

La funcionalidad de Hojas de Ruta permite digitalizar el proceso de validación de entregas de rutas mediante evidencia fotográfica. Actualmente, los empleados entregan un folder físico con facturas y una hoja de ruta que resume las entregas, pagos y gastos del día. Este sistema permitirá subir una foto de esa hoja de ruta y asociarla a la ruta correspondiente para facilitar la validación y auditoría.

## Glossary

- **Sistema_Hojas_Ruta**: El subsistema que gestiona la carga, almacenamiento y visualización de hojas de ruta fotográficas
- **Hoja_Ruta**: Documento físico que resume las facturas entregadas, pagos recibidos y gastos de una ruta específica en un día laboral
- **Ruta**: Zona geográfica de entrega (ej: Bani, Capital, Santo Domingo) que tiene facturas asignadas para entregar
- **Folder_Diario**: Contenedor de todos los registros de ingresos y egresos de un día laboral específico
- **Usuario_Completo**: Rol de usuario con permisos para registrar ingresos, egresos y subir hojas de ruta
- **Usuario_Ingresos**: Rol de usuario con permisos para registrar ingresos y subir hojas de ruta
- **Dueño**: Rol de usuario con permisos de solo lectura para visualizar hojas de ruta y reportes
- **Evidencia_Hoja_Ruta**: Archivo fotográfico de una hoja de ruta almacenado en el sistema
- **Ruta_Normal**: Tipo de ruta donde se cobran facturas y se registra el ingreso completo
- **Ruta_Monto_Asignado**: Tipo de ruta donde se asigna un monto fijo para gastos y el dinero de facturas no se toca salvo necesidad

## Requirements

### Requirement 1: Subir Hoja de Ruta

**User Story:** Como usuario autorizado, quiero subir una foto de la hoja de ruta de una ruta específica, para que quede registrada la evidencia del día laboral.

#### Acceptance Criteria

1. WHEN un Usuario_Completo o Usuario_Ingresos selecciona subir hoja de ruta, THE Sistema_Hojas_Ruta SHALL mostrar un selector de ruta y un campo para cargar foto
2. THE Sistema_Hojas_Ruta SHALL permitir seleccionar una ruta del catálogo de rutas activas
3. THE Sistema_Hojas_Ruta SHALL permitir cargar una foto desde la cámara o galería del dispositivo
4. THE Sistema_Hojas_Ruta SHALL validar que el archivo sea una imagen (JPEG, PNG, HEIC, WebP)
5. THE Sistema_Hojas_Ruta SHALL validar que el tamaño del archivo no exceda 10MB
6. WHEN se sube una hoja de ruta, THE Sistema_Hojas_Ruta SHALL asociarla al Folder_Diario de la fecha laboral actual
7. WHEN se sube una hoja de ruta, THE Sistema_Hojas_Ruta SHALL almacenar la ruta seleccionada como metadato
8. WHEN la carga es exitosa, THE Sistema_Hojas_Ruta SHALL mostrar un mensaje de confirmación

### Requirement 2: Restricción de Una Hoja por Ruta por Día

**User Story:** Como administrador del sistema, quiero que solo se pueda subir una hoja de ruta por ruta por día, para mantener la integridad de los registros.

#### Acceptance Criteria

1. WHEN un usuario intenta subir una hoja de ruta para una ruta que ya tiene hoja subida en el día actual, THE Sistema_Hojas_Ruta SHALL rechazar la carga
2. WHEN se rechaza una carga duplicada, THE Sistema_Hojas_Ruta SHALL mostrar un mensaje indicando que ya existe una hoja para esa ruta en el día
3. THE Sistema_Hojas_Ruta SHALL permitir visualizar la hoja existente antes de decidir si reemplazarla
4. WHERE el usuario confirma reemplazo, THE Sistema_Hojas_Ruta SHALL eliminar la hoja anterior y subir la nueva

### Requirement 3: Control de Permisos

**User Story:** Como administrador del sistema, quiero controlar quién puede subir y ver hojas de ruta, para mantener la seguridad de la información.

#### Acceptance Criteria

1. THE Sistema_Hojas_Ruta SHALL permitir a Usuario_Completo subir hojas de ruta
2. THE Sistema_Hojas_Ruta SHALL permitir a Usuario_Ingresos subir hojas de ruta
3. THE Sistema_Hojas_Ruta SHALL permitir a Dueño visualizar hojas de ruta sin poder subirlas
4. THE Sistema_Hojas_Ruta SHALL permitir a Usuario_Completo visualizar hojas de ruta
5. THE Sistema_Hojas_Ruta SHALL permitir a Usuario_Ingresos visualizar hojas de ruta
6. WHEN un Usuario_Egresos intenta acceder a hojas de ruta, THE Sistema_Hojas_Ruta SHALL denegar el acceso

### Requirement 4: Visualización en Folder Diario

**User Story:** Como usuario autorizado, quiero ver las hojas de ruta subidas en el folder diario, para validar las entregas del día.

#### Acceptance Criteria

1. WHEN se visualiza un Folder_Diario, THE Sistema_Hojas_Ruta SHALL mostrar una sección de hojas de ruta
2. THE Sistema_Hojas_Ruta SHALL agrupar las hojas de ruta por nombre de ruta
3. THE Sistema_Hojas_Ruta SHALL mostrar una miniatura de cada hoja de ruta
4. THE Sistema_Hojas_Ruta SHALL mostrar el nombre de la ruta asociada a cada hoja
5. THE Sistema_Hojas_Ruta SHALL mostrar la hora de carga de cada hoja
6. WHEN un usuario hace clic en una miniatura, THE Sistema_Hojas_Ruta SHALL mostrar la imagen en tamaño completo
7. THE Sistema_Hojas_Ruta SHALL permitir hacer zoom y desplazamiento en la imagen completa
8. WHERE no hay hojas de ruta subidas, THE Sistema_Hojas_Ruta SHALL mostrar un mensaje indicando que no hay hojas disponibles

### Requirement 5: Visualización en Reportes

**User Story:** Como Dueño, quiero ver las hojas de ruta en los reportes semanales, para auditar las operaciones de las rutas.

#### Acceptance Criteria

1. WHEN se genera un reporte semanal, THE Sistema_Hojas_Ruta SHALL incluir las hojas de ruta de cada día
2. THE Sistema_Hojas_Ruta SHALL agrupar las hojas de ruta por día y por ruta
3. THE Sistema_Hojas_Ruta SHALL mostrar miniaturas de las hojas en el reporte
4. WHEN se exporta un reporte a PDF, THE Sistema_Hojas_Ruta SHALL incluir las hojas de ruta como imágenes en el documento
5. THE Sistema_Hojas_Ruta SHALL mantener la legibilidad de las hojas de ruta en el PDF exportado

### Requirement 6: Relación con Ingresos de Rutas

**User Story:** Como usuario de validación, quiero ver la hoja de ruta junto con los ingresos de esa ruta, para verificar que coincidan los montos.

#### Acceptance Criteria

1. WHEN se visualizan los ingresos de una ruta específica, THE Sistema_Hojas_Ruta SHALL mostrar la hoja de ruta asociada si existe
2. THE Sistema_Hojas_Ruta SHALL calcular el total de ingresos registrados para cada ruta en el día
3. THE Sistema_Hojas_Ruta SHALL mostrar el total calculado junto a la hoja de ruta para facilitar comparación
4. WHERE una ruta tiene ingresos pero no tiene hoja de ruta, THE Sistema_Hojas_Ruta SHALL mostrar una advertencia visual
5. WHERE una ruta tiene hoja de ruta pero no tiene ingresos, THE Sistema_Hojas_Ruta SHALL mostrar una advertencia visual

### Requirement 7: Carga en Cualquier Momento del Día

**User Story:** Como empleado de ruta, quiero poder subir la hoja de ruta en cualquier momento del horario laboral, para registrar la evidencia cuando termine mi jornada.

#### Acceptance Criteria

1. THE Sistema_Hojas_Ruta SHALL permitir subir hojas de ruta en cualquier hora del día laboral
2. WHILE el Folder_Diario está abierto, THE Sistema_Hojas_Ruta SHALL permitir subir hojas de ruta
3. WHEN el Folder_Diario está cerrado, THE Sistema_Hojas_Ruta SHALL rechazar la carga de nuevas hojas
4. WHEN se rechaza una carga por folder cerrado, THE Sistema_Hojas_Ruta SHALL mostrar un mensaje indicando que el día está cerrado

### Requirement 8: Almacenamiento y Persistencia

**User Story:** Como administrador del sistema, quiero que las hojas de ruta se almacenen de forma segura y permanente, para mantener el historial de evidencias.

#### Acceptance Criteria

1. THE Sistema_Hojas_Ruta SHALL almacenar las imágenes en Supabase Storage
2. THE Sistema_Hojas_Ruta SHALL organizar las imágenes en carpetas por fecha laboral
3. THE Sistema_Hojas_Ruta SHALL generar nombres únicos para cada archivo usando UUID
4. THE Sistema_Hojas_Ruta SHALL almacenar metadatos de cada hoja en la base de datos (ruta, fecha, usuario, tamaño)
5. WHEN se elimina un Folder_Diario, THE Sistema_Hojas_Ruta SHALL mantener las hojas de ruta asociadas
6. THE Sistema_Hojas_Ruta SHALL aplicar políticas RLS para proteger el acceso a las imágenes

### Requirement 9: Soporte Offline

**User Story:** Como empleado de ruta, quiero poder subir hojas de ruta sin conexión a internet, para que se sincronicen automáticamente cuando recupere la conexión.

#### Acceptance Criteria

1. WHEN no hay conexión a internet, THE Sistema_Hojas_Ruta SHALL permitir seleccionar y preparar la hoja de ruta
2. WHEN no hay conexión a internet, THE Sistema_Hojas_Ruta SHALL almacenar la imagen localmente en IndexedDB
3. WHEN no hay conexión a internet, THE Sistema_Hojas_Ruta SHALL marcar la hoja como pendiente de sincronización
4. WHEN se recupera la conexión, THE Sistema_Hojas_Ruta SHALL sincronizar automáticamente las hojas pendientes
5. WHEN la sincronización es exitosa, THE Sistema_Hojas_Ruta SHALL eliminar la copia local
6. WHEN la sincronización falla, THE Sistema_Hojas_Ruta SHALL reintentar con backoff exponencial
7. THE Sistema_Hojas_Ruta SHALL mostrar un indicador visual de hojas pendientes de sincronización

### Requirement 10: Validación de Integridad

**User Story:** Como auditor, quiero que el sistema valide la integridad de las hojas de ruta, para detectar posibles inconsistencias.

#### Acceptance Criteria

1. WHEN se sube una hoja de ruta, THE Sistema_Hojas_Ruta SHALL registrar la fecha y hora exacta de carga
2. WHEN se sube una hoja de ruta, THE Sistema_Hojas_Ruta SHALL registrar el usuario que la subió
3. THE Sistema_Hojas_Ruta SHALL generar un hash SHA-256 de cada imagen para verificar integridad
4. THE Sistema_Hojas_Ruta SHALL almacenar el hash en la base de datos
5. WHEN se accede a una hoja de ruta, THE Sistema_Hojas_Ruta SHALL verificar que el hash coincida
6. IF el hash no coincide, THEN THE Sistema_Hojas_Ruta SHALL mostrar una advertencia de posible corrupción
