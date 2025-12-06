# Guía de Monitoreo y Backups

Este documento describe cómo configurar y usar el sistema de monitoreo y backups implementado.

## 📊 Monitoreo

### 1. Health Check Endpoint

El endpoint `/api/v1/health` ahora verifica:
- Estado del servicio
- Conexión a MongoDB
- Uptime del servidor
- Uso de memoria

**Ejemplo de respuesta exitosa:**
```json
{
  "status": "ok",
  "service": "ventas-ferreteria-backend",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 150,
    "total": 200,
    "unit": "MB"
  }
}
```

### 2. UptimeRobot (Recomendado)

1. Ve a https://uptimerobot.com y crea una cuenta gratuita
2. Click en "Add New Monitor"
3. Configura:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: "Ferretería API"
   - **URL**: `https://tu-dominio.com/api/v1/health`
   - **Monitoring Interval**: 5 minutos
4. Agrega tu email para recibir alertas

**Nota**: Esto también mantiene despierto tu servidor de Render (ping cada 5 min)

### 3. Almacenamiento de Incidentes de Uptime

El sistema ahora permite almacenar y consultar incidentes de uptime desde servicios como UptimeRobot.

#### Endpoints Disponibles

**Crear un incidente (webhook):**
```http
POST /api/v1/monitoreo/incidentes
Content-Type: application/json

{
  "startDateTime": "2025-12-04T23:00:32.000Z",
  "endDateTime": "2025-12-04T23:05:00.000Z",  // Opcional
  "reason": "503 Service Unavailable",
  "duration": "4m 28s",  // Opcional
  "durationSeconds": 268,  // Opcional
  "monitorUrl": "https://sistema-control.onrender.com/api/v1/health",
  "monitorName": "sistema-control.onrender.com/api/v1/health"
}
```

**Obtener todos los incidentes:**
```http
GET /api/v1/monitoreo/incidentes?fechaInicio=2025-12-01T00:00:00.000Z&fechaFin=2025-12-31T23:59:59.999Z&monitorName=nombre-del-monitor
```

**Obtener incidentes abiertos:**
```http
GET /api/v1/monitoreo/incidentes/abiertos
```

**Obtener estadísticas de uptime:**
```http
GET /api/v1/monitoreo/estadisticas?fechaInicio=2025-12-01T00:00:00.000Z&fechaFin=2025-12-31T23:59:59.999Z
```

#### Configurar Webhook en UptimeRobot (Opcional)

Para que UptimeRobot envíe automáticamente los incidentes a tu API:

1. Ve a tu monitor en UptimeRobot
2. Click en "Edit Monitor"
3. En la sección "Alert Contacts", agrega un "Webhook URL"
4. URL del webhook: `https://tu-dominio.com/api/v1/monitoreo/incidentes`
5. Formato del payload (JSON):
```json
{
  "startDateTime": "{{start_datetime}}",
  "endDateTime": "{{end_datetime}}",
  "reason": "{{reason}}",
  "duration": "{{duration}}",
  "durationSeconds": {{duration_seconds}},
  "monitorUrl": "{{monitor_url}}",
  "monitorName": "{{monitor_name}}"
}
```

**Nota**: UptimeRobot no soporta webhooks directos en el plan gratuito. Puedes exportar los datos manualmente o usar un servicio intermedio.

### 4. Keep-Alive para Render (Evitar que se "duerma")

Render suspende servicios gratuitos después de ~15 minutos sin tráfico. Para mantenerlo activo:

#### Opción A: UptimeRobot (Recomendado) ⭐
1. Ve a [UptimeRobot](https://uptimerobot.com)
2. Crea cuenta gratuita
3. Click en "Add New Monitor"
4. Configura:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Sistema Control Keep-Alive
   - **URL:** `https://sistema-control.onrender.com/api/v1/health`
   - **Monitoring Interval:** 5 minutes
5. Click "Create Monitor"

#### Opción B: GitHub Actions (Gratis)
Ya está configurado en `.github/workflows/keep-alive.yml`
- Se ejecuta automáticamente cada 10 minutos
- No requiere configuración adicional
- Usa minutos gratuitos de GitHub Actions (2000/mes)

#### Opción C: Script Local
```bash
cd backend
BACKEND_URL=https://sistema-control.onrender.com npm run keep-alive
```

Ver documentación completa en `backend/KEEP_ALIVE_RENDER.md`

### 3. Sentry - Monitoreo de Errores

#### Backend

1. Crea una cuenta en https://sentry.io
2. Crea un nuevo proyecto (Node.js)
3. Copia el DSN
4. Agrega la variable de entorno:
   ```bash
   SENTRY_DSN=tu-dsn-de-sentry
   ```

#### Frontend

1. En Sentry, crea un segundo proyecto (React)
2. Copia el DSN
3. Agrega la variable de entorno en tu servicio de hosting:
   ```bash
   VITE_SENTRY_DSN=tu-dsn-de-sentry
   ```

**Nota**: Sentry es gratuito hasta 5,000 eventos/mes

## 💾 Backups de MongoDB

### Opción 1: Script Manual (TypeScript)

```bash
# Backup simple
npm run backup:mongodb

# Backup comprimido
npm run backup:mongodb:compress

# Con opciones personalizadas
ts-node scripts/backup-mongodb.ts --compress --output ./mis-backups
```

### Opción 2: Script con Cron (JavaScript)

Este script se ejecuta automáticamente según un horario configurado.

#### Instalación

```bash
cd backend
npm install mongodb node-cron dotenv
```

#### Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=mongodb://usuario:password@host:27017/ventas-ferreteria?authSource=admin
BACKUP_DIR=./backups
BACKUP_SCHEDULE=0 2 * * *  # 2 AM diario (formato cron)
KEEP_BACKUPS=10  # Mantener últimos 10 backups
```

#### Uso

**Ejecutar una vez:**
```bash
node backend/scripts/backup-mongodb-cron.js --once
```

**Ejecutar con cron (mantener proceso corriendo):**
```bash
node backend/scripts/backup-mongodb-cron.js
```

#### Con PM2 (Recomendado para producción)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el script de backup
pm2 start backend/scripts/backup-mongodb-cron.js --name "backup-ferreteria"

# Guardar configuración
pm2 save

# Configurar para que inicie automáticamente al reiniciar
pm2 startup
```

### Opción 3: Render Background Worker

1. En Render, crea un nuevo "Background Worker"
2. Conecta tu repositorio
3. Configura:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node backend/scripts/backup-mongodb-cron.js`
   - **Environment Variables**: Agrega las variables del `.env`

### Restaurar un Backup

```bash
# Descomprimir si está comprimido
tar -xzf backup-2024-01-15T10-30-00-000Z.tar.gz

# Restaurar
mongorestore --host localhost:27017 --db ventas-ferreteria ./backup-2024-01-15T10-30-00-000Z/ventas-ferreteria

# O con autenticación
mongorestore --host localhost:27017 --username admin --password admin123 --authenticationDatabase admin --db ventas-ferreteria ./backup-2024-01-15T10-30-00-000Z/ventas-ferreteria
```

## 📝 Logs

El sistema ahora registra:
- Todas las peticiones HTTP (método, ruta, timestamp)
- Errores no capturados (unhandledRejection, uncaughtException)
- Errores enviados a Sentry automáticamente

Los logs se muestran en la consola y también se envían a Sentry si está configurado.

## 🔧 Variables de Entorno Necesarias

### Backend

```env
# MongoDB
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=ventas-ferreteria

# Sentry (opcional)
SENTRY_DSN=tu-dsn-de-sentry

# Otros
NODE_ENV=production
PORT=3000
```

### Frontend

```env
# Sentry (opcional)
VITE_SENTRY_DSN=tu-dsn-de-sentry
```

## ✅ Checklist de Implementación

- [ ] Configurar UptimeRobot con el endpoint `/api/v1/health`
- [ ] Crear cuenta en Sentry.io
- [ ] Agregar `SENTRY_DSN` al backend
- [ ] Agregar `VITE_SENTRY_DSN` al frontend
- [ ] Probar script de backup manualmente
- [ ] Configurar cron de backups (PM2 o Render Background Worker)
- [ ] Hacer un backup de prueba y restaurarlo
- [ ] Verificar que los logs se muestren correctamente

## 📚 Recursos Adicionales

- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [Sentry Docs](https://docs.sentry.io/)
- [MongoDB Backup Docs](https://docs.mongodb.com/manual/core/backups/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/usage/quick-start/)

