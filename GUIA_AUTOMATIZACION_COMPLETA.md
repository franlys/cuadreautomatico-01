# Guía de Automatización Completa - Hojas de Ruta Digitales

## Introducción

La Automatización Completa transforma el proceso de gestión de rutas de entrega en un sistema digital con seguimiento en tiempo real. Esta guía explica cómo usar las hojas de ruta digitales, desde su creación hasta el cierre final.

## Tabla de Contenidos

1. [Conceptos Clave](#conceptos-clave)
2. [Flujo Completo de una Ruta](#flujo-completo-de-una-ruta)
3. [Creación de Hoja de Ruta](#creación-de-hoja-de-ruta)
4. [Ejecución de Ruta por Empleado](#ejecución-de-ruta-por-empleado)
5. [Balance en Tiempo Real](#balance-en-tiempo-real)
6. [Cierre de Ruta](#cierre-de-ruta)
7. [Manejo de Múltiples Monedas](#manejo-de-múltiples-monedas)
8. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## Conceptos Clave

### Hoja de Ruta Digital
Documento digital que contiene:
- Empleado asignado
- Ruta a ejecutar
- Lista de facturas a entregar/cobrar
- Monto asignado para gastos
- Registro de gastos realizados
- Balance en tiempo real

### Identificador de Ruta
Formato: `"Empleado Ruta Fecha"`
Ejemplo: `"Jose Bani 20/03/2026"`

### Facturas
- **Pagadas (PA)**: Cliente ya pagó, solo se entrega
- **Pendientes**: Se entrega y se cobra

### Monedas
- **RD$**: Pesos dominicanos
- **USD**: Dólares estadounidenses

### Tipos de Gastos

**Gastos Fijos:**
- Agua, comida, pago a empleados
- No requieren evidencia fotográfica
- Montos predefinidos

**Gastos con Evidencia Obligatoria:**
- Peaje
- Combustible
- Requieren foto del recibo

**Gastos Inesperados:**
- Reparaciones, emergencias
- Requieren descripción
- Foto opcional pero recomendada

### Balance en Tiempo Real
Cálculo automático:
```
Dinero Disponible = Monto Asignado + Facturas Cobradas - Gastos Registrados
```

---

## Flujo Completo de una Ruta

```
1. Encargado/Secretaria crea hoja de ruta
   ↓
2. Empleado recibe asignación en su móvil
   ↓
3. Empleado ejecuta ruta:
   - Marca facturas como entregadas
   - Registra cobros con montos
   - Registra gastos con evidencias
   ↓
4. Sistema calcula balance automáticamente
   ↓
5. Usuario_Completo cierra la ruta
   ↓
6. Sistema crea registro de ingreso automáticamente
```

---

## Creación de Hoja de Ruta

### Roles que Pueden Crear
- **Encargado_Almacén**: Puede crear y cerrar
- **Secretaria**: Puede crear pero no cerrar

### Pasos para Crear

1. **Acceder al Módulo**
   - Menú → Hojas de Ruta → Crear Nueva

2. **Seleccionar Empleado y Ruta**
   - Empleado: Quien ejecutará la ruta
   - Ruta: Zona o circuito asignado
   - Fecha: Día de ejecución

3. **Agregar Facturas**
   - Haz clic en "Agregar Factura"
   - Completa:
     - Número de factura
     - Monto
     - Moneda (RD$ o USD)
     - Estado de pago:
       - **Pagada (PA)**: Solo entrega
       - **Pendiente**: Entrega y cobro

4. **Asignar Monto para Gastos**
   - Ingresa el monto en RD$ que llevarás al empleado
   - Este dinero cubre gastos de la ruta

5. **Revisar Totales**
   - Total de facturas por moneda
   - Monto asignado
   - Identificador generado automáticamente

6. **Guardar Hoja de Ruta**
   - Haz clic en "Crear Hoja de Ruta"
   - El empleado verá la asignación en su dispositivo

### Ejemplo Práctico

**Escenario:**
- Empleado: Jose
- Ruta: Bani
- Fecha: 20/03/2026
- Facturas:
  - #001: RD$ 5,000 (Pagada)
  - #002: RD$ 3,000 (Pendiente)
  - #003: USD 100 (Pendiente)
- Monto asignado: RD$ 2,000

**Identificador generado:** `"Jose Bani 20/03/2026"`

---

## Ejecución de Ruta por Empleado

### Acceso Móvil

El empleado accede desde su móvil a:
- Menú → Mis Hojas de Ruta
- Ve solo sus rutas asignadas

### Marcar Facturas como Entregadas

1. En la lista de facturas, localiza la factura
2. Marca el checkbox "Entregada"
3. Se registra automáticamente con timestamp

### Registrar Cobros

**Para facturas pendientes:**
1. Marca la factura como "Cobrada"
2. Ingresa el monto cobrado
3. Selecciona la moneda (RD$ o USD)
4. El balance se actualiza automáticamente

**Importante:**
- El monto cobrado puede ser diferente al monto de la factura
- Registra el monto real recibido

### Registrar Gastos

#### Gasto Fijo (sin evidencia)
1. Haz clic en "Registrar Gasto"
2. Selecciona tipo: "Fijo"
3. Descripción: "Agua", "Comida", etc.
4. Monto y moneda
5. Guardar

#### Gasto con Evidencia (peaje, combustible)
1. Haz clic en "Registrar Gasto"
2. Selecciona tipo: "Peaje" o "Combustible"
3. Monto y moneda
4. **Toma foto del recibo** (obligatorio)
5. Guardar

#### Gasto Inesperado
1. Haz clic en "Registrar Gasto"
2. Selecciona tipo: "Inesperado"
3. Descripción detallada del gasto
4. Monto y moneda
5. Toma foto (opcional pero recomendada)
6. Guardar

### Orden de Descuento de Gastos

El sistema descuenta gastos en este orden:
1. **Primero**: Del monto asignado (RD$ 2,000)
2. **Después**: Del dinero cobrado

**Ejemplo:**
- Monto asignado: RD$ 2,000
- Gasto 1: RD$ 1,500 → Queda RD$ 500 del asignado
- Gasto 2: RD$ 800 → Usa RD$ 500 del asignado + RD$ 300 del cobrado

---

## Balance en Tiempo Real

### Visualización

El empleado ve en todo momento:

**Por Moneda RD$:**
- Total facturas cobradas: RD$ X,XXX
- Total gastos: RD$ X,XXX
- Dinero disponible: RD$ X,XXX

**Por Moneda USD:**
- Total facturas cobradas: USD X,XXX
- Total gastos: USD X,XXX
- Dinero disponible: USD X,XXX

### Cálculo Automático

```
Balance RD$ = Monto Asignado + Cobros RD$ - Gastos RD$
Balance USD = Cobros USD - Gastos USD
```

### Actualización

El balance se actualiza automáticamente después de:
- Registrar un cobro
- Registrar un gasto
- Marcar una factura como entregada

---

## Cierre de Ruta

### Quién Puede Cerrar
- **Usuario_Completo**: Rol principal para cierre
- **Encargado_Almacén**: También puede cerrar

### Cuándo Cerrar
- Cuando el empleado regresa de la ruta
- Todas las facturas están procesadas
- Todos los gastos están registrados

### Pasos para Cerrar

1. **Seleccionar Hoja de Ruta**
   - Menú → Hojas de Ruta → Completadas
   - Selecciona la ruta a cerrar

2. **Revisar Cálculo Automático**
   - El sistema muestra:
     - Total facturas cobradas (RD$ y USD)
     - Total gastos (RD$ y USD)
     - Monto esperado a recibir

3. **Contar Dinero Físico**
   - Cuenta el dinero que trae el empleado
   - Separa por moneda

4. **Ingresar Montos Físicos**
   - Monto físico RD$: [ingresa cantidad]
   - Monto físico USD: [ingresa cantidad]

5. **Revisar Diferencias**
   - El sistema muestra:
     - Calculado vs Físico
     - Diferencia (si existe)

6. **Confirmar Cierre**
   - Si hay diferencia, verifica antes de confirmar
   - Haz clic en "Confirmar Cierre"

### Efectos del Cierre

1. **Registro Automático de Ingreso**
   - Se crea un registro en el folder diario
   - Tipo: Ingreso
   - Monto: Dinero físico recibido
   - Concepto: "Cierre de ruta [identificador]"

2. **Hoja de Ruta Bloqueada**
   - No se pueden hacer más modificaciones
   - Queda como registro histórico

3. **Auditoría**
   - Se registra quién cerró la ruta
   - Timestamp del cierre
   - Diferencias detectadas

### Manejo de Diferencias

**Si el físico es menor que el calculado:**
- Puede indicar gasto no registrado
- Verifica con el empleado
- Documenta la diferencia

**Si el físico es mayor que el calculado:**
- Puede indicar cobro no registrado
- Verifica las facturas
- Ajusta si es necesario

---

## Manejo de Múltiples Monedas

### Principios

1. **Separación Total**
   - RD$ y USD se manejan por separado
   - No hay conversión automática

2. **Registro Independiente**
   - Cada factura tiene su moneda
   - Cada gasto tiene su moneda
   - Cada balance se calcula por moneda

3. **Cierre por Moneda**
   - Se cuentan RD$ y USD por separado
   - Se crean registros separados si es necesario

### Ejemplo Completo

**Inicio de Ruta:**
- Monto asignado: RD$ 2,000
- Facturas:
  - #001: RD$ 5,000 (Pendiente)
  - #002: USD 100 (Pendiente)

**Durante la Ruta:**
- Cobra factura #001: RD$ 5,000
- Cobra factura #002: USD 100
- Gasto combustible: RD$ 800
- Gasto peaje: RD$ 200
- Gasto comida: USD 20

**Balance Final:**
- RD$: 2,000 + 5,000 - 800 - 200 = RD$ 6,000
- USD: 100 - 20 = USD 80

**Cierre:**
- Físico RD$: 6,000 ✓
- Físico USD: 80 ✓
- Sin diferencias

---

## Casos de Uso Comunes

### Caso 1: Ruta Simple con Solo RD$

**Escenario:**
- 5 facturas, todas en RD$
- Todas pendientes de cobro
- Gastos normales

**Flujo:**
1. Crear hoja con facturas en RD$
2. Empleado cobra todas las facturas
3. Registra gastos en RD$
4. Cierre con un solo monto en RD$

### Caso 2: Ruta Mixta RD$ y USD

**Escenario:**
- 3 facturas en RD$
- 2 facturas en USD
- Gastos en ambas monedas

**Flujo:**
1. Crear hoja con facturas mixtas
2. Empleado cobra en ambas monedas
3. Registra gastos en la moneda correspondiente
4. Cierre con dos montos separados

### Caso 3: Factura Pagada (PA)

**Escenario:**
- Cliente ya pagó en oficina
- Solo se entrega mercancía

**Flujo:**
1. Crear factura marcada como "Pagada"
2. Empleado solo marca como "Entregada"
3. No se registra cobro
4. No afecta el balance de dinero

### Caso 4: Gasto Inesperado

**Escenario:**
- Vehículo se daña en ruta
- Necesita reparación urgente

**Flujo:**
1. Empleado registra gasto inesperado
2. Descripción: "Reparación de llanta"
3. Monto: RD$ 1,500
4. Toma foto del recibo
5. Se descuenta del dinero disponible

### Caso 5: Cliente Paga Menos

**Escenario:**
- Factura: RD$ 5,000
- Cliente solo paga: RD$ 4,500

**Flujo:**
1. Empleado marca como cobrada
2. Ingresa monto real: RD$ 4,500
3. Sistema registra la diferencia
4. En cierre se detecta RD$ 500 menos

---

## Mejores Prácticas

### Para Encargados/Secretarias

1. **Verificar Datos**
   - Revisa números de factura antes de crear
   - Confirma montos y monedas
   - Asigna monto suficiente para gastos

2. **Comunicación**
   - Informa al empleado sobre facturas especiales
   - Aclara si hay instrucciones específicas

3. **Seguimiento**
   - Monitorea el progreso de las rutas
   - Verifica que se registren gastos con evidencias

### Para Empleados de Ruta

1. **Registro Inmediato**
   - Registra cobros y gastos en el momento
   - No esperes al final del día

2. **Evidencias**
   - Toma fotos claras de recibos
   - Asegúrate que se vean montos y conceptos

3. **Verificación**
   - Revisa el balance antes de regresar
   - Confirma que todo esté registrado

4. **Comunicación**
   - Reporta problemas inmediatamente
   - Informa sobre gastos inesperados

### Para Usuario_Completo (Cierre)

1. **Revisión Detallada**
   - Verifica todas las facturas
   - Revisa todos los gastos y evidencias
   - Confirma cálculos

2. **Conteo Físico**
   - Cuenta el dinero con el empleado presente
   - Separa claramente RD$ y USD
   - Verifica billetes falsos

3. **Documentación**
   - Documenta cualquier diferencia
   - Investiga discrepancias antes de cerrar
   - Mantén comunicación con el empleado

---

## Solución de Problemas

### El empleado no ve su hoja de ruta
- Verifica que esté asignada correctamente
- Confirma que el empleado tenga rol "Empleado_Ruta"
- Revisa la conexión a internet

### No puedo registrar un gasto con evidencia
- Verifica permisos de cámara en el navegador
- Intenta tomar la foto nuevamente
- Si persiste, registra sin foto y súbela después

### El balance no cuadra
- Revisa que todos los cobros estén registrados
- Verifica que todos los gastos estén ingresados
- Confirma las monedas de cada transacción

### No puedo cerrar una ruta
- Verifica que tengas rol Usuario_Completo o Encargado_Almacén
- Confirma que la ruta esté en estado "Completada"
- Revisa que no haya operaciones pendientes

---

## Soporte

Si necesitas ayuda:
1. Consulta esta guía
2. Revisa los logs de auditoría
3. Contacta a tu Super Admin
4. Reporta problemas técnicos al equipo de desarrollo

---

**Última actualización:** Marzo 2026
