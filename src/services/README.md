# Servicios Multi-Tenant Platform

Este directorio contiene los servicios TypeScript para la gestión de la plataforma multi-tenant.

## Servicios Implementados

### TenantService
Gestión de empresas (tenants) en la plataforma.

**Métodos principales:**
- `createEmpresa(data)`: Crea una nueva empresa
- `updateEmpresa(id, data)`: Actualiza datos de una empresa
- `deactivateEmpresa(id)`: Desactiva una empresa
- `reactivateEmpresa(id)`: Reactiva una empresa
- `getEmpresaStats(id)`: Obtiene estadísticas de una empresa
- `switchContext(empresaId)`: Cambia contexto para Super Admin
- `getAllEmpresas()`: Lista todas las empresas
- `getEmpresaById(id)`: Obtiene una empresa por ID

**Ejemplo de uso:**
```typescript
import { tenantService } from './services';

// Crear empresa
const empresa = await tenantService.createEmpresa({
  nombre: 'Mi Empresa',
  nivel_automatizacion: 'parcial',
  limite_storage_mb: 2000
});

// Obtener estadísticas
const stats = await tenantService.getEmpresaStats(empresa.id);
console.log(`Usuarios: ${stats.total_usuarios}`);
console.log(`Storage: ${stats.storage_usado_mb} MB`);
```

### UserService
Gestión de usuarios con asociación a empresas.

**Métodos principales:**
- `createUser(data)`: Crea un nuevo usuario asociado a una empresa
- `updateUserRole(userId, rol)`: Actualiza el rol de un usuario
- `deactivateUser(userId)`: Desactiva un usuario
- `reactivateUser(userId)`: Reactiva un usuario
- `getUsersByEmpresa(empresaId)`: Lista usuarios de una empresa
- `validateUserAccess(userId, empresaId)`: Valida acceso de usuario a empresa
- `getUserById(userId)`: Obtiene perfil de usuario por ID
- `getCurrentUser()`: Obtiene perfil del usuario autenticado
- `isSuperAdmin()`: Verifica si el usuario actual es Super Admin

**Ejemplo de uso:**
```typescript
import { userService } from './services';

// Crear usuario
const usuario = await userService.createUser({
  email: 'usuario@ejemplo.com',
  password: 'password123',
  nombre: 'Juan Pérez',
  rol: 'Usuario_Completo',
  empresa_id: 'uuid-empresa'
});

// Listar usuarios de empresa
const usuarios = await userService.getUsersByEmpresa('uuid-empresa');
```

### StorageService
Gestión de archivos con aislamiento por tenant.

**Métodos principales:**
- `uploadFile(empresaId, file, path)`: Sube un archivo con prefijo de empresa
- `getFileUrl(empresaId, path)`: Obtiene URL pública de un archivo
- `deleteFile(empresaId, path)`: Elimina un archivo
- `getStorageUsage(empresaId)`: Calcula uso de storage en MB
- `validateStorageLimit(empresaId, fileSize)`: Valida límite de storage
- `listFiles(empresaId, folder?)`: Lista archivos de una empresa
- `getStorageStatsByType(empresaId)`: Estadísticas por tipo de archivo
- `downloadFile(empresaId, path)`: Descarga un archivo

**Ejemplo de uso:**
```typescript
import { storageService } from './services';

// Subir archivo
const url = await storageService.uploadFile(
  'uuid-empresa',
  file,
  'evidencias/foto.jpg'
);

// Verificar uso de storage
const usoMb = await storageService.getStorageUsage('uuid-empresa');
console.log(`Uso actual: ${usoMb} MB`);
```

## Aislamiento Multi-Tenant

Todos los servicios implementan aislamiento de datos por empresa:

1. **TenantService**: Gestiona empresas y sus configuraciones
2. **UserService**: Asocia usuarios a empresas mediante `empresa_id`
3. **StorageService**: Usa prefijo `{empresa_id}/` en rutas de archivos

## Seguridad

- Los servicios validan permisos antes de operaciones críticas
- Super Admin tiene acceso cross-tenant
- Usuarios regulares solo acceden a datos de su empresa
- RLS en base de datos proporciona capa adicional de seguridad

## Integración con Supabase

Todos los servicios usan el cliente de Supabase configurado en `src/lib/supabase.ts`:

```typescript
import { supabase } from '../lib/supabase';
```

## Manejo de Errores

Los servicios lanzan excepciones con mensajes descriptivos:

```typescript
try {
  await tenantService.createEmpresa(data);
} catch (error) {
  console.error('Error al crear empresa:', error.message);
}
```

## Testing

Para probar los servicios, asegúrate de:

1. Tener las variables de entorno configuradas (`.env`)
2. Tener las tablas de base de datos creadas (Tasks 1-4)
3. Tener las políticas RLS activas

### RouteService
Gestión de hojas de ruta digitales (Automatización Completa).

**Métodos principales:**
- `createHojaRuta(data)`: Crea una nueva hoja de ruta con facturas
- `addFactura(hojaRutaId, factura)`: Agrega una factura a una hoja de ruta
- `markFacturaEntregada(facturaId)`: Marca una factura como entregada
- `markFacturaCobrada(facturaId, input)`: Marca una factura como cobrada con monto
- `registerGasto(hojaRutaId, gasto)`: Registra un gasto en la ruta
- `calculateBalance(hojaRutaId)`: Calcula balance automático de la ruta
- `closeRuta(hojaRutaId, input)`: Cierra una ruta y crea registro en folder_diario
- `getHojaRutaById(hojaRutaId)`: Obtiene hoja de ruta con facturas, gastos y balance
- `getHojasRutaByEmpleado(empleadoId)`: Lista hojas de ruta de un empleado
- `getAllHojasRuta()`: Lista todas las hojas de ruta de la empresa

**Ejemplo de uso:**
```typescript
import { routeService } from './services';

// Crear hoja de ruta
const hojaRuta = await routeService.createHojaRuta({
  empleado_id: 'uuid-empleado',
  ruta_id: 'uuid-ruta',
  fecha: '2024-03-20',
  monto_asignado_rdp: 5000,
  facturas: [
    { numero: 'F001', monto: 10000, moneda: 'RD$', estado_pago: 'pagada' },
    { numero: 'F002', monto: 500, moneda: 'USD', estado_pago: 'pendiente' }
  ]
});

// Registrar gasto
await routeService.registerGasto(hojaRuta.id, {
  tipo: 'combustible',
  monto: 1500,
  moneda: 'RD$',
  evidencia_requerida: true,
  evidencia_id: 'uuid-evidencia'
});

// Calcular balance
const balance = await routeService.calculateBalance(hojaRuta.id);
console.log(`Disponible RD$: ${balance.dinero_disponible_rdp}`);
console.log(`Disponible USD: ${balance.dinero_disponible_usd}`);

// Cerrar ruta
await routeService.closeRuta(hojaRuta.id, {
  monto_fisico_rdp: 13500,
  monto_fisico_usd: 500
});
```

**Características:**
- Generación automática de identificador único (formato: "Empleado Ruta Fecha")
- Cálculo automático de balance en tiempo real
- Soporte multi-moneda (RD$ y USD)
- Validación de evidencias para gastos específicos
- Creación automática de registros en folder_diario al cerrar
- Prevención de modificaciones a hojas cerradas

### AuditService
Gestión de logs de auditoría para trazabilidad y seguridad.

**Métodos principales:**
- `logAction(input)`: Registra una acción en el log
- `logSecurityViolation(recurso, detalles)`: Registra violación de seguridad
- `getAuditLogs(filters, limit, offset)`: Obtiene logs con filtros
- `exportAuditLogs(filters)`: Exporta logs en formato CSV
- `getAuditStats(empresaId, dias)`: Obtiene estadísticas de auditoría
- `getUserRecentLogs(usuarioId, limit)`: Logs recientes de un usuario
- `logLogin(exitoso, detalles)`: Registra inicio de sesión
- `logLogout()`: Registra cierre de sesión
- `logCreate(recurso, detalles)`: Registra creación de recurso
- `logUpdate(recurso, detalles)`: Registra actualización de recurso
- `logDelete(recurso, detalles)`: Registra eliminación de recurso
- `logAutomationLevelChange(empresaId, nivelAnterior, nivelNuevo)`: Registra cambio de nivel
- `logRutaClosure(hojaRutaId, detalles)`: Registra cierre de ruta

**Ejemplo de uso:**
```typescript
import { auditService } from './services';

// Registrar acción personalizada
await auditService.logAction({
  accion: 'CREATE',
  recurso: 'hoja_ruta',
  detalles: { hoja_ruta_id: 'uuid' },
  exitoso: true
});

// Registrar violación de seguridad
await auditService.logSecurityViolation('hoja_ruta', {
  intento: 'acceso_no_autorizado',
  hoja_ruta_id: 'uuid'
});

// Obtener logs con filtros
const logs = await auditService.getAuditLogs({
  empresa_id: 'uuid-empresa',
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-12-31',
  accion: 'CREATE'
});

// Exportar logs a CSV
const csv = await auditService.exportAuditLogs({
  empresa_id: 'uuid-empresa'
});

// Obtener estadísticas
const stats = await auditService.getAuditStats('uuid-empresa', 30);
console.log(`Total acciones: ${stats.total_acciones}`);
console.log(`Violaciones: ${stats.violaciones_seguridad}`);
```

**Características:**
- Registro automático de empresa_id y usuario_id
- Captura de user agent para trazabilidad
- Filtros avanzados por empresa, usuario, fecha, acción
- Exportación a CSV para análisis externo
- Estadísticas agregadas por período
- Métodos helper para acciones comunes
- No interrumpe flujo principal si falla el registro

## Próximos Pasos

Ver Tasks 7-9 para implementación de componentes React:
- Componentes para Super Admin
- Componentes para hojas de ruta digitales
- Sistema de permisos por rol
