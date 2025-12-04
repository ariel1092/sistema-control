# 🚀 Guía de Despliegue a Producción

Esta guía te ayudará a desplegar la aplicación de Ventas Ferretería en producción.

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 18+ (para desarrollo local)
- MongoDB 6.0+ (o usar Docker)
- Dominio configurado (opcional, para producción)

## 🔧 Configuración

### 1. Variables de Entorno

#### Backend

Copia el archivo de ejemplo y configura tus variables:

```bash
cd backend
cp .env.production.example .env.production
```

Edita `.env.production` con tus valores:

```env
NODE_ENV=production
PORT=3000

# MongoDB - Cambiar con tus credenciales reales
MONGODB_URI=mongodb://usuario:password@host:27017/ventas-ferreteria?authSource=admin
MONGODB_DB_NAME=ventas-ferreteria
MONGODB_USE_AUTH=true

# JWT - Generar una clave secreta segura
JWT_SECRET=tu-super-secret-jwt-key-cambiar-en-produccion
JWT_EXPIRATION=24h

# API
API_PREFIX=api/v1
CORS_ORIGIN=https://tu-dominio-frontend.com

# Logging
LOG_LEVEL=info
```

#### Frontend

```bash
cd frontend
cp .env.production.example .env.production
```

Edita `.env.production`:

```env
VITE_API_URL=https://tu-backend-url.com/api/v1
```

## 🐳 Despliegue con Docker Compose

### Opción 1: Producción Completa (Backend + MongoDB)

1. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del proyecto:

```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=tu-password-seguro
JWT_SECRET=tu-jwt-secret-super-seguro
CORS_ORIGIN=https://tu-dominio-frontend.com
BACKEND_PORT=3000
MONGO_PORT=27017
```

2. **Iniciar servicios:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Verificar que todo esté funcionando:**

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
```

4. **Crear usuario administrador:**

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run seed:admin
```

### Opción 2: Solo Backend (MongoDB externo)

Si ya tienes MongoDB en la nube (MongoDB Atlas, etc.):

1. **Configurar solo el backend:**

```bash
cd backend
cp .env.production.example .env.production
# Editar .env.production con tu MONGODB_URI
```

2. **Construir y ejecutar:**

```bash
docker build -f docker/Dockerfile -t ventas-backend:latest .
docker run -d \
  --name ventas-backend \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  ventas-backend:latest
```

## 🌐 Despliegue del Frontend

### Opción 1: Vercel (Recomendado)

1. **Instalar Vercel CLI:**

```bash
npm i -g vercel
```

2. **Desplegar:**

```bash
cd frontend
vercel --prod
```

3. **Configurar variables de entorno en Vercel:**

- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Agrega: `VITE_API_URL=https://tu-backend-url.com/api/v1`

### Opción 2: Netlify

1. **Instalar Netlify CLI:**

```bash
npm i -g netlify-cli
```

2. **Desplegar:**

```bash
cd frontend
npm run build
netlify deploy --prod
```

3. **Configurar variables de entorno en Netlify:**

- Dashboard → Site settings → Environment variables
- Agrega: `VITE_API_URL`

### Opción 3: Build Estático

```bash
cd frontend
npm run build
# Los archivos estarán en frontend/dist
# Sube estos archivos a tu servidor web (Nginx, Apache, etc.)
```

## 🔒 Seguridad en Producción

### 1. Cambiar credenciales por defecto

- ✅ Cambiar `MONGO_ROOT_PASSWORD`
- ✅ Cambiar `JWT_SECRET` (usar un generador de claves seguras)
- ✅ Configurar `CORS_ORIGIN` solo con tu dominio

### 2. Firewall

- Solo exponer puertos necesarios (3000 para backend, 80/443 para frontend)
- MongoDB solo accesible desde el backend (no exponer puerto 27017 públicamente)

### 3. SSL/TLS

- Usar HTTPS en producción
- Configurar certificados SSL (Let's Encrypt recomendado)

### 4. Backups

Configurar backups automáticos de MongoDB:

```bash
# Backup diario
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --out /backup/$(date +%Y%m%d)
```

## 📊 Monitoreo

### Health Check

El backend expone un endpoint de health check:

```
GET /api/v1/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-03-12T10:00:00.000Z",
  "service": "ventas-ferreteria-backend"
}
```

### Logs

Ver logs del backend:

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔄 Actualización

Para actualizar la aplicación:

```bash
# 1. Detener servicios
docker-compose -f docker-compose.prod.yml down

# 2. Actualizar código
git pull

# 3. Reconstruir y reiniciar
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 Solución de Problemas

### Backend no inicia

1. Verificar logs:
```bash
docker-compose -f docker-compose.prod.yml logs backend
```

2. Verificar variables de entorno:
```bash
docker-compose -f docker-compose.prod.yml config
```

3. Verificar conexión a MongoDB:
```bash
docker-compose -f docker-compose.prod.yml exec backend node -e "console.log(process.env.MONGODB_URI)"
```

### Frontend no se conecta al backend

1. Verificar `VITE_API_URL` en el frontend
2. Verificar `CORS_ORIGIN` en el backend
3. Verificar que el backend esté accesible desde el navegador

## 📝 Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Credenciales cambiadas (MongoDB, JWT)
- [ ] CORS configurado correctamente
- [ ] SSL/HTTPS configurado
- [ ] Backups configurados
- [ ] Health check funcionando
- [ ] Usuario administrador creado
- [ ] Logs configurados
- [ ] Firewall configurado
- [ ] Dominio configurado (si aplica)

## 🎯 Despliegue Rápido (Render.com)

Si usas Render.com, ya tienes un `render.yaml` configurado:

1. Conecta tu repositorio en Render
2. Render detectará automáticamente el `render.yaml`
3. Configura las variables de entorno en el dashboard
4. ¡Listo!

## 📞 Soporte

Para problemas o preguntas, revisa los logs y la documentación del proyecto.

