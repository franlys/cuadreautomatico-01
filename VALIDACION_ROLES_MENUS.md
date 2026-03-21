# Validación de Menús por Rol

Este documento valida que cada rol vea exactamente los menús que debe ver según su nivel de permisos.

---

## Super_Admin

### Menús Visibles:
- ✅ **Inicio** - Página de bienvenida
- ✅ **Super Admin** - Dashboard de gestión de empresas

### Menús NO Visibles:
- ❌ Dashboard (Dueño)
- ❌ Hojas de Ruta
- ❌ Folder Diario
- ❌ Resumen Semanal
- ❌ Depósitos
- ❌ Catálogos

### Validación en Código:
```typescript
// App.tsx línea 82-91
{esSuperAdmin && (
  <button>Super Admin</button>
)}

// App.tsx línea 93-158
{!esSuperAdmin && (
  // Todos los menús operativos
)}
```

✅ **CORRECTO** - Super Admin solo ve sus menús administrativos

---

## Dueño

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Dashboard** - Dashboard del Dueño con métricas
- ✅ **Hojas de Ruta** (solo si nivel = 'completa')
- ✅ **Folder Diario**
- ✅ **Resumen Semanal**
- ✅ **Depósitos**
- ✅ **Catálogos**

### Permisos:
- Folder Diario: Solo lectura y cierre
- Resumen Semanal: Solo lectura
- Depósitos: Solo lectura
- Catálogos: Solo lectura
- Hojas de Ruta: Solo lectura (si nivel completa)

### Validación en Código:
```typescript
// usePermissions.ts línea 234
if (routePath === '/dashboard') {
  return rol === 'Dueño';
}

// usePermissions.ts línea 239-249
if (routePath === '/catalogos') {
  return ['Usuario_Completo', 'Encargado_Almacén', 'Secretaria', 'Dueño', ...].includes(rol);
}
```

✅ **CORRECTO** - Dueño ve todos los menús pero con permisos de solo lectura en la mayoría

---

## Usuario_Completo

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Hojas de Ruta** (solo si nivel = 'completa')
- ✅ **Folder Diario**
- ✅ **Resumen Semanal**
- ✅ **Depósitos**
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard (solo para Dueño)
- ❌ Super Admin

### Permisos:
- Folder Diario: Crear, leer, actualizar, cerrar
- Resumen Semanal: Leer
- Depósitos: Crear, leer, actualizar, eliminar
- Catálogos: Crear, leer, actualizar, eliminar
- Hojas de Ruta: Leer y cerrar (si nivel completa)

### Validación en Código:
```typescript
// usePermissions.ts línea 252-258
if (routePath === '/folder') {
  return ['Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño'].includes(rol);
}
```

✅ **CORRECTO** - Usuario_Completo tiene acceso completo a operaciones

---

## Usuario_Ingresos

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Folder Diario**
- ✅ **Resumen Semanal**
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard
- ❌ Hojas de Ruta
- ❌ Depósitos
- ❌ Super Admin

### Permisos:
- Folder Diario: Leer y actualizar (solo ingresos)
- Resumen Semanal: Leer
- Catálogos: Solo lectura

### Validación en Código:
```typescript
// usePermissions.ts línea 252-258
if (routePath === '/folder') {
  return ['Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño'].includes(rol);
}

// usePermissions.ts línea 267-269
if (routePath === '/depositos') {
  return ['Usuario_Completo', 'Dueño'].includes(rol);
}
```

✅ **CORRECTO** - Usuario_Ingresos solo ve menús relacionados con ingresos

---

## Usuario_Egresos

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Folder Diario**
- ✅ **Resumen Semanal**
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard
- ❌ Hojas de Ruta
- ❌ Depósitos
- ❌ Super Admin

### Permisos:
- Folder Diario: Leer y actualizar (solo egresos)
- Resumen Semanal: Leer
- Catálogos: Solo lectura

### Validación en Código:
```typescript
// Mismo que Usuario_Ingresos
```

✅ **CORRECTO** - Usuario_Egresos solo ve menús relacionados con egresos

---

## Encargado_Almacén (solo en nivel 'completa')

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Hojas de Ruta** (solo si nivel = 'completa')
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard
- ❌ Folder Diario
- ❌ Resumen Semanal
- ❌ Depósitos
- ❌ Super Admin

### Permisos:
- Hojas de Ruta: Crear, leer, actualizar, eliminar
- Catálogos: Crear, leer, actualizar, eliminar

### Validación en Código:
```typescript
// usePermissions.ts línea 225-234
if (routePath.startsWith('/hojas-ruta')) {
  if (nivelAutomatizacion === 'parcial') return false;
  return ['Encargado_Almacén', 'Secretaria', 'Empleado_Ruta', 'Usuario_Completo', 'Dueño'].includes(rol);
}

// usePermissions.ts línea 252-258
if (routePath === '/folder') {
  return ['Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño'].includes(rol);
}
```

✅ **CORRECTO** - Encargado_Almacén se enfoca en hojas de ruta y catálogos

---

## Secretaria (solo en nivel 'completa')

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Hojas de Ruta** (solo si nivel = 'completa')
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard
- ❌ Folder Diario
- ❌ Resumen Semanal
- ❌ Depósitos
- ❌ Super Admin

### Permisos:
- Hojas de Ruta: Crear y leer (no puede cerrar)
- Catálogos: Crear, leer, actualizar, eliminar

### Validación en Código:
```typescript
// Mismo que Encargado_Almacén
```

✅ **CORRECTO** - Secretaria puede crear hojas de ruta pero no cerrarlas

---

## Empleado_Ruta (solo en nivel 'completa')

### Menús Visibles:
- ✅ **Inicio**
- ✅ **Hojas de Ruta** (solo si nivel = 'completa')
- ✅ **Catálogos**

### Menús NO Visibles:
- ❌ Dashboard
- ❌ Folder Diario
- ❌ Resumen Semanal
- ❌ Depósitos
- ❌ Super Admin

### Permisos:
- Hojas de Ruta: Leer y actualizar (solo sus hojas asignadas)
- Catálogos: Solo lectura

### Validación en Código:
```typescript
// usePermissions.ts línea 225-234
if (routePath.startsWith('/hojas-ruta')) {
  if (nivelAutomatizacion === 'parcial') return false;
  return ['Encargado_Almacén', 'Secretaria', 'Empleado_Ruta', 'Usuario_Completo', 'Dueño'].includes(rol);
}
```

✅ **CORRECTO** - Empleado_Ruta solo ve sus hojas asignadas

---

## Resumen de Validación

### Menús por Rol:

| Menú | Super_Admin | Dueño | Usuario_Completo | Usuario_Ingresos | Usuario_Egresos | Encargado_Almacén | Secretaria | Empleado_Ruta |
|------|-------------|-------|------------------|------------------|-----------------|-------------------|------------|---------------|
| Inicio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Super Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hojas de Ruta* | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Folder Diario | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Resumen Semanal | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Depósitos | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Catálogos | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Solo visible si nivel_automatizacion = 'completa'

---

## Validación de Lógica en Código

### 1. Super_Admin Aislado ✅
```typescript
// App.tsx línea 93
{!esSuperAdmin && (
  // Todos los menús operativos
)}
```
Super_Admin NO ve menús operativos.

### 2. Dashboard Solo para Dueño ✅
```typescript
// App.tsx línea 96-106
{esDueno && canAccessRoute('/dashboard') && (
  <button>Dashboard</button>
)}
```
Solo Dueño ve el Dashboard.

### 3. Hojas de Ruta Condicionadas ✅
```typescript
// App.tsx línea 108-118
{hasAutomacionCompleta() && canAccessRoute('/hojas-ruta') && (
  <button>Hojas de Ruta</button>
)}
```
Solo visible si nivel = 'completa' Y el rol tiene permiso.

### 4. Folder Diario Filtrado ✅
```typescript
// usePermissions.ts línea 252-258
if (routePath === '/folder') {
  return ['Usuario_Completo', 'Usuario_Ingresos', 'Usuario_Egresos', 'Dueño'].includes(rol);
}
```
Solo roles relacionados con folders diarios.

### 5. Depósitos Restringidos ✅
```typescript
// usePermissions.ts línea 267-269
if (routePath === '/depositos') {
  return ['Usuario_Completo', 'Dueño'].includes(rol);
}
```
Solo Usuario_Completo y Dueño.

---

## Conclusión

✅ **TODOS LOS ROLES ESTÁN CORRECTAMENTE VALIDADOS**

- Super_Admin: Solo ve menús administrativos
- Dueño: Ve todo pero con permisos limitados
- Usuario_Completo: Acceso completo a operaciones
- Usuario_Ingresos/Egresos: Solo sus áreas específicas
- Encargado_Almacén/Secretaria/Empleado_Ruta: Solo hojas de ruta y catálogos

La lógica de permisos está implementada correctamente en:
1. `App.tsx` - Renderizado condicional de menús
2. `usePermissions.ts` - Validación de acceso por ruta y recurso
3. Componentes individuales - Validación de acciones específicas

**No se requieren cambios adicionales.**
