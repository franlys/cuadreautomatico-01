# PDF Export Format Fix - Bugfix Design

## Overview

El reporte semanal exportado a PDF actualmente muestra los registros agrupados por día en tablas separadas, sin columna de saldo acumulado ni diferenciación visual entre ingresos y egresos. Este bugfix transformará el formato para mostrar una tabla única con todas las transacciones en orden cronológico, incluyendo una columna de saldo acumulado y aplicando colores diferenciados (amarillo para ingresos, blanco para egresos). Además, se actualizará el encabezado para incluir el nombre de la empresa y el formato de subtítulo esperado.

La estrategia de fix es mínima e invasiva: modificar únicamente la función `exportarPDF` en `src/utils/exportador.ts` para cambiar la estructura de la tabla y el encabezado, sin afectar la lógica de filtrado por roles ni la exportación XLSX.

## Glossary

- **Bug_Condition (C)**: La condición que activa el bug - cuando se exporta un reporte semanal a PDF y el formato no coincide con el esperado (tabla única, columna de saldo, colores diferenciados)
- **Property (P)**: El comportamiento deseado - el PDF debe mostrar una tabla única con columnas FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO, con colores diferenciados y encabezado con nombre de empresa
- **Preservation**: El filtrado por roles (Usuario_Ingresos, Usuario_Egresos, Dueño), la exportación XLSX, y la sección de depósitos deben permanecer sin cambios
- **exportarPDF**: La función en `src/utils/exportador.ts` que genera el documento PDF del reporte semanal
- **DatosExportacion**: Interface que contiene semana, folders, registrosPorFolder y depositos para la exportación
- **Saldo Acumulado**: Balance calculado cronológicamente sumando ingresos y restando egresos en cada fila

## Bug Details

### Bug Condition

El bug se manifiesta cuando se exporta un reporte semanal a PDF. La función `exportarPDF` está generando un formato incorrecto que no coincide con las expectativas del usuario en múltiples aspectos: estructura de tabla, columnas, colores y encabezado.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: string, format: string, output: PDFDocument }
  OUTPUT: boolean
  
  RETURN input.action == 'exportar_reporte'
         AND input.format == 'PDF'
         AND (
           output.hasMultipleTables() OR
           NOT output.hasColumnaSaldo() OR
           NOT output.hasColorDiferenciado() OR
           NOT output.hasNombreEmpresa() OR
           output.columnNames != ['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO']
         )
END FUNCTION
```

### Examples

- **Ejemplo 1**: Usuario Dueño exporta semana con 3 días de registros
  - **Actual**: Se generan 3 tablas separadas con encabezados "2024-01-15 - Balance: 1500.00", "2024-01-16 - Balance: 2300.00", etc.
  - **Esperado**: Una sola tabla con todos los registros ordenados cronológicamente, mostrando saldo acumulado en cada fila

- **Ejemplo 2**: Usuario exporta reporte con ingresos y egresos mezclados
  - **Actual**: Todas las filas tienen el mismo fondo blanco, columnas "Tipo | Concepto | Empleado | Ruta | Monto"
  - **Esperado**: Filas de ingreso con fondo amarillo, filas de egreso con fondo blanco, columnas "FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO"

- **Ejemplo 3**: Usuario exporta reporte y ve el encabezado
  - **Actual**: Título "Reporte Semanal - Cuadre Automático", subtítulo "Período: 2024-01-15 al 2024-01-21"
  - **Esperado**: Título "[Nombre Empresa]", subtítulo "ENTRADA DE DIARIOS SEMANA DEL 2024-01-15 al 2024-01-21"

- **Ejemplo 4**: Registro de ingreso por $500
  - **Actual**: Fila muestra "Ingreso | Venta | Juan | Ruta 1 | 500.00"
  - **Esperado**: Fila muestra "2024-01-15 | Venta - Juan - Ruta 1 | 500.00 | | 500.00" con fondo amarillo

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- El filtrado de registros por rol debe continuar funcionando exactamente igual (Usuario_Ingresos ve solo ingresos, Usuario_Egresos ve solo egresos, Dueño ve todo)
- La exportación a XLSX debe mantener su formato actual sin cambios
- La sección de resumen semanal debe permanecer igual con sus totales
- La sección de depósitos bancarios (solo para Dueño) debe permanecer al final del reporte
- El ordenamiento cronológico de registros debe mantenerse
- El nombre del archivo generado debe seguir siendo "reporte_[fecha_inicio]_[fecha_fin].pdf"

**Scope:**
Todas las funcionalidades que NO involucran la generación del formato de tabla de registros en PDF deben permanecer completamente inalteradas. Esto incluye:
- La función `exportarXLSX` y todo su comportamiento
- La lógica de carga de datos en `BotonesExportacion.tsx`
- El filtrado de registros según rol del usuario
- La generación de la sección de resumen semanal
- La generación de la sección de depósitos bancarios

## Hypothesized Root Cause

Basado en el análisis del código actual en `src/utils/exportador.ts`, las causas identificadas son:

1. **Estructura de Tabla Incorrecta**: La función itera sobre `datos.folders` y genera una tabla separada para cada día usando `autoTable` dentro del loop, en lugar de consolidar todos los registros en una sola tabla

2. **Columnas Incorrectas**: Las columnas están definidas como `['Tipo', 'Concepto', 'Empleado', 'Ruta', 'Monto']` en lugar de `['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO']`

3. **Falta de Columna Saldo**: No existe lógica para calcular y mostrar el saldo acumulado después de cada transacción

4. **Falta de Colores Diferenciados**: No se aplican estilos condicionales (`fillColor`) en las opciones de `autoTable` para diferenciar ingresos (amarillo) de egresos (blanco)

5. **Encabezado Incorrecto**: El título usa texto hardcodeado "Reporte Semanal - Cuadre Automático" en lugar del nombre de la empresa, y el subtítulo no sigue el formato "ENTRADA DE DIARIOS SEMANA DEL..."

6. **Falta de Acceso al Nombre de Empresa**: La interface `DatosExportacion` no incluye el nombre de la empresa, por lo que necesitamos agregarlo o cargarlo dentro de la función

## Correctness Properties

Property 1: Bug Condition - Formato de Tabla Único con Saldo Acumulado

_For any_ exportación de reporte semanal a PDF, el sistema fijo SHALL generar una tabla única continua con columnas FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO, donde cada fila muestra el saldo acumulado calculado cronológicamente (saldo_anterior + ingreso - egreso), las filas de ingreso tienen fondo amarillo (#FFFF00), las filas de egreso tienen fondo blanco, y el encabezado muestra el nombre de la empresa como título y "ENTRADA DE DIARIOS SEMANA DEL [fecha_inicio] al [fecha_fin]" como subtítulo.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

Property 2: Preservation - Filtrado por Roles y Otras Funcionalidades

_For any_ exportación que NO sea la generación del formato de tabla de registros en PDF (como filtrado por roles, exportación XLSX, sección de resumen, sección de depósitos), el sistema fijo SHALL producir exactamente el mismo resultado que el sistema original, preservando toda la funcionalidad existente sin regresiones.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Asumiendo que nuestro análisis de causa raíz es correcto:

**File**: `src/utils/exportador.ts`

**Function**: `exportarPDF`

**Specific Changes**:

1. **Agregar nombre de empresa a DatosExportacion**:
   - Modificar la interface `DatosExportacion` para incluir `nombreEmpresa?: string`
   - Modificar `BotonesExportacion.tsx` para cargar el nombre de la empresa desde la tabla `empresas` usando `perfil.empresa_id`
   - Pasar el nombre de empresa en el objeto `datos` al llamar `exportarPDF`

2. **Actualizar encabezado del PDF**:
   - Cambiar el título de "Reporte Semanal - Cuadre Automático" a `datos.nombreEmpresa || 'Reporte Semanal'`
   - Cambiar el subtítulo de `Período: ${fecha_inicio} al ${fecha_fin}` a `ENTRADA DE DIARIOS SEMANA DEL ${fecha_inicio} al ${fecha_fin}`

3. **Consolidar registros en una sola lista ordenada**:
   - Antes del loop de folders, crear un array `registrosConsolidados` que combine todos los registros de todos los folders
   - Cada elemento debe incluir: `{ fecha, tipo, concepto, empleado, ruta, monto }`
   - Ordenar `registrosConsolidados` por fecha (usando `folder.fecha_laboral`) y luego por `created_at`

4. **Calcular saldo acumulado**:
   - Inicializar `saldoAcumulado = 0`
   - Iterar sobre `registrosConsolidados` y para cada registro:
     - Si `tipo === 'ingreso'`: `saldoAcumulado += monto`
     - Si `tipo === 'egreso'`: `saldoAcumulado -= monto`
     - Agregar `saldoAcumulado` al objeto del registro

5. **Generar tabla única con nuevas columnas**:
   - Cambiar las columnas de la tabla a: `['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO']`
   - Para cada registro en `registrosConsolidados`, generar una fila:
     - FECHAS: `registro.fecha`
     - DESCRIPCION: `${registro.concepto} - ${registro.empleado} - ${registro.ruta}`
     - INGRESO: `registro.tipo === 'ingreso' ? registro.monto.toFixed(2) : ''`
     - EGRESO: `registro.tipo === 'egreso' ? registro.monto.toFixed(2) : ''`
     - SALDO: `registro.saldoAcumulado.toFixed(2)`

6. **Aplicar colores diferenciados**:
   - En las opciones de `autoTable`, usar `didParseCell` o `willDrawCell` hook
   - Para cada fila, verificar el tipo de registro correspondiente
   - Si es ingreso: aplicar `fillColor: [255, 255, 0]` (amarillo)
   - Si es egreso: aplicar `fillColor: [255, 255, 255]` (blanco) o dejar por defecto

7. **Ajustar anchos de columna**:
   - FECHAS: ancho fijo apropiado para fechas (ej. 25)
   - DESCRIPCION: ancho flexible para texto largo (ej. 70)
   - INGRESO: ancho fijo para números (ej. 25), alineado a la derecha
   - EGRESO: ancho fijo para números (ej. 25), alineado a la derecha
   - SALDO: ancho fijo para números (ej. 25), alineado a la derecha

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, ejecutar tests exploratorios en el código sin fix para confirmar que el bug existe y entender su comportamiento; segundo, verificar que el fix corrige el problema y no introduce regresiones.

### Exploratory Bug Condition Checking

**Goal**: Confirmar que el código actual genera el formato incorrecto ANTES de implementar el fix. Esto valida nuestro análisis de causa raíz.

**Test Plan**: Ejecutar la función `exportarPDF` con datos de prueba y analizar el PDF generado para verificar que tiene el formato incorrecto (múltiples tablas, columnas incorrectas, sin saldo, sin colores).

**Test Cases**:
1. **Test de Estructura de Tabla**: Exportar reporte con 3 días de registros y verificar que genera 3 tablas separadas (fallará en código sin fix)
2. **Test de Columnas**: Verificar que las columnas son "Tipo | Concepto | Empleado | Ruta | Monto" en lugar de "FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO" (fallará en código sin fix)
3. **Test de Saldo**: Verificar que no existe columna de saldo acumulado (fallará en código sin fix)
4. **Test de Colores**: Verificar que todas las filas tienen el mismo fondo (fallará en código sin fix)
5. **Test de Encabezado**: Verificar que el título es "Reporte Semanal - Cuadre Automático" en lugar del nombre de empresa (fallará en código sin fix)

**Expected Counterexamples**:
- El PDF generado tiene múltiples tablas en lugar de una sola
- Las columnas no coinciden con el formato esperado
- No existe columna de saldo acumulado
- No hay diferenciación visual entre ingresos y egresos
- El encabezado no muestra el nombre de la empresa

### Fix Checking

**Goal**: Verificar que para todas las exportaciones a PDF, el sistema fijo produce el formato correcto con tabla única, saldo acumulado, colores diferenciados y encabezado actualizado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := exportarPDF_fixed(input.datos, input.rol)
  ASSERT result.hasTablaUnica()
  ASSERT result.hasColumnas(['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO'])
  ASSERT result.hasSaldoAcumulado()
  ASSERT result.hasColoresDiferenciados()
  ASSERT result.hasNombreEmpresa()
  ASSERT result.hasSubtituloFormato('ENTRADA DE DIARIOS SEMANA DEL')
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas las funcionalidades que NO son la generación del formato de tabla de registros en PDF, el sistema fijo produce el mismo resultado que el sistema original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT exportarPDF_original(input) = exportarPDF_fixed(input)
  ASSERT exportarXLSX_original(input) = exportarXLSX_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque:
- Genera muchos casos de prueba automáticamente a través del dominio de entrada
- Detecta casos edge que los tests unitarios manuales podrían omitir
- Proporciona garantías fuertes de que el comportamiento permanece sin cambios para todas las entradas no afectadas por el bug

**Test Plan**: Observar el comportamiento en código SIN FIX primero para filtrado por roles y exportación XLSX, luego escribir property-based tests capturando ese comportamiento.

**Test Cases**:
1. **Preservation de Filtrado por Roles**: Observar que Usuario_Ingresos solo ve ingresos en código sin fix, luego verificar que esto continúa después del fix
2. **Preservation de Exportación XLSX**: Observar el formato XLSX en código sin fix, luego verificar que permanece idéntico después del fix
3. **Preservation de Sección Resumen**: Verificar que la sección de resumen semanal permanece igual
4. **Preservation de Sección Depósitos**: Verificar que la sección de depósitos (para Dueño) permanece igual
5. **Preservation de Nombre de Archivo**: Verificar que el nombre del archivo sigue siendo "reporte_[fecha_inicio]_[fecha_fin].pdf"

### Unit Tests

- Test de consolidación de registros: verificar que registros de múltiples folders se combinan correctamente en orden cronológico
- Test de cálculo de saldo acumulado: verificar que el saldo se calcula correctamente sumando ingresos y restando egresos
- Test de formato de columnas: verificar que cada fila tiene el formato correcto (FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO)
- Test de colores: verificar que ingresos tienen fondo amarillo y egresos tienen fondo blanco
- Test de encabezado: verificar que el título muestra el nombre de empresa y el subtítulo tiene el formato correcto
- Test de filtrado por rol: verificar que Usuario_Ingresos solo ve ingresos, Usuario_Egresos solo ve egresos, Dueño ve todo

### Property-Based Tests

- Generar reportes aleatorios con diferentes cantidades de días y registros, verificar que siempre se genera una tabla única
- Generar registros aleatorios de ingresos y egresos, verificar que el saldo acumulado siempre es correcto
- Generar diferentes roles de usuario, verificar que el filtrado siempre funciona correctamente
- Generar reportes con y sin depósitos, verificar que la sección de depósitos solo aparece para Dueño

### Integration Tests

- Test de flujo completo: usuario Dueño exporta reporte semanal con múltiples días, ingresos, egresos y depósitos
- Test de exportación XLSX: verificar que la exportación XLSX no se ve afectada por los cambios en PDF
- Test de diferentes roles: verificar que cada rol ve el contenido correcto en el PDF exportado
- Test de nombre de empresa: verificar que el nombre de empresa se carga correctamente desde la base de datos y aparece en el PDF
