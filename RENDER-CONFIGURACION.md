# Configuración de Render para el Backend

Esta guía explica cómo configurar correctamente tu servicio en Render para evitar errores 404.

## ✅ Problema Resuelto

El backend ahora responde correctamente a:
- `/` - Endpoint raíz con información del servicio
- `/health` - Health check simplificado
- `/api/v1/health` - Health check completo con verificación de MongoDB

## 🔧 Configuración en Render

### Health Check Path

En la configuración de tu servicio en Render:

1. Ve a tu servicio en Render Dashboard
2. Click en **"Settings"**
3. Busca la sección **"Health Check Path"**
4. Configura una de estas opciones:

**Opción 1 (Recomendada):**
```
/api/v1/health
```
Esto usa el endpoint completo que verifica MongoDB.

**Opción 2:**
```
/
```
Esto usa el endpoint raíz que ahora responde correctamente.

**Opción 3:**
```
/health
```
Health check simplificado.

### Build & Deploy Settings

Asegúrate de tener configurado:

**Build Command:**
```bash
cd backend && npm install && npm run build
```

**Start Command:**
```bash
cd backend && npm run start:prod
```

O si tu estructura es diferente:
```bash
npm install && npm run build
npm run start:prod
```

### Variables de Entorno Necesarias

Asegúrate de tener estas variables configuradas en Render:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=tu-connection-string
MONGODB_DB_NAME=ventas-ferreteria
JWT_SECRET=tu-secret-key
JWT_EXPIRATION=24h
API_PREFIX=api/v1
CORS_ORIGIN=https://tu-frontend.com
```

**Nota sobre PORT**: Render asigna automáticamente el puerto, pero puedes usar `PORT=10000` o dejar que Render lo maneje.

## 🧪 Verificar que Funciona

Después de desplegar, prueba estos endpoints:

1. **Endpoint raíz:**
   ```bash
   curl https://tu-dominio.onrender.com/
   ```
   Debería responder con información del servicio.

2. **Health check completo:**
   ```bash
   curl https://tu-dominio.onrender.com/api/v1/health
   ```
   Debería responder con estado de MongoDB y métricas.

3. **Health check simplificado:**
   ```bash
   curl https://tu-dominio.onrender.com/health
   ```
   Debería responder con estado básico.

## 📊 Logs en Render

Los logs ahora mostrarán:
- ✅ Requests exitosos sin errores 404 en `/`
- ✅ Health checks funcionando correctamente
- ✅ Información de cada request (método, ruta, timestamp)

## 🆘 Solución de Problemas

### Sigue apareciendo 404 en `/`

1. Verifica que el código esté actualizado (último commit)
2. Verifica que el build se completó exitosamente
3. Revisa los logs de Render para ver errores de compilación
4. Asegúrate de que `IndexController` esté importado en `AppModule`

### Health check falla

1. Verifica que MongoDB esté accesible desde Render
2. Verifica que `MONGODB_URI` esté configurada correctamente
3. Revisa los logs para ver errores de conexión a MongoDB

### El servicio no inicia

1. Verifica que `start:prod` esté configurado correctamente
2. Verifica que el build genere `dist/` correctamente
3. Revisa los logs de build para ver errores de compilación

## 📝 Checklist

- [ ] Health Check Path configurado en Render
- [ ] Build Command configurado correctamente
- [ ] Start Command configurado correctamente
- [ ] Variables de entorno configuradas
- [ ] Endpoint `/` responde correctamente
- [ ] Endpoint `/api/v1/health` responde correctamente
- [ ] No hay errores 404 en los logs

