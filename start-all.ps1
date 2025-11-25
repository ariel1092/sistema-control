# Script para iniciar todo el sistema
Write-Host "🚀 Iniciando Sistema de Ventas Ferretería" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "📦 Verificando Docker Desktop..." -ForegroundColor Yellow
docker ps | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERROR: Docker Desktop NO está corriendo!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "  1. Abre Docker Desktop desde el menú de inicio" -ForegroundColor White
    Write-Host "  2. Espera a que inicie completamente (ícono de ballena en la barra de tareas)" -ForegroundColor White
    Write-Host "  3. Vuelve a ejecutar este script" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
    
}

Write-Host "✅ Docker Desktop está corriendo" -ForegroundColor Green
Write-Host ""

# Verificar si MongoDB ya está corriendo
Write-Host "🔍 Verificando si MongoDB ya está corriendo..." -ForegroundColor Yellow
$mongoContainer = docker ps -a --filter "name=ventas-mongodb-dev" --format "{{.Names}}"
if ($mongoContainer -eq "ventas-mongodb-dev") {
    $running = docker ps --filter "name=ventas-mongodb-dev" --format "{{.Names}}"
    if ($running -eq "ventas-mongodb-dev") {
        Write-Host "✅ MongoDB ya está corriendo" -ForegroundColor Green
    } else {
        Write-Host "🔄 Iniciando contenedor existente..." -ForegroundColor Yellow
        docker start ventas-mongodb-dev
        Start-Sleep -Seconds 3
    }
} else {
    # Iniciar MongoDB
    Write-Host "🐳 Iniciando MongoDB con Docker..." -ForegroundColor Yellow
    
    # Verificar si estamos en la raíz del proyecto
    if (Test-Path "docker-compose.dev.yml") {
        docker-compose -f docker-compose.dev.yml up -d
    } elseif (Test-Path "backend\docker\docker-compose.dev.yml") {
        docker-compose -f backend\docker\docker-compose.dev.yml up -d
    } else {
        Write-Host "❌ ERROR: No se encuentra docker-compose.dev.yml" -ForegroundColor Red
        Write-Host "Asegúrate de estar en la raíz del proyecto" -ForegroundColor Yellow
        exit 1
    }
    
    # Esperar a que MongoDB esté listo
    Write-Host "⏳ Esperando a que MongoDB esté listo..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Verificar que esté corriendo
    $mongoRunning = docker ps --filter "name=ventas-mongodb-dev" --format "{{.Names}}"
    if ($mongoRunning -eq "ventas-mongodb-dev") {
        Write-Host "✅ MongoDB iniciado correctamente!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: MongoDB puede no estar listo aún" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ MongoDB está listo!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Iniciar Backend (Terminal 1):" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Iniciar Frontend (Terminal 2):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Acceder:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Swagger:  http://localhost:3000/api/v1/docs" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para salir"

