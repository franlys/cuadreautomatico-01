# Bugfix Requirements Document

## Introduction

El reporte semanal exportado a PDF no cumple con el formato esperado por el usuario. Actualmente muestra los registros agrupados por día en tablas separadas, sin una columna de saldo acumulado y sin diferenciación visual entre ingresos y egresos. El formato esperado es una tabla única con todas las transacciones en orden cronológico, mostrando el balance acumulado después de cada operación y usando colores para distinguir visualmente los tipos de transacción.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN se exporta el reporte semanal a PDF THEN el sistema muestra los registros agrupados por día en tablas separadas con encabezados individuales

1.2 WHEN se exporta el reporte semanal a PDF THEN el sistema no incluye una columna de SALDO que muestre el balance acumulado después de cada transacción

1.3 WHEN se exporta el reporte semanal a PDF THEN el sistema no aplica colores diferenciados para distinguir visualmente entre ingresos (fondo amarillo) y egresos (fondo blanco)

1.4 WHEN se exporta el reporte semanal a PDF THEN el sistema no muestra el título con el nombre de la empresa en el encabezado

1.5 WHEN se exporta el reporte semanal a PDF THEN el sistema no muestra el subtítulo con el formato "ENTRADA DE DIARIOS SEMANA DEL [fecha_inicio] al [fecha_fin]"

1.6 WHEN se exporta el reporte semanal a PDF THEN el sistema muestra las columnas como "Tipo | Concepto | Empleado | Ruta | Monto" en lugar de "FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO"

### Expected Behavior (Correct)

2.1 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL mostrar todos los registros en una sola tabla continua sin separaciones por día

2.2 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL incluir una columna SALDO que muestre el balance acumulado después de cada transacción en orden cronológico

2.3 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL aplicar fondo amarillo a las filas de ingresos y fondo blanco a las filas de egresos

2.4 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL mostrar el nombre de la empresa como título principal del documento

2.5 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL mostrar el subtítulo "ENTRADA DE DIARIOS SEMANA DEL [fecha_inicio] al [fecha_fin]" donde las fechas corresponden al período de la semana laboral

2.6 WHEN se exporta el reporte semanal a PDF THEN el sistema SHALL mostrar las columnas como "FECHAS | DESCRIPCION | INGRESO | EGRESO | SALDO" donde INGRESO y EGRESO muestran el monto solo en su columna correspondiente según el tipo de transacción

2.7 WHEN un registro es de tipo ingreso THEN el sistema SHALL mostrar el monto en la columna INGRESO y dejar vacía la columna EGRESO

2.8 WHEN un registro es de tipo egreso THEN el sistema SHALL mostrar el monto en la columna EGRESO y dejar vacía la columna INGRESO

2.9 WHEN se calcula el saldo acumulado THEN el sistema SHALL sumar los ingresos y restar los egresos en orden cronológico para cada fila

### Unchanged Behavior (Regression Prevention)

3.1 WHEN el usuario tiene rol "Usuario_Ingresos" THEN el sistema SHALL CONTINUE TO mostrar solo los registros de tipo ingreso en el PDF

3.2 WHEN el usuario tiene rol "Usuario_Egresos" THEN el sistema SHALL CONTINUE TO mostrar solo los registros de tipo egreso en el PDF

3.3 WHEN el usuario tiene rol "Dueño" THEN el sistema SHALL CONTINUE TO mostrar todos los registros (ingresos y egresos) en el PDF

3.4 WHEN el usuario tiene rol "Dueño" THEN el sistema SHALL CONTINUE TO incluir la sección de depósitos bancarios al final del reporte

3.5 WHEN se exporta el reporte a XLSX THEN el sistema SHALL CONTINUE TO usar el formato actual de Excel sin cambios

3.6 WHEN se genera el PDF THEN el sistema SHALL CONTINUE TO incluir la sección de resumen semanal con totales de ingresos, egresos, balance neto, y (para Dueño) total depositado y saldo disponible

3.7 WHEN se ordenan los registros en el PDF THEN el sistema SHALL CONTINUE TO ordenarlos cronológicamente por fecha y hora de creación

3.8 WHEN se genera el nombre del archivo PDF THEN el sistema SHALL CONTINUE TO usar el formato "reporte_[fecha_inicio]_[fecha_fin].pdf"
