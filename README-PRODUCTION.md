# 🏭 Guía Rápida de Producción

## 🚀 Despliegue Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 2. Desplegar
docker-compose -f docker-compose.prod.yml up -d

# 3. Verificar
curl http://localhost:3000/api/v1/health

# 4. Crear usuario admin
docker-compose -f docker-compose.prod.yml exec backend npm run seed:admin
```

### Opción 2: Script Automático

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

## 📋 Variables de Entorno Requeridas

### Backend (.env)
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=tu-password-seguro
JWT_SECRET=tu-jwt-secret-super-seguro
CORS_ORIGIN=https://tu-dominio-frontend.com
```

### Frontend (.env.production)
```env
VITE_API_URL=https://tu-backend-url.com/api/v1
```

## 🔒 Seguridad

1. ✅ Cambiar todas las contraseñas por defecto
2. ✅ Usar HTTPS en producción
3. ✅ Configurar firewall
4. ✅ No exponer MongoDB públicamente

## 📊 Verificación

- Health Check: `GET /api/v1/health`
- Logs: `docker-compose -f docker-compose.prod.yml logs -f`
- Estado: `docker-compose -f docker-compose.prod.yml ps`

## 📖 Documentación Completa

Ver [DEPLOY.md](./DEPLOY.md) para documentación detallada.

