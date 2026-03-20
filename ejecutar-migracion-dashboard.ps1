# Script para Facilitar Migracion via Dashboard
# Este script abre el SQL Editor y copia cada script al portapapeles

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     MIGRACION MULTI-TENANT - ASISTENTE AUTOMATICO     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# URL del SQL Editor
$sqlEditorUrl = "https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/sql/new"

# Lista de scripts
$scripts = @(
    @{Num=1; File="supabase/multi-tenant-empresas.sql"; Desc="Crear tabla empresas y tipo enum"},
    @{Num=2; File="supabase/multi-tenant-add-empresa-id.sql"; Desc="Agregar empresa_id a todas las tablas"},
    @{Num=3; File="supabase/multi-tenant-rls-base.sql"; Desc="Crear politicas RLS base"},
    @{Num=4; File="supabase/multi-tenant-rls-super-admin.sql"; Desc="Crear politicas RLS Super_Admin"},
    @{Num=5; File="supabase/multi-tenant-storage-policies.sql"; Desc="Crear politicas de Storage"},
    @{Num=6; File="supabase/multi-tenant-automation-tables.sql"; Desc="Crear tablas de automatizacion"},
    @{Num=7; File="supabase/migrate-to-empresa-1.sql"; Desc="Migrar datos a Empresa 1"},
    @{Num=8; File="supabase/verificar-migracion.sql"; Desc="Verificar migracion"}
)

Write-Host "Se ejecutaran $($scripts.Count) scripts en orden" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona ENTER para abrir el SQL Editor y comenzar..." -ForegroundColor Yellow
Read-Host

# Abrir SQL Editor en el navegador
Start-Process $sqlEditorUrl
Start-Sleep -Seconds 2

foreach ($script in $scripts) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  PASO $($script.Num)/$($scripts.Count): $($script.Desc)" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path $script.File) {
        # Leer y copiar al portapapeles
        $content = Get-Content $script.File -Raw
        $content | Set-Clipboard
        
        Write-Host "[OK] Contenido copiado al portapapeles" -ForegroundColor Green
        Write-Host ""
        Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
        Write-Host "   1. Ve a la pestana del SQL Editor en tu navegador" -ForegroundColor White
        Write-Host "   2. Pega el contenido (Ctrl+V)" -ForegroundColor White
        Write-Host "   3. Haz clic en RUN (o presiona Ctrl+Enter)" -ForegroundColor White
        Write-Host "   4. Espera a que termine (debe mostrar Success o mensajes NOTICE)" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANTE: Verifica que NO haya errores antes de continuar" -ForegroundColor Red
        Write-Host ""
        
        # Esperar confirmacion
        do {
            $response = Read-Host "El script se ejecuto correctamente? (s/n/r para reintentar)"
            
            if ($response -eq "r" -or $response -eq "R") {
                Write-Host "Copiando nuevamente al portapapeles..." -ForegroundColor Yellow
                $content | Set-Clipboard
                Write-Host "[OK] Contenido copiado nuevamente" -ForegroundColor Green
            }
        } while ($response -eq "r" -or $response -eq "R")
        
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host ""
            Write-Host "[ERROR] Migracion abortada por el usuario" -ForegroundColor Red
            Write-Host ""
            Write-Host "Si hubo un error:" -ForegroundColor Yellow
            Write-Host "  1. Copia el mensaje de error completo" -ForegroundColor White
            Write-Host "  2. Revisa el script que fallo: $($script.File)" -ForegroundColor White
            Write-Host "  3. Puedes ejecutar rollback: supabase/rollback-empresa-1.sql" -ForegroundColor White
            Write-Host ""
            exit 1
        }
        
        Write-Host "[OK] Paso $($script.Num) completado" -ForegroundColor Green
        
    } else {
        Write-Host "[ERROR] Archivo no encontrado: $($script.File)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "       [OK] MIGRACION COMPLETADA EXITOSAMENTE          " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "  - $($scripts.Count) scripts ejecutados correctamente" -ForegroundColor White
Write-Host "  - Base de datos transformada a multi-tenant" -ForegroundColor White
Write-Host "  - Datos migrados a Empresa 1" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "  1. Verifica que los usuarios pueden iniciar sesion" -ForegroundColor White
Write-Host "  2. Verifica que los datos historicos estan disponibles" -ForegroundColor White
Write-Host "  3. Crea un usuario Super_Admin (supabase/crear-super-admin.sql)" -ForegroundColor White
Write-Host "  4. Continua con la Tarea 12 del spec" -ForegroundColor White
Write-Host ""
Write-Host "Documentacion completa en: GUIA_MIGRACION_RAPIDA.md" -ForegroundColor Gray
Write-Host ""

