# ============================================
# Script Simple para Migración Multi-Tenant
# ============================================
# Este script lee cada archivo SQL y te permite copiarlo
# al portapapeles para pegarlo en el SQL Editor de Supabase

Write-Host "=== Migración Multi-Tenant - Asistente ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script te ayudará a ejecutar la migración paso a paso." -ForegroundColor Yellow
Write-Host "Abrirá cada archivo SQL para que lo copies y pegues en el SQL Editor de Supabase." -ForegroundColor Yellow
Write-Host ""

# Lista de archivos SQL en orden
$SQL_FILES = @(
    @{Num=1; File="supabase/multi-tenant-empresas.sql"; Desc="Crear tabla empresas"},
    @{Num=2; File="supabase/multi-tenant-add-empresa-id.sql"; Desc="Agregar empresa_id a tablas"},
    @{Num=3; File="supabase/multi-tenant-rls-base.sql"; Desc="Políticas RLS base"},
    @{Num=4; File="supabase/multi-tenant-rls-super-admin.sql"; Desc="Políticas RLS Super_Admin"},
    @{Num=5; File="supabase/multi-tenant-storage-policies.sql"; Desc="Políticas de Storage"},
    @{Num=6; File="supabase/multi-tenant-automation-tables.sql"; Desc="Tablas de automatización"},
    @{Num=7; File="supabase/migrate-to-empresa-1.sql"; Desc="Migrar datos a Empresa 1"},
    @{Num=8; File="supabase/verificar-migracion.sql"; Desc="Verificar migración"}
)

Write-Host "URL del SQL Editor: https://supabase.com/dashboard/project/emifgmstkhkpgrshlsnt/sql" -ForegroundColor Cyan
Write-Host ""

foreach ($item in $SQL_FILES) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Paso $($item.Num)/$($SQL_FILES.Count): $($item.Desc)" -ForegroundColor Yellow
    Write-Host "Archivo: $($item.File)" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path $item.File) {
        # Leer el contenido del archivo
        $content = Get-Content $item.File -Raw
        
        # Copiar al portapapeles
        $content | Set-Clipboard
        
        Write-Host "✓ Contenido copiado al portapapeles" -ForegroundColor Green
        Write-Host ""
        Write-Host "Instrucciones:" -ForegroundColor Yellow
        Write-Host "1. Ve al SQL Editor de Supabase (URL arriba)" -ForegroundColor White
        Write-Host "2. Pega el contenido (Ctrl+V)" -ForegroundColor White
        Write-Host "3. Haz clic en 'Run' o presiona Ctrl+Enter" -ForegroundColor White
        Write-Host "4. Verifica que se ejecutó correctamente (debe mostrar 'Success')" -ForegroundColor White
        Write-Host ""
        
        # Esperar confirmación del usuario
        $response = Read-Host "¿Se ejecutó correctamente? (s/n)"
        
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host ""
            Write-Host "Migración abortada por el usuario." -ForegroundColor Red
            Write-Host "Si hubo un error, revisa el mensaje en el SQL Editor." -ForegroundColor Yellow
            Write-Host "Puedes ejecutar el rollback con: supabase/rollback-empresa-1.sql" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host ""
        Write-Host "✓ Paso $($item.Num) completado" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "✗ Archivo no encontrado: $($item.File)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "¡Migración Completada Exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Verifica que todos los usuarios pueden iniciar sesión" -ForegroundColor White
Write-Host "2. Verifica que los datos históricos están disponibles" -ForegroundColor White
Write-Host "3. Crea un usuario Super_Admin (supabase/crear-super-admin.sql)" -ForegroundColor White
Write-Host "4. Continúa con la Tarea 12 del spec" -ForegroundColor White
Write-Host ""

