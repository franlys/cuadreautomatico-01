# Limpiar IndexedDB

## ⚠️ Problema

Si ves errores de Dexie como:
```
DexieError: Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key
```

Esto significa que el esquema de IndexedDB cambió y necesitas limpiar la base de datos local.

---

## 🔧 Solución Rápida

### Opción 1: Desde DevTools (Recomendado)

1. Abre DevTools (F12)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral, busca **Storage** → **IndexedDB**
4. Haz clic derecho en **CuadreAutomatico**
5. Selecciona **Delete database**
6. Recarga la página (F5)

### Opción 2: Desde la Consola

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Ejecuta este comando:
```javascript
indexedDB.deleteDatabase('CuadreAutomatico')
```
4. Recarga la página (F5)

### Opción 3: Limpiar Todo el Storage

1. Abre DevTools (F12)
2. Ve a la pestaña **Application**
3. En el menú lateral, busca **Storage**
4. Haz clic en **Clear site data**
5. Marca todas las opciones
6. Haz clic en **Clear data**
7. Recarga la página (F5)

---

## 📝 ¿Por Qué Sucede Esto?

El esquema de IndexedDB cambió de:
```typescript
// ANTES (incorrecto)
registros_pendientes: '++id, ...'  // autoincremento numérico

// AHORA (correcto)
registros_pendientes: 'id, ...'    // UUID string
```

Como `Registro.id` es un UUID (string), no puede usar autoincremento numérico (`++id`).

---

## ✅ Verificación

Después de limpiar, verifica que:
1. No hay errores en la consola
2. El indicador de sincronización aparece correctamente
3. Puedes crear registros sin errores

---

## 🔄 Migración Automática (Futuro)

Para evitar este problema en el futuro, se puede implementar migración automática:

```typescript
// En db.ts
this.version(2).stores({
  registros_pendientes: 'id, folder_diario_id, tipo, sincronizado, created_at',
  // ... resto de tablas
}).upgrade(tx => {
  // Migrar datos si es necesario
  return tx.table('registros_pendientes').clear();
});
```

Pero por ahora, la limpieza manual es más rápida y segura.

