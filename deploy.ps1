# Script de despliegue a producción para Windows PowerShell
# Uso: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando despliegue a producción..." -ForegroundColor Green

# Verificar que Docker esté instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar que Docker Compose esté instalado
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "Creando .env desde ejemplo..."
    @"
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=CHANGE_THIS_PASSWORD
JWT_SECRET=CHANGE_THIS_JWT_SECRET
CORS_ORIGIN=https://tu-dominio.com
BACKEND_PORT=3000
MONGO_PORT=27017
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "⚠️  Por favor, edita el archivo .env con tus valores reales antes de continuar" -ForegroundColor Yellow
    exit 1
}

# Construir imágenes
Write-Host "📦 Construyendo imágenes Docker..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml build

# Detener servicios existentes
Write-Host "🛑 Deteniendo servicios existentes..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml down

# Iniciar servicios
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Green
Start-Sleep -Seconds 10

# Verificar health check
Write-Host "🏥 Verificando health check..." -ForegroundColor Green
$maxAttempts = 30
$attempt = 0
$success = $false

while ($attempt -lt $maxAttempts -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend está funcionando correctamente" -ForegroundColor Green
            $success = $true
            break
        }
    } catch {
        $attempt++
        if ($attempt -eq $maxAttempts) {
            Write-Host "❌ Backend no responde después de $maxAttempts intentos" -ForegroundColor Red
            docker-compose -f docker-compose.prod.yml logs backend
            exit 1
        }
        Start-Sleep -Seconds 2
    }
}

# Crear usuario administrador
Write-Host "👤 Creando usuario administrador..." -ForegroundColor Green
$createAdmin = Read-Host "¿Deseas crear un usuario administrador? (s/n)"
if ($createAdmin -eq "s" -or $createAdmin -eq "S") {
    docker-compose -f docker-compose.prod.yml exec -T backend npm run seed:admin
}

# Mostrar estado
Write-Host "📊 Estado de los servicios:" -ForegroundColor Green
docker-compose -f docker-compose.prod.yml ps

Write-Host "✅ Despliegue completado exitosamente!" -ForegroundColor Green
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verifica que el backend esté funcionando: http://localhost:3000/api/v1/health"
Write-Host "  2. Configura el frontend con la URL del backend"
Write-Host "  3. Revisa los logs si hay problemas: docker-compose -f docker-compose.prod.yml logs -f"

