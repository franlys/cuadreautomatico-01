# Guía PWA - Cuadre Automático

## 🎯 ¿Qué es PWA?

PWA (Progressive Web App) permite que la aplicación web funcione como una app nativa:
- ✅ Instalable en dispositivos móviles y escritorio
- ✅ Funciona sin conexión a internet (modo offline)
- ✅ Sincronización automática cuando hay conexión
- ✅ Caché inteligente para mejor rendimiento

---

## 📱 Cómo Instalar la PWA

### En Android (Chrome/Edge)

1. Abre la aplicación en el navegador
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"
4. Confirma la instalación
5. La app aparecerá en tu pantalla de inicio

### En iOS (Safari)

1. Abre la aplicación en Safari
2. Toca el botón de compartir (□↑)
3. Desplázate y selecciona "Agregar a pantalla de inicio"
4. Personaliza el nombre si deseas
5. Toca "Agregar"
6. La app aparecerá en tu pantalla de inicio

### En Windows (Chrome/Edge)

1. Abre la aplicación en el navegador
2. Busca el ícono de instalación (⊕) en la barra de direcciones
3. Haz clic en "Instalar"
4. La app se abrirá en una ventana independiente
5. Se agregará un acceso directo al menú de inicio

### En macOS (Chrome/Safari)

1. Abre la aplicación en el navegador
2. En Chrome: Menú → "Instalar Cuadre Automático"
3. En Safari: Archivo → "Agregar a Dock"
4. La app se abrirá en una ventana independiente

---

## 🔌 Modo Offline

### ¿Cómo Funciona?

La aplicación usa **IndexedDB** (Dexie) para almacenar datos localmente:
- Todos los registros se guardan en tu dispositivo
- Puedes crear, editar y eliminar registros sin conexión
- Los cambios se sincronizan automáticamente cuando hay conexión
- Las evidencias se guardan localmente hasta que se puedan subir

### Estrategia de Caché

**NetworkFirst**: Intenta obtener datos de la red primero, si falla usa el caché
- Siempre obtienes los datos más recientes cuando hay conexión
- Si no hay conexión, usa los datos guardados localmente
- Caché de Supabase válido por 24 horas

### Datos que se Guardan Offline

✅ **Registros de ingresos y egresos**
✅ **Depósitos bancarios**
✅ **Catálogos** (empleados, rutas, conceptos)
✅ **Folders diarios**
✅ **Perfil de usuario**

⚠️ **Evidencias**: Se guardan localmente hasta que haya conexión

---

## 🔄 Sincronización

### Sincronización Automática

La app sincroniza automáticamente cuando:
- Recuperas la conexión a internet
- Abres la aplicación con conexión
- Cambias de pestaña y vuelves a la app

### Indicador de Estado

En la esquina superior derecha verás:
- 🟢 **Verde**: Conectado y sincronizado
- 🟡 **Amarillo**: Sincronizando...
- 🔴 **Rojo**: Sin conexión (modo offline)

### Resolución de Conflictos

Si dos usuarios editan el mismo registro offline:
1. El sistema detecta el conflicto
2. Se mantiene el cambio más reciente (por timestamp)
3. Se notifica al usuario del conflicto
4. El usuario puede revisar y ajustar si es necesario

---

## 🧪 Cómo Probar el Modo Offline

### Prueba 1: Crear Registro Offline

1. Abre la aplicación con conexión
2. Espera a que cargue completamente
3. Desactiva tu conexión a internet (modo avión o WiFi)
4. Crea un nuevo registro de ingreso o egreso
5. Verifica que se guarde correctamente
6. Reactiva la conexión
7. Verifica que el registro se sincronice con Supabase

### Prueba 2: Editar Registro Offline

1. Abre la aplicación con conexión
2. Carga un registro existente
3. Desactiva tu conexión a internet
4. Edita el registro
5. Guarda los cambios
6. Reactiva la conexión
7. Verifica que los cambios se sincronicen

### Prueba 3: Subir Evidencia Offline

1. Abre la aplicación con conexión
2. Desactiva tu conexión a internet
3. Intenta subir una evidencia
4. La evidencia se guardará localmente
5. Reactiva la conexión
6. La evidencia se subirá automáticamente

### Prueba 4: Login Offline

1. Inicia sesión con conexión
2. Cierra la aplicación
3. Desactiva tu conexión a internet
4. Abre la aplicación
5. Deberías poder acceder sin volver a iniciar sesión
6. Puedes navegar y ver datos guardados

---

## ⚙️ Configuración Técnica

### Service Worker

El Service Worker se registra automáticamente y gestiona:
- Caché de archivos estáticos (JS, CSS, HTML, imágenes)
- Caché de respuestas de Supabase
- Estrategias de caché personalizadas
- Actualización automática de la app

### IndexedDB (Dexie)

Base de datos local con las siguientes tablas:
- `registros`: Ingresos y egresos
- `depositos`: Depósitos bancarios
- `empleados`: Catálogo de empleados
- `rutas`: Catálogo de rutas
- `conceptos`: Catálogo de conceptos
- `folders_diarios`: Folders diarios
- `evidencias_pendientes`: Evidencias por subir

### Tamaño de Almacenamiento

- **Cuota típica**: 50-100 MB en móviles, varios GB en escritorio
- **Uso estimado**: ~1-5 MB por semana de datos
- **Limpieza automática**: Datos antiguos se pueden limpiar manualmente

---

## 🐛 Troubleshooting

### La app no se instala

**Problema**: No aparece la opción de instalar
**Solución**:
1. Verifica que estés usando HTTPS (en producción)
2. Verifica que el navegador soporte PWA
3. Recarga la página (Ctrl+F5)
4. Limpia caché del navegador

### Los datos no se sincronizan

**Problema**: Los cambios offline no se suben
**Solución**:
1. Verifica que tengas conexión a internet
2. Abre las DevTools → Application → Service Workers
3. Verifica que el Service Worker esté activo
4. Haz clic en "Update" para forzar actualización
5. Recarga la página

### Error "QuotaExceededError"

**Problema**: Se acabó el espacio de almacenamiento
**Solución**:
1. Limpia datos antiguos de IndexedDB
2. Elimina evidencias locales ya subidas
3. Limpia caché del navegador
4. En DevTools → Application → Clear storage

### La app no funciona offline

**Problema**: Aparece error sin conexión
**Solución**:
1. Verifica que hayas abierto la app con conexión al menos una vez
2. Verifica que el Service Worker esté registrado
3. En DevTools → Application → Service Workers → verifica estado
4. Desinstala y reinstala la PWA

### Conflictos de sincronización

**Problema**: Datos duplicados o inconsistentes
**Solución**:
1. Revisa el indicador de estado de sincronización
2. Espera a que termine la sincronización
3. Si persiste, limpia IndexedDB y recarga datos
4. Contacta al administrador si el problema continúa

---

## 📊 Monitoreo

### En Desarrollo

Abre DevTools (F12) y ve a:
- **Application → Service Workers**: Estado del SW
- **Application → Storage → IndexedDB**: Datos locales
- **Application → Storage → Cache Storage**: Archivos en caché
- **Network**: Peticiones de red y caché

### En Producción

Monitorea en Supabase Dashboard:
- **Database → Logs**: Errores de sincronización
- **Storage → Usage**: Uso de almacenamiento
- **Auth → Users**: Usuarios activos

---

## ✅ Checklist de Verificación PWA

### Antes de Producción
- [ ] Service Worker registrado correctamente
- [ ] Manifest configurado con íconos
- [ ] HTTPS habilitado
- [ ] Caché funcionando correctamente
- [ ] IndexedDB guardando datos
- [ ] Sincronización funcionando
- [ ] Modo offline probado
- [ ] Instalación probada en Android
- [ ] Instalación probada en iOS
- [ ] Instalación probada en Windows
- [ ] Resolución de conflictos probada

### Después de Producción
- [ ] Usuarios pueden instalar la app
- [ ] Modo offline funciona correctamente
- [ ] Sincronización es confiable
- [ ] No hay errores en consola
- [ ] Rendimiento es aceptable
- [ ] Usuarios capacitados en uso offline

---

## 🎉 ¡Listo!

Tu PWA está configurada y lista para usar. Los usuarios pueden instalarla en sus dispositivos y trabajar sin conexión.

**Beneficios**:
- ✅ Acceso rápido desde pantalla de inicio
- ✅ Funciona sin internet
- ✅ Sincronización automática
- ✅ Mejor rendimiento con caché
- ✅ Experiencia similar a app nativa

