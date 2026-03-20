# ============================================
# Script para ejecutar migración multi-tenant
# ============================================
# Este script ejecuta todos los archivos SQL necesarios
# para la migración multi-tenant en el orden correcto

Write-Host "=== Migración Multi-Tenant ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar la contraseña de la base de datos
$DB_PASSWORD = Read-Host "Ingresa la contraseña de la base de datos de Supabase" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Configurar cadena de conexión
$DB_HOST = "db.emifgmstkhkpgrshlsnt.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"

# Lista de archivos SQL en orden de ejecución
$SQL_FILES = @(
    "supabase/multi-tenant-empresas.sql",
    "supabase/multi-tenant-add-empresa-id.sql",
    "supabase/multi-tenant-rls-base.sql",
    "supabase/multi-tenant-rls-super-admin.sql",
    "supabase/multi-tenant-storage-policies.sql",
    "supabase/multi-tenant-automation-tables.sql",
    "supabase/migrate-to-empresa-1.sql"
)

# Ejecutar cada archivo SQL
$counter = 1
foreach ($file in $SQL_FILES) {
    Write-Host "[$counter/$($SQL_FILES.Count)] Ejecutando: $file" -ForegroundColor Yellow
    
    if (Test-Path $file) {
        # Usar psql para ejecutar el archivo
        $env:PGPASSWORD = $DB_PASSWORD_PLAIN
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $file
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Completado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Error al ejecutar $file" -ForegroundColor Red
            Write-Host "  Abortando migración..." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  ✗ Archivo no encontrado: $file" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    $counter++
}

# Ejecutar script de verificación
Write-Host "Ejecutando verificación de migración..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD_PLAIN
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "supabase/verificar-migracion.sql"

Write-Host ""
Write-Host "=== Migración Completada ===" -ForegroundColor Green
Write-Host "Revisa los mensajes anteriores para confirmar que todo se ejecutó correctamente." -ForegroundColor Cyan

