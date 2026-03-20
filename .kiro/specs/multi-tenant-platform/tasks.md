# Implementation Plan: Multi-Tenant Platform

## Overview

Este plan implementa la transformación del sistema actual de cuadre automático en una plataforma SaaS multi-tenant. La implementación se divide en fases incrementales: primero la infraestructura multi-tenant base, luego la migración de datos existentes, después las funcionalidades de automatización completa (hojas de ruta digitales), y finalmente las capacidades administrativas del Super Admin.

## Tasks

- [x] 1. Crear infraestructura de base de datos multi-tenant
  - [x] 1.1 Crear tabla empresas y tipos de datos base
    - Crear tabla `empresas` con campos: id, nombre, nivel_automatizacion, logo_url, activa, limite_storage_mb, timestamps
    - Crear tipo ENUM para nivel_automatizacion ('parcial', 'completa')
    - Crear índices necesarios
    - _Requirements: 1.2, 1.3, 2.1_
  
  - [x] 1.2 Agregar columna empresa_id a todas las tablas existentes
    - Agregar columna `empresa_id UUID REFERENCES empresas(id)` a: perfiles, empleados, rutas, conceptos, semanas_laborales, folders_diarios, registros, depositos, evidencias
    - Crear índices en empresa_id para todas las tablas modificadas
    - _Requirements: 2.1, 2.2_
  
  - [x] 1.3 Actualizar constraints de unicidad para incluir empresa_id
    - Modificar constraint de empleados para UNIQUE(empresa_id, nombre, apellido)
    - Modificar constraint de rutas para UNIQUE(empresa_id, nombre)
    - Modificar constraint de conceptos para UNIQUE(empresa_id, descripcion)
    - Modificar constraint de folders_diarios para UNIQUE(empresa_id, fecha_laboral)
    - _Requirements: 2.6_
  
  - [x] 1.4 Actualizar roles en tabla perfiles
    - Modificar check constraint de rol para incluir: 'Super_Admin', 'Encargado_Almacén', 'Secretaria', 'Empleado_Ruta'
    - Mantener roles existentes: 'Usuario_Ingresos', 'Usuario_Egresos', 'Usuario_Completo', 'Dueño'
    - _Requirements: 5.1-5.4, 6.1-6.3_

- [x] 2. Implementar Row Level Security (RLS) multi-tenant
  - [x] 2.1 Crear políticas RLS base para aislamiento por empresa_id
    - Crear política SELECT que filtre por empresa_id del usuario autenticado
    - Crear política INSERT que valide empresa_id del usuario
    - Crear política UPDATE que valide empresa_id original
    - Crear política DELETE que valide empresa_id
    - Aplicar a tablas: perfiles, empleados, rutas, conceptos, semanas_laborales, folders_diarios, registros, depositos, evidencias
    - _Requirements: 2.2, 2.3, 19.1-19.3_
  
  - [x] 2.2 Crear políticas RLS especiales para Super_Admin
    - Crear función helper `is_super_admin()` que valide rol del usuario
    - Crear políticas que permitan a Super_Admin acceso cross-tenant con filtro opcional
    - Aplicar a tabla empresas para gestión completa
    - _Requirements: 2.7, 14.4_
  
  - [x] 2.3 Implementar políticas de Storage con aislamiento por empresa_id
    - Crear política de Storage SELECT que valide prefijo empresa_id/
    - Crear política de Storage INSERT que valide prefijo empresa_id/
    - Crear política de Storage DELETE que valide prefijo empresa_id/
    - _Requirements: 2.4, 2.5, 19.4_

- [x] 3. Crear tablas para automatización completa
  - [x] 3.1 Crear tabla hojas_ruta
    - Crear tabla con campos: id, empresa_id, empleado_id, ruta_id, fecha, identificador, monto_asignado_rdp, estado, cerrada_por, cerrada_en, timestamps
    - Crear constraint UNIQUE(empresa_id, identificador)
    - Crear índices en empresa_id, empleado_id, estado
    - Aplicar políticas RLS
    - _Requirements: 7.4, 7.9_
  
  - [x] 3.2 Crear tabla facturas_ruta
    - Crear tabla con campos: id, hoja_ruta_id, numero, monto, moneda, estado_pago, estado_entrega, monto_cobrado, moneda_cobrada, entregada_en, cobrada_en, timestamps
    - Crear constraint CHECK para moneda IN ('RD$', 'USD')
    - Crear índice en hoja_ruta_id
    - Aplicar políticas RLS heredadas de hoja_ruta
    - _Requirements: 7.5, 7.6, 20.1_
  
  - [x] 3.3 Crear tabla gastos_ruta
    - Crear tabla con campos: id, hoja_ruta_id, tipo, descripcion, monto, moneda, evidencia_requerida, evidencia_id, registrado_en, created_at
    - Crear constraint CHECK para tipo IN ('fijo', 'peaje', 'combustible', 'inesperado')
    - Crear constraint CHECK para moneda IN ('RD$', 'USD')
    - Crear índice en hoja_ruta_id
    - Aplicar políticas RLS heredadas de hoja_ruta
    - _Requirements: 8.5, 8.6, 8.7, 20.2_
  
  - [x] 3.4 Crear tabla balance_ruta_historico
    - Crear tabla con campos: id, hoja_ruta_id, total_facturas_rdp, total_facturas_usd, total_gastos_rdp, total_gastos_usd, dinero_disponible_rdp, dinero_disponible_usd, timestamp
    - Crear índice en hoja_ruta_id y timestamp
    - Aplicar políticas RLS heredadas de hoja_ruta
    - _Requirements: 9.8_
  
  - [x] 3.5 Crear tabla audit_logs
    - Crear tabla con campos: id, empresa_id, usuario_id, accion, recurso, detalles (JSONB), ip_address, user_agent, exitoso, created_at
    - Crear índices en empresa_id, usuario_id, created_at
    - Aplicar políticas RLS que permitan solo lectura a Super_Admin
    - _Requirements: 15.1-15.6_

- [x] 4. Checkpoint - Validar estructura de base de datos
  - Ejecutar script de migración en ambiente de desarrollo
  - Verificar que todas las tablas se crearon correctamente
  - Verificar que todas las políticas RLS están activas
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar servicios TypeScript para gestión de empresas
  - [x] 5.1 Crear tipos TypeScript para entidades multi-tenant
    - Crear interfaces: Empresa, HojaRuta, FacturaRuta, GastoRuta, BalanceRuta, AuditLog
    - Actualizar interface Perfil para incluir empresa_id y nuevos roles
    - Crear tipos para CreateEmpresaInput, UpdateEmpresaInput, EmpresaStats
    - _Requirements: 1.2, 4.2_
  
  - [x] 5.2 Crear servicio TenantService
    - Implementar createEmpresa() con validación de datos
    - Implementar updateEmpresa() con validación de permisos
    - Implementar deactivateEmpresa() y reactivateEmpresa()
    - Implementar getEmpresaStats() con cálculo de usuarios y storage
    - Implementar switchContext() para Super_Admin
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 14.3_
  
  - [x] 5.3 Crear servicio UserService multi-tenant
    - Implementar createUser() con asociación automática a empresa
    - Implementar updateUserRole() con validación de permisos
    - Implementar deactivateUser()
    - Implementar getUsersByEmpresa() con filtro por empresa_id
    - Implementar validateUserAccess() para validación de permisos
    - _Requirements: 4.1, 4.3, 4.5, 4.6, 4.7_
  
  - [x] 5.4 Crear servicio StorageService con aislamiento por tenant
    - Implementar uploadFile() con prefijo empresa_id/
    - Implementar getFileUrl() con validación de empresa_id
    - Implementar deleteFile() con validación de permisos
    - Implementar getStorageUsage() con cálculo por empresa
    - Implementar validateStorageLimit() con verificación de límites
    - _Requirements: 2.4, 16.1, 16.4_

- [x] 6. Implementar servicios para hojas de ruta digitales
  - [x] 6.1 Crear servicio RouteService
    - Implementar createHojaRuta() con generación de identificador único
    - Implementar addFactura() para agregar facturas a hoja de ruta
    - Implementar markFacturaEntregada() con timestamp
    - Implementar markFacturaCobrada() con monto y moneda
    - Implementar registerGasto() con validación de evidencia
    - _Requirements: 7.1-7.9, 8.3-8.7_
  
  - [x] 6.2 Implementar cálculo automático de balance
    - Crear función calculateBalance() que sume facturas cobradas por moneda
    - Calcular total de gastos por moneda
    - Calcular dinero disponible como (Monto_Asignado + Cobros - Gastos)
    - Guardar snapshot en balance_ruta_historico después de cada cambio
    - _Requirements: 9.1-9.6_
  
  - [x] 6.3 Implementar cierre de ruta
    - Crear función closeRuta() que valide permisos de Usuario_Completo
    - Mostrar cálculo automático vs monto físico
    - Crear registro de ingreso automáticamente en folder_diario
    - Marcar hoja_ruta como cerrada con timestamp y usuario
    - Prevenir modificaciones a hojas cerradas mediante RLS
    - _Requirements: 10.1-10.10_
  
  - [x] 6.4 Crear servicio AuditService
    - Implementar logAction() para registrar acciones en audit_logs
    - Implementar logSecurityViolation() para intentos no autorizados
    - Implementar getAuditLogs() con filtros por empresa, usuario, fecha
    - Implementar exportAuditLogs() en formato CSV
    - _Requirements: 11.7, 15.1-15.7, 19.5_

- [x] 7. Crear componentes React para Super Admin
  - [x] 7.1 Crear componente DashboardSuperAdmin
    - Mostrar tarjetas con total de empresas activas/desactivadas
    - Mostrar lista de empresas con nombre, nivel, usuarios, storage, última actividad
    - Implementar búsqueda por nombre de empresa
    - Implementar ordenamiento por nombre, fecha, actividad
    - _Requirements: 3.1-3.8_
  
  - [x] 7.2 Crear componente FormularioEmpresa
    - Formulario para crear/editar empresa con campos: nombre, nivel_automatizacion, logo
    - Validación de campos requeridos
    - Upload de logo con preview
    - Selector de nivel de automatización con descripciones
    - _Requirements: 1.2, 1.4_
  
  - [x] 7.3 Crear componente GestionUsuariosEmpresa
    - Lista de usuarios filtrada por empresa seleccionada
    - Formulario para crear usuario con campos: nombre, email, password, rol, empresa
    - Botones para editar rol y desactivar usuarios
    - Validación de email único
    - _Requirements: 4.1-4.7_
  
  - [x] 7.4 Crear componente SelectorContextoEmpresa
    - Dropdown con lista de empresas para Super_Admin
    - Mostrar nombre de empresa actual en header
    - Cambiar contexto al seleccionar empresa
    - Opción para regresar a vista global
    - _Requirements: 14.1-14.7_

- [x] 8. Crear componentes React para hojas de ruta digitales
  - [x] 8.1 Crear componente FormularioHojaRuta
    - Selector de empleado y ruta
    - Selector de fecha
    - Generación automática de identificador
    - Lista de facturas con campos: numero, monto, moneda, estado (PA/pendiente)
    - Input para monto asignado en RD$
    - Cálculo automático de totales
    - _Requirements: 7.1-7.9_
  
  - [x] 8.2 Crear componente VistaHojaRutaEmpleado
    - Lista de facturas con checkboxes para marcar entregada/cobrada
    - Input para monto cobrado con selector de moneda
    - Formulario para registrar gastos con tipo, monto, moneda
    - Upload de foto para gastos con evidencia
    - Display de balance en tiempo real
    - _Requirements: 8.1-8.10_
  
  - [x] 8.3 Crear componente BalanceRutaTiempoReal
    - Mostrar total facturas cobradas en RD$ y USD
    - Mostrar total gastos en RD$ y USD
    - Mostrar dinero disponible por moneda
    - Actualizar automáticamente después de cada operación
    - _Requirements: 9.1-9.7, 20.3_
  
  - [x] 8.4 Crear componente CierreRuta
    - Mostrar cálculo automático de monto esperado por moneda
    - Input para monto físico contado por moneda
    - Mostrar diferencia entre calculado y físico
    - Botón de confirmación de cierre
    - Confirmación antes de cerrar
    - _Requirements: 10.1-10.10, 20.4-20.5_

- [x] 9. Implementar lógica de permisos por rol y nivel de automatización
  - [x] 9.1 Crear hook usePermissions
    - Implementar función hasPermission(action, resource) basada en rol y nivel
    - Implementar función canAccessRoute(routePath) para navegación
    - Implementar función getAvailableActions(resource) para UI dinámica
    - _Requirements: 11.1-11.7_
  
  - [x] 9.2 Crear componente ProtectedRoute
    - Validar permisos antes de renderizar ruta
    - Redirigir a página de acceso denegado si no tiene permisos
    - Registrar intento de acceso no autorizado en audit_logs
    - _Requirements: 11.7, 19.4_
  
  - [x] 9.3 Implementar interfaz adaptativa por nivel de automatización
    - Ocultar menús de hojas de ruta si nivel es 'parcial'
    - Mostrar menús de hojas de ruta si nivel es 'completa'
    - Mostrar indicador visual del nivel actual
    - Actualizar interfaz automáticamente al cambiar nivel
    - _Requirements: 18.1-18.6_

- [x] 10. Implementar migración de datos existentes
  - [x] 10.1 Crear script de migración SQL
    - Crear empresa "Empresa 1" con nivel 'parcial'
    - Actualizar todos los registros de perfiles con empresa_id de "Empresa 1"
    - Actualizar todos los registros de empleados, rutas, conceptos con empresa_id
    - Actualizar todos los registros de semanas, folders, registros, depositos, evidencias con empresa_id
    - Validar integridad referencial
    - _Requirements: 12.1-12.7_
  
  - [x] 10.2 Crear script de rollback
    - Implementar rollback completo en caso de error
    - Validar que no se pierdan datos
    - Crear backup antes de ejecutar migración
    - _Requirements: 12.8_
  
  - [x] 10.3 Ejecutar migración en producción
    - Crear backup de base de datos
    - Ejecutar script de migración
    - Validar integridad de datos
    - Verificar que usuarios existentes pueden acceder
    - _Requirements: 12.1-12.8_

- [x] 11. Checkpoint - Validar migración y funcionalidades base
  - Verificar que usuarios existentes pueden iniciar sesión
  - Verificar que datos históricos son accesibles
  - Verificar que RLS funciona correctamente
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implementar funcionalidades de administración avanzada
  - [x] 12.1 Crear componente MonitoreoStorage
    - Mostrar uso de storage por empresa en MB/GB
    - Mostrar límite configurado vs uso actual
    - Gráfico de tendencia de crecimiento
    - Formulario para ajustar límite de storage
    - _Requirements: 16.1-16.7_
  
  - [x] 12.2 Crear componente VisorAuditLogs
    - Tabla de logs con columnas: fecha, empresa, usuario, acción, recurso, resultado
    - Filtros por empresa, usuario, fecha, tipo de acción
    - Paginación de resultados
    - Botón de exportación a CSV
    - _Requirements: 15.1-15.8_
  
  - [x] 12.3 Implementar cambio de nivel de automatización
    - Crear función changeAutomationLevel() en TenantService
    - Mostrar advertencia antes de cambiar nivel
    - Registrar cambio en audit_logs
    - Notificar a usuarios de la empresa
    - Actualizar interfaz automáticamente
    - _Requirements: 13.1-13.8_

- [x] 13. Implementar sincronización offline multi-tenant
  - [x] 13.1 Actualizar servicio de sincronización para incluir empresa_id
    - Modificar sync.ts para filtrar datos por empresa_id del usuario
    - Agregar validación de empresa_id antes de sincronizar
    - Implementar detección de conflictos cross-tenant
    - Marcar registros con conflicto para revisión manual
    - _Requirements: 17.1-17.6_
  
  - [x] 13.2 Actualizar IndexedDB para multi-tenant
    - Agregar índice por empresa_id en todas las tablas locales
    - Implementar limpieza de datos al cambiar de empresa (Super_Admin)
    - Validar que solo se almacenen datos de la empresa del usuario
    - _Requirements: 17.2, 17.4_

- [x] 14. Implementar validaciones de seguridad multi-tenant
  - [x] 14.1 Crear middleware de validación de empresa_id
    - Validar que todas las queries incluyan filtro por empresa_id
    - Validar que todas las inserciones incluyan empresa_id del usuario
    - Validar que actualizaciones no cambien empresa_id
    - Bloquear operaciones cross-tenant no autorizadas
    - _Requirements: 19.1-19.4_
  
  - [x] 14.2 Implementar auditoría de seguridad
    - Registrar todos los intentos de acceso cross-tenant
    - Registrar violaciones de RLS
    - Crear alertas para Super_Admin sobre violaciones
    - Implementar validación periódica de integridad
    - _Requirements: 19.5-19.7_

- [x] 15. Crear documentación y guías de usuario
  - [x] 15.1 Crear guía para Super Admin
    - Documentar cómo crear empresas
    - Documentar cómo gestionar usuarios
    - Documentar cómo cambiar nivel de automatización
    - Documentar cómo monitorear storage y logs
  
  - [x] 15.2 Crear guía para automatización completa
    - Documentar flujo de creación de hoja de ruta
    - Documentar flujo de ejecución de ruta por empleado
    - Documentar flujo de cierre de ruta
    - Documentar manejo de múltiples monedas

- [ ] 16. Testing y validación final
  - [ ]* 16.1 Escribir tests de integración para multi-tenancy
    - Test de aislamiento de datos entre empresas
    - Test de permisos de Super_Admin
    - Test de cambio de contexto
    - Test de sincronización offline multi-tenant
  
  - [ ]* 16.2 Escribir tests para hojas de ruta digitales
    - Test de creación de hoja de ruta
    - Test de registro de entregas y cobros
    - Test de cálculo de balance
    - Test de cierre de ruta
  
  - [ ]* 16.3 Escribir tests de seguridad
    - Test de intentos de acceso cross-tenant
    - Test de validación de RLS
    - Test de políticas de Storage
    - Test de auditoría de accesos

- [ ] 17. Checkpoint final - Validación completa del sistema
  - Ejecutar todos los tests de integración
  - Validar que no existan fugas de datos entre empresas
  - Validar que todos los roles tienen permisos correctos
  - Validar que la migración de datos fue exitosa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- La implementación sigue un enfoque incremental: primero la infraestructura base, luego migración, después funcionalidades avanzadas
- El sistema mantiene compatibilidad con el código existente mediante la migración a "Empresa 1"
- Las políticas RLS garantizan aislamiento de datos a nivel de base de datos
- El soporte multi-moneda (RD$ y USD) está integrado en todas las funcionalidades de hojas de ruta
