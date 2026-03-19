# Plan de Implementación: Cuadre Automático

## Visión General

Implementación incremental de la PWA "Cuadre Automático" usando React + Vite en el frontend, Supabase como backend (PostgreSQL + Auth + Storage + Realtime) y TypeScript en toda la pila. Las tareas siguen el orden: infraestructura base → autenticación → datos y catálogos → registros → balances → dashboard → notificaciones → exportación → PWA/offline.

## Tareas

- [x] 1. Configurar estructura del proyecto y dependencias base
  - Inicializar proyecto React + Vite con TypeScript y configurar Tailwind CSS + shadcn/ui
  - Instalar y configurar dependencias: Zustand, Dexie.js, Workbox, jsPDF, SheetJS, fast-check
  - Configurar cliente Supabase con variables de entorno
  - Definir todas las interfaces TypeScript del diseño (`Registro`, `FolderDiario`, `SemanaLaboral`, `Deposito`, `Evidencia`)
  - _Requisitos: 10.1, 10.5, 10.6_

- [x] 2. Configurar esquema de base de datos en Supabase
  - [x] 2.1 Crear tablas PostgreSQL según el esquema del diseño
    - Crear tablas: `perfiles`, `empleados`, `rutas`, `conceptos`, `semanas_laborales`, `folders_diarios`, `registros`, `evidencias`, `depositos`
    - Aplicar constraints, checks y columnas generadas (`balance_diario`, `balance_neto`, `saldo_disponible`)
    - _Requisitos: 5.1, 5.3, 15.3_
  - [x] 2.2 Implementar triggers PostgreSQL para cálculo automático
    - Crear `trg_recalcular_folder` (INSERT/UPDATE/DELETE en `registros`)
    - Crear `trg_recalcular_semana_desde_folder` (UPDATE en `folders_diarios`)
    - Crear `trg_recalcular_saldo_deposito` (INSERT/UPDATE/DELETE en `depositos`)
    - _Requisitos: 2.7, 3.7, 5.2, 5.4, 15.4_
  - [x] 2.3 Configurar Row Level Security (RLS) en Supabase
    - Políticas por rol para cada tabla según permisos del diseño
    - _Requisitos: 1.2, 1.3, 12.7_

- [x] 3. Implementar módulo de autenticación
  - [x] 3.1 Crear flujo de login con Supabase Auth
    - Componente `LoginForm` con campos usuario/contraseña
    - Lógica de bloqueo tras 3 intentos fallidos (15 minutos) y notificación al Dueño
    - Sesión activa por 8 horas de inactividad
    - `AuthGuard` para proteger rutas según rol
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 3.2 Escribir prueba de propiedad: Unicidad de rol por usuario
    - **Propiedad 1: Unicidad de rol por usuario**
    - **Valida: Requisito 1.2**
  - [ ]* 3.3 Escribir prueba de propiedad: Control de acceso por rol
    - **Propiedad 2: Control de acceso por rol**
    - **Valida: Requisitos 1.3, 12.7**
  - [ ]* 3.4 Escribir pruebas unitarias para flujo de bloqueo por intentos fallidos
    - Verificar bloqueo exactamente al tercer intento
    - Verificar desbloqueo tras 15 minutos
    - _Requisitos: 1.4_

- [x] 4. Implementar gestión de catálogos (Empleados, Rutas, Conceptos)
  - [x] 4.1 Crear CRUD de catálogos con validación de unicidad
    - Componente `GestionCatalogo` reutilizable para los tres catálogos
    - Componente `SelectorCatalogo` con búsqueda en tiempo real y opción de concepto manual
    - Validar unicidad antes de persistir; rechazar duplicados con mensaje descriptivo
    - Solo el Dueño puede editar/eliminar entradas
    - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  - [ ]* 4.2 Escribir prueba de propiedad: Unicidad en catálogos
    - **Propiedad 13: Unicidad en catálogos**
    - **Valida: Requisito 12.5**
  - [ ]* 4.3 Escribir pruebas unitarias para búsqueda y filtrado en catálogos
    - Verificar filtrado en tiempo real por texto
    - Verificar rechazo de duplicados
    - _Requisitos: 12.4, 12.5_

- [x] 5. Implementar gestión de Folders Diarios y Regla del Lunes
  - [x] 5.1 Crear lógica de Folder_Diario y Regla del Lunes
    - Función `obtenerFechaLaboral(fecha: Date): string` que aplica la Regla del Lunes
    - Creación automática de Folder_Diario al inicio de jornada
    - Lógica de cierre de folder (solo Dueño) e inmutabilidad post-cierre
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 5.2 Escribir prueba de propiedad: Regla del Lunes
    - **Propiedad 10: Regla del Lunes**
    - **Valida: Requisito 4.2**
  - [ ]* 5.3 Escribir prueba de propiedad: Inmutabilidad de Folder cerrado
    - **Propiedad 11: Inmutabilidad de Folder cerrado**
    - **Valida: Requisitos 4.5, 4.6**
  - [ ]* 5.4 Escribir pruebas unitarias para la Regla del Lunes con fechas concretas
    - Verificar casos específicos: lunes → sábado anterior, martes-sábado → mismo día
    - _Requisitos: 4.2_

- [x] 6. Implementar registro de ingresos y egresos
  - [x] 6.1 Crear componente `FormularioRegistro` con validaciones
    - Campos: Concepto (catálogo + manual), Empleado, Ruta, Monto, Evidencia
    - Validar monto > 0; rechazar con mensaje descriptivo si no cumple
    - Asociar registro al Folder_Diario de la fecha laboral activa
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.6_
  - [ ]* 6.2 Escribir prueba de propiedad: Validación de monto positivo
    - **Propiedad 6: Validación de monto positivo**
    - **Valida: Requisitos 2.6, 3.6, 15.10**
  - [ ]* 6.3 Escribir prueba de propiedad: Validación de campos requeridos
    - **Propiedad 4: Validación de campos requeridos en registro**
    - **Valida: Requisitos 2.2, 3.2**
  - [ ]* 6.4 Escribir prueba de propiedad: Asociación de registro al folder activo
    - **Propiedad 3: Asociación de registro al folder activo**
    - **Valida: Requisitos 2.1, 3.1**

- [x] 7. Implementar carga y validación de evidencias
  - [x] 7.1 Crear componente `UploaderEvidencia` con validaciones y previsualizaciones
    - Aceptar JPG, PNG, PDF; rechazar otros tipos con mensaje descriptivo
    - Rechazar archivos > 10 MB con mensaje descriptivo
    - Limitar a 5 evidencias por registro; rechazar el sexto intento
    - Generar miniatura para JPG/PNG; mostrar ícono para PDF
    - Opción de captura directa con cámara del dispositivo
    - Subir archivos a Supabase Storage
    - _Requisitos: 2.5, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 7.2 Escribir prueba de propiedad: Validación de evidencias adjuntas
    - **Propiedad 5: Validación de evidencias adjuntas**
    - **Valida: Requisitos 2.5, 3.5, 7.4**
  - [ ]* 7.3 Escribir prueba de propiedad: Límite de evidencias por registro
    - **Propiedad 12: Límite de evidencias por registro**
    - **Valida: Requisito 7.1**

- [ ] 8. Checkpoint — Verificar que todas las pruebas pasen
  - Asegurar que todas las pruebas unitarias y de propiedades implementadas hasta aquí pasen. Consultar al usuario si surgen dudas.

- [x] 9. Implementar cálculo automático de balances
  - [x] 9.1 Verificar y conectar triggers con la UI en tiempo real
    - Suscribirse a cambios de Supabase Realtime en `folders_diarios` y `semanas_laborales`
    - Actualizar estado de Zustand al recibir cambios (< 2 segundos)
    - Mostrar balance positivo/negativo/cero con representación visual diferenciada
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 9.2 Escribir prueba de propiedad: Invariante del Balance_Diario
    - **Propiedad 7: Invariante del Balance_Diario**
    - **Valida: Requisitos 5.1, 2.7, 3.7**
  - [ ]* 9.3 Escribir prueba de propiedad: Invariante del Balance Semanal
    - **Propiedad 8: Invariante del Balance Semanal**
    - **Valida: Requisitos 5.3, 5.4**
  - [ ]* 9.4 Escribir prueba de propiedad: Clasificación correcta del balance
    - **Propiedad 16: Clasificación correcta del balance**
    - **Valida: Requisito 5.5**

- [x] 10. Implementar registro y seguimiento de depósitos
  - [x] 10.1 Crear módulo de depósitos con cálculo de Saldo_Disponible
    - Componente `FormularioDeposito` con campos: monto, fecha, banco (opcional), nota (opcional), evidencia (opcional)
    - Validar monto > 0
    - Mostrar historial de depósitos agrupados por Semana_Laboral
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.10_
  - [ ]* 10.2 Escribir prueba de propiedad: Invariante del Saldo_Disponible
    - **Propiedad 9: Invariante del Saldo_Disponible**
    - **Valida: Requisitos 15.3, 15.4**

- [x] 11. Implementar Dashboard del Dueño
  - [x] 11.1 Crear vista `DashboardDueno` con datos en tiempo real
    - Mostrar Balance_Diario de cada día de la Semana_Laboral activa
    - Mostrar total consolidado del Reporte_Semanal, total depositado y Saldo_Disponible
    - Desglose de ingresos/egresos por tipo para cada Folder_Diario
    - Navegación entre Semanas_Laborales históricas
    - Interfaz responsive para móvil
    - Suscripción a Supabase Realtime para reflejar cambios en < 5 segundos
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 15.5, 15.6_
  - [ ]* 11.2 Escribir pruebas unitarias para navegación entre semanas históricas
    - Verificar carga correcta de datos históricos
    - _Requisitos: 6.5_

- [x] 12. Implementar exportación de reportes en PDF y XLSX
  - [x] 12.1 Crear módulo `exportador` con jsPDF y SheetJS
    - Función `exportarPDF(datos, periodo)`: tabla con encabezados, registros, totales y sección de depósitos/Saldo_Disponible
    - Función `exportarXLSX(datos, periodo)`: columnas individuales, una fila por registro, totales al final
    - Incluir campos: Concepto, Empleado, Ruta, Monto, Fecha, Balance_Diario, balance neto, depósitos, Saldo_Disponible
    - Exportación filtrada por rol (Dueño: todo; Usuario_Ingresos: solo ingresos; Usuario_Egresos: solo egresos)
    - Mostrar mensaje descriptivo si falla la generación
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 15.8_
  - [ ]* 12.2 Escribir prueba de propiedad: Completitud del archivo exportado
    - **Propiedad 15: Completitud del archivo exportado**
    - **Valida: Requisitos 13.1, 13.5, 13.6, 13.7, 15.8**

- [x] 13. Implementar módulo Notificador (correo y WhatsApp)
  - [x] 13.1 Crear Edge Function `notificador` en Supabase
    - Envío de correo con Resend: formato HTML (tabla legible) y texto plano como alternativa
    - Envío de WhatsApp con Twilio/Meta Cloud API: resumen con Balance_Diario, totales, depósitos y Saldo_Disponible
    - Lógica de reintento de correo: hasta 3 veces con intervalos de 5 minutos; registrar error en log
    - Fallo de WhatsApp: registrar error y notificar al Dueño por correo como respaldo
    - Reenvío manual del Reporte_Semanal de semanas anteriores desde el Dashboard
    - _Requisitos: 8.1, 8.2, 8.4, 8.5, 8.6, 9.1, 9.2, 9.4, 9.5, 15.9_
  - [ ]* 13.2 Escribir prueba de propiedad: Completitud del contenido del reporte
    - **Propiedad 14: Completitud del contenido del reporte**
    - **Valida: Requisitos 8.2, 9.2, 15.9**
  - [ ]* 13.3 Escribir pruebas unitarias para envío de correo y WhatsApp con mocks
    - Verificar lógica de reintento (3 intentos, intervalos de 5 min)
    - Verificar notificación por correo cuando falla WhatsApp
    - _Requisitos: 8.4, 9.4_

- [x] 14. Implementar botón "Enviar Reporte" y flujo de envío rápido
  - [x] 14.1 Crear componente `BotonEnviarReporte` y conectar con notificador
    - Mostrar botón en vista de Folder_Diario activo y Semana_Laboral activa (solo Usuario_Ingresos)
    - Al presionar: generar PDF y XLSX, enviar por correo y WhatsApp al Dueño
    - Mostrar confirmación visual si ambos canales tienen éxito
    - Mostrar qué canal falló y ofrecer botón de reintento solo para ese canal
    - Incluir evidencias si el Dueño tiene habilitada esa opción
    - _Requisitos: 8.3, 8.7, 9.3, 9.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 15. Checkpoint — Verificar que todas las pruebas pasen
  - Asegurar que todas las pruebas unitarias y de propiedades implementadas hasta aquí pasen. Consultar al usuario si surgen dudas.

- [x] 16. Implementar funcionalidad PWA y modo offline
  - [x] 16.1 Configurar Service Worker con Workbox y esquema IndexedDB con Dexie.js
    - Cache de assets con Workbox para carga < 3 segundos en 4G
    - Esquema IndexedDB: `registros_pendientes`, `folders_cache`, `catalogos_cache`, `evidencias_pendientes`
    - Mantener catálogos sincronizados localmente para selección offline
    - _Requisitos: 10.1, 10.2, 10.5, 10.6, 12.8_
  - [x] 16.2 Implementar sincronización automática al recuperar conexión
    - Detectar evento `online` en Service Worker
    - Leer `registros_pendientes` de IndexedDB y enviar al servidor
    - Detectar conflictos y presentar al usuario las dos versiones (local vs. servidor) para resolución manual
    - Marcar registros como sincronizados tras éxito
    - _Requisitos: 10.3, 10.4_
  - [x] 16.3 Implementar inicio de sesión offline con credenciales en caché
    - Almacenar credenciales de forma segura en almacenamiento local del dispositivo
    - Permitir autenticación sin conexión cuando el dispositivo lo soporta
    - _Requisitos: 1.6_

- [x] 17. Checkpoint final — Verificar que todas las pruebas pasen
  - Asegurar que todas las pruebas unitarias y de propiedades pasen. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental antes de avanzar
- Las pruebas de propiedades usan `fast-check` con mínimo 100 iteraciones por prueba
- Las pruebas unitarias complementan las de propiedades con casos concretos y condiciones de error
