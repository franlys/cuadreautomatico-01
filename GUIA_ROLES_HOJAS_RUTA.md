# Guía de Roles - Hojas de Ruta Digitales

## Resumen de Funcionalidad

El sistema de hojas de ruta digitales permite la asignación y seguimiento de rutas de entrega con diferentes niveles de acceso según el rol del usuario.

---

## Roles y Permisos

### 1. Encargado de Almacén
**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Asignar empleados a rutas
- ✅ Ver todas las hojas de ruta
- ✅ Editar hojas de ruta no cerradas
- ✅ Eliminar hojas de ruta

**Flujo de trabajo:**
1. Accede a "Hojas de Ruta" en el menú
2. Clic en "Crear Nueva Hoja"
3. Selecciona el empleado de ruta de la lista desplegable
4. Selecciona la ruta a asignar
5. Agrega las facturas con sus montos
6. Define el monto asignado en RD$
7. Crea la hoja de ruta

### 2. Secretaria
**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Asignar empleados a rutas
- ✅ Ver todas las hojas de ruta
- ❌ No puede cerrar hojas de ruta

**Flujo de trabajo:**
- Mismo proceso que Encargado de Almacén
- Puede crear y ver hojas, pero no cerrarlas

### 3. Empleado de Ruta
**Permisos:**
- ✅ Ver solo sus hojas asignadas
- ✅ Marcar facturas como entregadas
- ✅ Registrar cobros con monto y moneda
- ✅ Registrar gastos (fijos, peaje, combustible, inesperados)
- ✅ Subir fotos de evidencia para gastos
- ✅ Ver balance en tiempo real
- ❌ No puede ver hojas de otros empleados
- ❌ No puede modificar hojas cerradas

**Flujo de trabajo:**
1. Accede a "Hojas de Ruta" en el menú
2. Ve solo las hojas asignadas a su nombre
3. Clic en "Ejecutar" para abrir una hoja
4. **Marcar entregas:**
   - Clic en "Marcar Entregada" para cada factura
5. **Registrar cobros:**
   - Clic en "Registrar Cobro"
   - Ingresa el monto cobrado
   - Selecciona la moneda (RD$ o USD)
   - Confirma el cobro
6. **Registrar gastos:**
   - Selecciona el tipo de gasto:
     - **Fijo**: No requiere evidencia
     - **Peaje**: Requiere foto obligatoria
     - **Combustible**: Requiere foto obligatoria
     - **Inesperado**: Requiere descripción y foto opcional
   - Ingresa el monto y moneda
   - Toma foto de evidencia (si aplica)
   - Registra el gasto
7. **Ver balance:**
   - El balance se actualiza automáticamente
   - Muestra total cobrado, total gastado y dinero disponible
   - Separado por moneda (RD$ y USD)

### 4. Usuario Completo
**Permisos:**
- ✅ Crear hojas de ruta
- ✅ Ver todas las hojas de ruta
- ✅ Cerrar hojas de ruta
- ✅ Acceso completo al sistema

**Flujo de trabajo:**
- Puede realizar todas las acciones
- Responsable de cerrar hojas de ruta al finalizar

### 5. Dueño
**Permisos:**
- ✅ Ver todas las hojas de ruta
- ✅ Cerrar hojas de ruta
- ❌ No puede crear ni editar hojas

**Flujo de trabajo:**
- Solo visualización y cierre de hojas
- Supervisión general del proceso

---

## Proceso Completo de una Hoja de Ruta

### Fase 1: Creación (Encargado de Almacén / Secretaria)
```
1. Crear hoja de ruta
2. Asignar empleado
3. Asignar ruta
4. Agregar facturas
5. Definir monto asignado
```

### Fase 2: Ejecución (Empleado de Ruta)
```
1. Ver hoja asignada
2. Marcar facturas entregadas
3. Registrar cobros
4. Registrar gastos con evidencia
5. Monitorear balance en tiempo real
```

### Fase 3: Cierre (Usuario Completo / Dueño)
```
1. Revisar balance calculado
2. Ingresar monto físico contado
3. Ver diferencia (si existe)
4. Confirmar cierre
5. Hoja queda bloqueada para edición
```

---

## Características Especiales

### Balance en Tiempo Real
- Se calcula automáticamente después de cada operación
- Muestra:
  - Total facturas cobradas (RD$ y USD)
  - Total gastos (RD$ y USD)
  - Dinero disponible = Monto Asignado + Cobros - Gastos

### Multi-Moneda
- Soporte para RD$ y USD
- Cada factura y gasto tiene su moneda
- Balance separado por moneda

### Evidencia Fotográfica
- Gastos de peaje: Foto obligatoria
- Gastos de combustible: Foto obligatoria
- Gastos inesperados: Foto opcional
- Gastos fijos: Sin foto

### Seguridad
- Empleados solo ven sus hojas asignadas
- Hojas cerradas no se pueden modificar
- Todas las acciones se registran en audit_logs

---

## Acceso desde Celular

### Requisitos
1. Conexión a internet (o modo offline habilitado)
2. Navegador moderno (Chrome, Safari, Firefox)
3. Acceso a la cámara para fotos de evidencia

### URL de Acceso
```
https://tu-dominio.vercel.app
```

### Inicio de Sesión
1. Ingresa tu email
2. Ingresa tu contraseña
3. El sistema te redirige según tu rol:
   - **Empleado de Ruta** → Hojas de Ruta (solo las suyas)
   - **Encargado de Almacén** → Dashboard con todas las opciones
   - **Secretaria** → Dashboard con opciones limitadas
   - **Dueño** → Dashboard de supervisión

### Modo Offline (PWA)
- La aplicación funciona sin internet
- Los datos se sincronizan automáticamente al reconectar
- Ideal para zonas con mala señal

---

## Preguntas Frecuentes

**¿Puede un empleado ver hojas de otros empleados?**
No, solo ve las hojas asignadas a su nombre.

**¿Qué pasa si registro un gasto sin foto cuando es obligatoria?**
El sistema no permite enviar el formulario hasta que subas la foto.

**¿Puedo editar una hoja cerrada?**
No, las hojas cerradas quedan bloqueadas permanentemente.

**¿Cómo sé cuánto dinero me queda disponible?**
El balance en tiempo real muestra el dinero disponible actualizado después de cada cobro y gasto.

**¿Puedo usar la app sin internet?**
Sí, si está instalada como PWA. Los cambios se sincronizan al reconectar.

---

## Soporte Técnico

Para problemas o dudas:
1. Contacta al administrador del sistema
2. Revisa los logs de auditoría (solo Super Admin)
3. Verifica tu conexión a internet
