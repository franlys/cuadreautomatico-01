---
inclusion: auto
---

# Steering: Proyecto Cuadre Automático

## Contexto del Proyecto

Sistema PWA para gestión de ingresos y egresos diarios de una empresa de envíos y embarques. El sistema maneja folders diarios, semanas laborales, depósitos bancarios y generación de reportes.

## Reglas de Negocio Críticas

### Regla del Lunes
**IMPORTANTE**: Los registros ingresados el lunes pertenecen al sábado anterior porque el negocio opera de lunes a sábado y los domingos no se trabaja.

- Implementada en: `src/utils/fechaLaboral.ts`
- Función: `obtenerFechaLaboral(fecha: Date): string`
- Lógica: Si es lunes (día 1), retroceder 2 días para llegar al sábado anterior

### Semana Laboral
- **Días laborales**: Lunes a Sábado (6 días)
- **Día de descanso**: Domingo
- **Inicio de semana**: Lunes
- **Fin de semana**: Sábado

### Roles y Permisos
1. **Usuario_Ingresos**: Solo registra y ve ingresos
2. **Usuario_Egresos**: Solo registra y ve egresos
3. **Dueño**: Ve todo, puede cerrar folders, gestionar depósitos y catálogos

### Inmutabilidad de Folders
- Solo el Dueño puede cerrar un folder
- Una vez cerrado, NO se pueden agregar más registros
- Los balances de folders cerrados son definitivos

### Cálculo de Balances
- **Balance Diario**: `total_ingresos - total_egresos`
- **Balance Semanal**: Suma de balances diarios
- **Saldo Disponible**: `balance_neto - total_depositos`
- Los cálculos son AUTOMÁTICOS mediante triggers PostgreSQL

## Estándares de Código

### Idioma
- **Comentarios**: Español
- **Nombres de variables**: camelCase en inglés
- **Nombres de funciones**: camelCase en inglés
- **Mensajes de usuario**: Español
- **Documentación**: Español

### Estructura de Componentes React
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 2. Interfaces/Types
interface ComponentProps {
  // ...
}

// 3. Componente
export function ComponentName({ props }: ComponentProps) {
  // 3.1 Hooks de estado
  const [data, setData] = useState();
  
  // 3.2 Hooks de efecto
  useEffect(() => {
    // ...
  }, []);
  
  // 3.3 Funciones auxiliares
  const handleAction = async () => {
    // ...
  };
  
  // 3.4 Render
  return (
    // JSX
  );
}
```

### Manejo de Errores
```typescript
try {
  setLoading(true);
  setError(null);
  
  // Operación
  const { data, error } = await supabase...;
  if (error) throw error;
  
  // Éxito
  alert('Operación exitosa');
} catch (err: any) {
  setError(err.message);
  alert(`Error: ${err.message}`);
} finally {
  setLoading(false);
}
```

### Validaciones
- **Cliente**: Validar ANTES de enviar a servidor
- **Servidor**: RLS y constraints en PostgreSQL
- **Mensajes**: Descriptivos en español

### Stores Zustand
```typescript
export const useStore = create<State>((set, get) => ({
  // Estado
  data: null,
  loading: false,
  error: null,
  
  // Acciones
  fetchData: async () => {
    try {
      set({ loading: true, error: null });
      // Lógica
      set({ data: result, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

## Convenciones de Nombres

### Tablas PostgreSQL
- Plural en español: `registros`, `folders_diarios`, `semanas_laborales`
- Snake_case: `semana_laboral_id`, `folder_diario_id`

### Componentes React
- PascalCase: `FormularioRegistro`, `ListaRegistros`
- Sufijos descriptivos: `Form`, `List`, `Button`, `Page`

### Funciones
- Verbos en infinitivo: `cargarDatos`, `validarFormulario`
- Handlers: `handleSubmit`, `handleClick`
- Async: Siempre con `async/await`, nunca `.then()`

### Variables de Estado
- Descriptivas: `loading`, `error`, `registros`
- Booleanos: `esDueno`, `estaCerrado`, `puedeEditar`

## Stack Tecnológico

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS (sin componentes externos)
- Zustand para estado global
- jsPDF + SheetJS para exportación

### Backend
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Edge Functions (Deno) para notificaciones
- Row Level Security (RLS) para permisos

### Offline (Futuro)
- Dexie.js para IndexedDB
- Workbox para Service Worker

## Patrones de Diseño

### Actualización en Tiempo Real
```typescript
useEffect(() => {
  if (id) {
    const subscription = supabase
      .channel('channel-name')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_name',
        filter: `id=eq.${id}`,
      }, () => {
        refrescarDatos();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }
}, [id]);
```

### Carga de Datos
```typescript
const cargarDatos = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('tabla')
      .select('*')
      .eq('campo', valor);
    
    if (error) throw error;
    setDatos(data || []);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    setLoading(false);
  }
};
```

### Validación de Formularios
```typescript
const validarFormulario = (): boolean => {
  const errores: Record<string, string> = {};
  
  if (!campo.trim()) {
    errores.campo = 'El campo es requerido';
  }
  
  if (monto <= 0) {
    errores.monto = 'El monto debe ser mayor a 0';
  }
  
  setErrores(errores);
  return Object.keys(errores).length === 0;
};
```

## Seguridad

### Autenticación
- Usar `useAuth()` hook para obtener usuario y perfil
- Verificar rol antes de mostrar/ejecutar acciones
- AuthGuard para proteger rutas

### RLS (Row Level Security)
- TODAS las tablas tienen RLS habilitado
- Políticas por rol en cada tabla
- Verificar permisos en servidor, no solo en cliente

### Storage
- Bucket privado para evidencias
- URLs firmadas con expiración (1 hora)
- Políticas de acceso por rol

## Testing (Futuro)

### Property-Based Testing
- Usar fast-check para propiedades
- Mínimo 100 iteraciones por prueba
- Validar invariantes del sistema

### Tests Unitarios
- Vitest para tests
- Casos concretos y condiciones de error
- Mocks para Supabase

## Deployment

### Variables de Entorno
```bash
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
```

### Build
```bash
npm run build
# Archivos en dist/
```

### Verificaciones Pre-Deploy
1. ✅ Todas las variables de entorno configuradas
2. ✅ Script de base de datos ejecutado
3. ✅ Usuarios de prueba creados
4. ✅ Catálogos iniciales cargados
5. ✅ Storage bucket configurado

## Troubleshooting Común

### "No se calculan los balances"
- Verificar que los triggers estén creados
- Revisar que las columnas generadas existan
- Refrescar la página

### "No puedo subir evidencias"
- Verificar bucket `evidencias` en Storage
- Verificar políticas de acceso
- Verificar tamaño < 10MB y formato (JPG/PNG/PDF)

### "Regla del Lunes no funciona"
- Verificar función `obtenerFechaLaboral()`
- Verificar que se use al crear registros
- Verificar zona horaria del servidor

## Referencias Rápidas

### Archivos Clave
- `src/utils/fechaLaboral.ts` - Regla del Lunes
- `src/stores/authStore.ts` - Autenticación
- `src/stores/folderStore.ts` - Folders y semanas
- `supabase/triggers.sql` - Cálculos automáticos
- `supabase/rls.sql` - Permisos por rol

### Documentación
- `IMPLEMENTACION_COMPLETADA.md` - Resumen técnico
- `GUIA_INICIO_RAPIDO.md` - Setup inicial
- `COMANDOS_UTILES.md` - Comandos de desarrollo
- `supabase/README.md` - Base de datos
- `supabase/auth-config.md` - Configuración de auth

---

**Nota**: Este steering file se incluye automáticamente en todas las conversaciones sobre este proyecto.
