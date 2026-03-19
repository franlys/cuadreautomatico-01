# Guía de Despliegue en Vercel

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:
- ✅ Código subido a GitHub: https://github.com/franlys/cuadreautomatico-01.git
- ✅ Proyecto de Supabase configurado
- ✅ Credenciales de Supabase (URL y Anon Key)

---

## 🚀 Paso 1: Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Haz clic en "Sign Up"
3. Selecciona "Continue with GitHub"
4. Autoriza a Vercel para acceder a tu cuenta de GitHub

---

## 🔗 Paso 2: Importar Proyecto desde GitHub

1. En el dashboard de Vercel, haz clic en "Add New..."
2. Selecciona "Project"
3. Busca el repositorio `cuadreautomatico-01`
4. Haz clic en "Import"

---

## ⚙️ Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", agrega las siguientes variables:

### Variables Requeridas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://emifgmstkhkpgrshlsnt.supabase.co` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Anon Key de Supabase |

### Variables Opcionales

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_DUENO_EMAIL` | `dueno@empresa.com` | Email del dueño para reportes |
| `VITE_DUENO_WHATSAPP` | `+521234567890` | WhatsApp del dueño |

**IMPORTANTE**: Asegúrate de que todas las variables empiecen con `VITE_` para que Vite las incluya en el build.

---

## 🏗️ Paso 4: Configurar Build Settings

Vercel debería detectar automáticamente la configuración, pero verifica:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## 🚀 Paso 5: Desplegar

1. Haz clic en "Deploy"
2. Espera a que termine el build (2-3 minutos)
3. Una vez completado, verás el mensaje "Congratulations!"
4. Haz clic en "Visit" para ver tu aplicación en producción

---

## 🌐 Paso 6: Configurar Dominio (Opcional)

### Dominio de Vercel (Gratis)

Tu app estará disponible en:
```
https://cuadreautomatico-01.vercel.app
```

### Dominio Personalizado

1. Ve a "Settings" → "Domains"
2. Haz clic en "Add"
3. Ingresa tu dominio (ej: `cuadre.tuempresa.com`)
4. Sigue las instrucciones para configurar DNS

---

## 🔒 Paso 7: Configurar HTTPS

Vercel proporciona HTTPS automáticamente:
- ✅ Certificado SSL gratuito
- ✅ Renovación automática
- ✅ HTTP/2 habilitado

No necesitas hacer nada adicional.

---

## 📱 Paso 8: Verificar PWA

1. Abre tu app en producción
2. En Chrome/Edge, busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar"
4. Verifica que la app se instale correctamente

---

## ✅ Paso 9: Verificación Post-Despliegue

### Checklist de Verificación

- [ ] La app carga correctamente
- [ ] Login funciona con usuarios de Supabase
- [ ] Se pueden crear registros
- [ ] Se pueden subir evidencias
- [ ] Dashboard del Dueño muestra datos
- [ ] Exportación PDF funciona
- [ ] Exportación XLSX funciona
- [ ] PWA se puede instalar
- [ ] Modo offline funciona (después de instalar PWA)

### Probar Funcionalidades Básicas

1. **Login**
   ```
   Email: franlys@cuadre.com
   Password: tu_password
   ```

2. **Crear Registro**
   - Ve a "Folder Diario"
   - Crea un ingreso o egreso
   - Verifica que se guarde en Supabase

3. **Subir Evidencia**
   - Selecciona un registro
   - Sube una imagen o PDF
   - Verifica que se suba a Supabase Storage

4. **Dashboard**
   - Ve a "Dashboard Dueño"
   - Verifica que muestre datos correctos
   - Prueba navegación entre semanas

5. **Exportación**
   - Exporta un folder a PDF
   - Exporta resumen semanal a XLSX
   - Verifica que los archivos se descarguen

---

## 🔄 Paso 10: Configurar Despliegues Automáticos

Vercel ya configuró despliegues automáticos:

- **Push a `main`**: Despliega a producción automáticamente
- **Pull Request**: Crea preview deployment
- **Commits**: Cada commit genera un preview único

### Hacer Cambios y Desplegar

```bash
# 1. Hacer cambios en el código
# 2. Commit y push
git add .
git commit -m "Descripción de cambios"
git push origin main

# 3. Vercel desplegará automáticamente
```

---

## 🐛 Troubleshooting

### Error: "Build failed"

**Problema**: El build falla en Vercel

**Solución**:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de build en Vercel
3. Asegúrate de que el build funcione localmente:
   ```bash
   npm run build
   ```

### Error: "Cannot connect to Supabase"

**Problema**: La app no puede conectarse a Supabase

**Solución**:
1. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
2. Verifica que las variables empiecen con `VITE_`
3. Redeploy después de agregar variables:
   - Ve a "Deployments"
   - Haz clic en "..." → "Redeploy"

### Error: "PWA not installing"

**Problema**: La PWA no se puede instalar

**Solución**:
1. Verifica que estés usando HTTPS (Vercel lo proporciona automáticamente)
2. Limpia caché del navegador
3. Verifica que `vite.config.ts` tenga la configuración PWA
4. Revisa la consola del navegador para errores

### Error: "Images not loading"

**Problema**: Las imágenes no cargan desde Supabase Storage

**Solución**:
1. Verifica que el bucket `evidencias` exista en Supabase
2. Verifica que el bucket sea público o tenga las políticas RLS correctas
3. Revisa la configuración de CORS en Supabase Storage

---

## 📊 Monitoreo

### Analytics de Vercel

Vercel proporciona analytics básicos:
- Visitas por página
- Tiempo de carga
- Errores de servidor
- Uso de ancho de banda

### Logs en Tiempo Real

1. Ve a tu proyecto en Vercel
2. Haz clic en "Logs"
3. Selecciona "Runtime Logs" para ver logs en tiempo real

---

## 💰 Costos

### Plan Hobby (Gratis)

- ✅ Despliegues ilimitados
- ✅ 100 GB de ancho de banda/mes
- ✅ HTTPS automático
- ✅ Dominio de Vercel incluido
- ✅ Despliegues automáticos desde Git

### Límites del Plan Gratis

- 100 GB de ancho de banda/mes
- 100 GB-Horas de ejecución/mes
- 6,000 minutos de build/mes

**Para este proyecto**: El plan gratis es más que suficiente para empezar.

---

## 🎉 ¡Listo!

Tu aplicación está desplegada y lista para usar en:
```
https://cuadreautomatico-01.vercel.app
```

### Próximos Pasos

1. **Crear usuarios** en Supabase Auth
2. **Crear perfiles** con roles apropiados
3. **Cargar catálogos** iniciales (empleados, rutas, conceptos)
4. **Capacitar usuarios** en el uso de la aplicación
5. **Monitorear** el uso y rendimiento

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Revisa los logs en Supabase Dashboard
3. Consulta la documentación en el repositorio
4. Revisa `PROXIMOS_PASOS.md` para más información

