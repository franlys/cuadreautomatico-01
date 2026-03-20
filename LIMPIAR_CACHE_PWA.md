# Cómo Limpiar el Caché del PWA en el Teléfono

Si la app sigue mostrando una versión antigua después de actualizar, sigue estos pasos:

## Opción 1: Limpiar desde el Navegador (Recomendado)

### En Chrome/Edge (Android):
1. Abre Chrome y ve a `chrome://serviceworker-internals/`
2. Busca `cuadreautomatico` en la lista
3. Haz clic en "Unregister" para desregistrar el Service Worker
4. Ve a `chrome://settings/siteData`
5. Busca tu sitio y haz clic en el icono de basura para eliminar los datos
6. Cierra y vuelve a abrir el navegador
7. Visita la app nuevamente desde el navegador (no desde el icono de la app)

### En Safari (iOS):
1. Ve a Configuración → Safari
2. Desplázate hacia abajo y toca "Avanzado"
3. Toca "Datos de sitios web"
4. Busca tu sitio y desliza para eliminar
5. Vuelve a Safari y toca "Borrar historial y datos de sitios web"
6. Visita la app nuevamente desde Safari

## Opción 2: Desinstalar y Reinstalar la PWA

### Android:
1. Mantén presionado el icono de la app en la pantalla de inicio
2. Selecciona "Desinstalar" o "Eliminar"
3. Abre Chrome y visita la URL de la app
4. Cuando aparezca el banner "Agregar a pantalla de inicio", acéptalo
5. O ve al menú (⋮) → "Instalar aplicación"

### iOS:
1. Mantén presionado el icono de la app
2. Toca "Eliminar app"
3. Abre Safari y visita la URL de la app
4. Toca el botón de compartir (cuadrado con flecha)
5. Desplázate y toca "Agregar a pantalla de inicio"

## Opción 3: Forzar Actualización desde la App

Si ves una notificación azul que dice "Nueva versión disponible":
1. Haz clic en "Actualizar ahora"
2. La app se recargará automáticamente con la nueva versión

## Verificar que Tienes la Versión Correcta

Después de actualizar, verifica que:
- ✅ El formulario de "Registrar Ingreso" NO muestra el campo "Concepto"
- ✅ El formulario de "Registrar Ingreso" SÍ muestra "Empleado" y "Ruta"
- ✅ El formulario de "Registrar Egreso" SÍ muestra el campo "Concepto"
- ✅ El formulario de "Registrar Egreso" NO muestra "Ruta"
- ✅ NO aparece el recuadro azul de "Debug Auth"

## Si Nada Funciona

Como último recurso:
1. Desinstala completamente la app
2. Borra todos los datos del navegador
3. Reinicia el teléfono
4. Vuelve a instalar la app desde el navegador

## Versión Actual

Versión: **1.0.2**
Última actualización: 19 de marzo de 2026
