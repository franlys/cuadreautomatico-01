# Guía de Roles para Hojas de Ruta Digitales

## Descripción General

El sistema de hojas de ruta digitales permite gestionar el flujo completo de entregas y cobros de facturas por parte de empleados de ruta. Este documento describe los roles involucrados y sus responsabilidades.

---

## Roles y Permisos

### 1. Encargado de Almacén

**Responsabilidades:**
- Crear nuevas hojas de ruta
- Asignar empleados a las rutas
- Definir facturas y montos
- Asignar monto inicial en RD$

**Flujo de trabajo:**
1. Accede a "Hojas de Ruta" desde el menú principal
2. Hace clic en "Crear Nueva Hoja"
3. Selecciona el empleado de ruta
4. Selecciona la ruta a ejecutar
5. Selecciona la fecha
6. Agrega las facturas con sus montos y monedas
7. Define el monto asignado en RD$ para gastos
8. Guarda la hoja de ruta

**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Ver todas las hojas de ruta
- ❌ Ejecutar hojas de ruta (marcar entregas/cobros)
- ❌ Cerrar hojas de ruta

---

### 2. Empleado de Ruta

**Responsabilidades:**
- Ejecutar las hojas de ruta asignadas
- Marcar facturas como entregadas
- Registrar cobros con montos y monedas
- Registrar gastos con evidencias fotográficas
- Ver balance en tiempo real

**Flujo de trabajo:**
1. Accede a "Hojas de Ruta" desde el menú principal
2. Ve solo sus hojas de ruta asignadas
3. Hace clic en "Ejecutar" en la hoja que va a trabajar
4. Durante la ruta:
   - Marca facturas como entregadas (checkbox)
   - Registra cobros con monto y moneda
   - Registra gastos (combustible, peajes, etc.) con foto
   - Ve el balance actualizado en tiempo real
5. Al finalizar, espera a que Usuario_Completo cierre la ruta

**Permisos:**
- ❌ Crear hojas de ruta
- ✅ Ver solo sus hojas de ruta asignadas
- ✅ Ejecutar sus hojas de ruta (marcar entregas/cobros)
- ✅ Registrar gastos con evidencias
- ❌ Cerrar hojas de ruta

**Importante:**
- Solo puede ver y ejecutar las hojas asignadas a su nombre
- No puede ver hojas de otros empleados
- No puede modificar hojas cerradas

---

### 3. Usuario_Completo

**Responsabilidades:**
- Todas las del Encargado de Almacén
- Cerrar hojas de ruta
- Validar balance calculado vs físico
- Generar registro automático en folder diario

**Flujo de trabajo para cierre:**
1. Accede a "Hojas de Ruta"
2. Selecciona una hoja en estado "abierta"
3. Hace clic en "Cerrar"
4. Revisa el balance calculado automáticamente:
   - Total facturas cobradas (RD$ y USD)
   - Total gastos (RD$ y USD)
   - Dinero disponible calculado
5. Ingresa el monto físico contado (RD$ y USD)
6. Revisa las diferencias (si las hay)
7. Confirma el cierre
8. El sistema crea automáticamente un registro de ingreso en el folder diario

**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Ver todas las hojas de ruta
- ✅ Ejecutar hojas de ruta
- ✅ Cerrar hojas de ruta
- ✅ Ver diferencias entre calculado y físico

---

### 4. Secretaria

**Responsabilidades:**
- Crear nuevas hojas de ruta
- Asignar empleados a las rutas
- Ver todas las hojas de ruta

**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Ver todas las hojas de ruta
- ❌ Ejecutar hojas de ruta
- ❌ Cerrar hojas de ruta

---

### 5. Dueño

**Responsabilidades:**
- Ver todas las hojas de ruta
- Cerrar hojas de ruta
- Supervisar operaciones

**Permisos:**
- ❌ Crear hojas de ruta
- ✅ Ver todas las hojas de ruta
- ❌ Ejecutar hojas de ruta
- ✅ Cerrar hojas de ruta

---

## Flujo Completo del Proceso

```
1. CREACIÓN (Encargado Almacén / Secretaria / Usuario_Completo)
   ↓
   Crear hoja de ruta
   Asignar empleado
   Definir facturas y montos
   Asignar dinero inicial
   
2. EJECUCIÓN (Empleado de Ruta)
   ↓
   Ver hoja asignada
   Marcar entregas
   Registrar cobros
   Registrar gastos con fotos
   Ver balance en tiempo real
   
3. CIERRE (Usuario_Completo / Dueño)
   ↓
   Revisar balance calculado
   Ingresar monto físico
   Validar diferencias
   Confirmar cierre
   → Registro automático en folder diario
```

---

## Estados de Hoja de Ruta

### Abierta
- Puede ser ejecutada por el empleado
- Puede registrar entregas, cobros y gastos
- Balance se actualiza en tiempo real

### Cerrada
- No se pueden hacer más modificaciones
- Balance final registrado
- Ingreso automático creado en folder diario
- Solo lectura para todos los usuarios

---

## Características Especiales

### Balance en Tiempo Real
- Se calcula automáticamente después de cada operación
- Muestra totales por moneda (RD$ y USD)
- Fórmula: `Dinero Disponible = Monto Asignado + Cobros - Gastos`

### Soporte Multi-Moneda
- Todas las facturas pueden ser en RD$ o USD
- Todos los gastos pueden ser en RD$ o USD
- Los balances se calculan por separado para cada moneda
- El cierre valida ambas monedas

### Evidencias Fotográficas
- Gastos pueden requerir evidencia fotográfica
- Se suben a Supabase Storage
- Organizadas por empresa_id para aislamiento multi-tenant

### Auditoría Completa
- Todas las acciones se registran en audit_logs
- Incluye: creación, ejecución, cierre
- Trazabilidad completa del proceso

---

## Preguntas Frecuentes

**P: ¿Puede un Empleado de Ruta ver hojas de otros empleados?**
R: No, solo ve las hojas asignadas a su nombre.

**P: ¿Qué pasa si hay diferencia entre el calculado y el físico?**
R: El sistema muestra la diferencia claramente. El Usuario_Completo o Dueño decide si proceder con el cierre o investigar.

**P: ¿Se puede modificar una hoja cerrada?**
R: No, las hojas cerradas son de solo lectura. Las políticas RLS previenen modificaciones.

**P: ¿Cómo se asigna un empleado a una hoja de ruta?**
R: El Encargado de Almacén, Secretaria o Usuario_Completo selecciona el empleado de un dropdown al crear la hoja.

**P: ¿El Empleado de Ruta necesita estar registrado como usuario?**
R: Sí, debe tener un perfil con rol 'Empleado_Ruta' y su nombre debe coincidir con un empleado en el catálogo.

---

## Requisitos Técnicos

### Para usar Hojas de Ruta:
1. La empresa debe tener `nivel_automatizacion = 'completa'`
2. Los empleados de ruta deben tener perfiles con rol 'Empleado_Ruta'
3. Debe haber empleados y rutas creados en los catálogos
4. El menú "Hojas de Ruta" solo aparece si el nivel es 'completa'

### Cambiar Nivel de Automatización:
- Solo Super_Admin puede cambiar el nivel
- Se hace desde el Dashboard de Super Admin
- El cambio se registra en audit_logs
- La interfaz se actualiza automáticamente para todos los usuarios

---

## Soporte

Para más información sobre:
- Configuración de empresas: Ver `GUIA_SUPER_ADMIN.md`
- Flujo completo de hojas de ruta: Ver `GUIA_AUTOMATIZACION_COMPLETA.md`
- Implementación técnica: Ver `RESUMEN_IMPLEMENTACION_MULTI_TENANT.md`
