# Especificaciones: Gestión Manual de Folders Diarios

## Contexto del negocio
- Empresa opera **lunes a sábado**. Los domingos no se trabaja.
- El sábado es el día más largo: cubre lo recibido el sábado Y lo recibido el lunes
  (porque el domingo no hay trabajo y el lunes se cobran cosas del sábado anterior).
- El usuario necesita control total sobre cuándo abrir y cerrar cada día.

---

## Problemas actuales a resolver

### BUG-01: Error duplicate key en folder
**Causa**: Hoy es lunes → `obtenerFechaLaboral()` devuelve sábado anterior →
`obtenerRangoSemanaLaboral(hoy)` devuelve la semana nueva (lunes-sábado de esta semana) →
se intenta crear folder para sábado bajo la semana nueva →
ya existe un folder para ese sábado bajo la semana anterior → conflicto de PK.

**Fix**: Buscar folder solo por `fecha_laboral + empresa_id` (sin filtro de semana).
Al crear un folder nuevo, calcular la semana basándose en `fechaLaboral`, no en `hoy`.

### BUG-02: Cierre de día por timezone del servidor
**Causa**: El servidor (Vercel/Supabase) usa UTC. Si el usuario está en UTC-4 (RD),
las 8pm locales son medianoche UTC → el día "cambia" para el servidor antes de tiempo.

**Fix**: `obtenerFechaLaboral()` debe usar hora local del usuario (no `.toISOString()`
que convierte a UTC). Usar formato `YYYY-MM-DD` basado en fecha local.

### BUG-03: No hay historial de folders diarios visibles
El `FolderDiarioPage` solo muestra el folder de HOY. No hay forma de ver días anteriores.

---

## Requisitos nuevos

### R1: Apertura manual de días
- El usuario debe presionar un botón **"Abrir Día"** para iniciar el folder del día.
- El sistema NO debe crear un folder automáticamente al cargar la página.
- Al presionar "Abrir Día", el sistema determina la fecha laboral correcta (Regla del Lunes).
- Si ya existe un folder para esa fecha, lo muestra (no crea duplicado).

### R2: Cierre manual de días
- El usuario puede cerrar el folder en cualquier momento con el botón existente.
- Una vez cerrado, no se pueden agregar registros.
- El dueño puede **reabrir** un folder cerrado si necesita corregir algo.

### R3: Regla del Sábado extendido
- El sábado se considera el día más largo de la semana.
- El folder del sábado puede permanecer abierto hasta que el usuario lo cierre manualmente.
- El lunes, si el folder del sábado anterior sigue abierto, se continúa usando ese folder.
- El lunes NO crea un folder nuevo si el sábado anterior no está cerrado.
- Si el sábado anterior ya está cerrado cuando llega el lunes, se puede abrir un nuevo folder
  (que usará la fecha laboral del lunes como excepción, o será vinculado al sábado según config).

### R4: Sin folders de domingo
- Si el día es domingo, la app muestra "No se trabaja los domingos".
- No se crea ningún folder para domingo.
- `obtenerFechaLaboral(domingo)` no debe usarse en ningún auto-create.

### R5: Historial de folders diarios
- `FolderDiarioPage` debe mostrar una lista de todos los folders de la semana actual.
- Cada folder en el historial muestra: fecha, total ingresos, total egresos, balance, estado.
- El usuario puede hacer clic en cualquier folder del historial para ver sus registros.
- Exportación disponible por día individual (PDF/XLSX de un solo día).

### R6: Selección libre de folder activo
- El usuario puede cambiar entre folders (ver registros de un día anterior).
- Solo el folder abierto (no cerrado) permite agregar nuevos registros.
- Los folders cerrados son de solo lectura.

---

## Flujo de usuario esperado

```
Lunes por la mañana:
  ┌─ App abre → muestra historial de la semana anterior
  ├─ Si sábado anterior está ABIERTO → pregunta: ¿continuar con el sábado?
  │   └─ Sí → muestra folder del sábado para seguir registrando
  └─ Si sábado anterior está CERRADO → botón "Abrir Día" (abre el lunes)

Martes a Sábado:
  ┌─ App abre → muestra historial de la semana actual
  └─ Botón "Abrir Día" → crea/abre folder para hoy

Domingo:
  └─ App muestra: "Hoy es domingo. No hay trabajo programado."
```

---

## Cambios técnicos requeridos

### `src/utils/fechaLaboral.ts`
- Cambiar `toISOString().split('T')[0]` → usar fecha local del browser:
  ```typescript
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month+1)}-${pad(day)}`;
  ```

### `src/stores/folderStore.ts`
- `obtenerOCrearFolderActual`: buscar folder por `fecha_laboral + empresa_id` sin filtro de semana.
- Al crear folder nuevo: calcular semana basada en `fechaLaboral` (no en `hoy`).
- Manejar error `23505` (duplicate key): hacer SELECT y retornar el existente.
- Agregar acción `reabrirFolder(folderId)`.

### `src/pages/FolderDiarioPage.tsx`
- Eliminar llamada automática a `obtenerOCrearFolderActual()` en `useEffect`.
- Mostrar botón "Abrir Día" si no hay folder activo.
- Mostrar historial de folders de la semana actual.
- Si domingo: mostrar mensaje en lugar del formulario.

### `src/components/FolderDiario.tsx`
- Mostrar lista de folders de la semana actual.
- Cada folder con botón "Ver registros" y opción de exportar ese día.

---

## Prioridad de implementación

1. **URGENTE** — BUG-01 (duplicate key) + BUG-02 (timezone) → bloquean el uso diario
2. **ALTO** — BUG-03 (historial) → usuarios no pueden ver sus datos
3. **MEDIO** — R1, R3 (apertura manual + regla sábado extendido)
4. **NORMAL** — R2, R4, R5, R6 (resto de mejoras)
