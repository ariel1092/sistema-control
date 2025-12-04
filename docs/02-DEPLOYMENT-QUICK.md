# 🚀 Guía Rápida de Despliegue

## Resumen de 5 minutos

### 1. MongoDB Atlas (2 min)
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cluster M0 (gratis)
3. Network Access → Allow from anywhere (0.0.0.0/0)
4. Database Access → Crear usuario
5. Database → Connect → Copiar connection string
6. Reemplazar `<password>` y agregar `/ventas-ferreteria` al final

### 2. Backend en Render (2 min)
1. Ir a [Render Dashboard](https://dashboard.render.com)
2. New + → Web Service
3. Conectar repositorio Git
4. Configuración:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`
5. Variables de entorno:
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority
   CORS_ORIGIN=https://tu-frontend.vercel.app
   JWT_SECRET=tu-secret-aqui
   ```
6. Deploy

### 3. Frontend en Vercel (1 min)
1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Add New → Project
3. Importar repositorio
4. Configuración:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
5. Variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.onrender.com/api/v1
   ```
6. Deploy

### 4. Actualizar CORS
1. En Render, actualizar `CORS_ORIGIN` con la URL real de Vercel
2. Reiniciar servicio

**¡Listo!** 🎉

Para más detalles, ver [DEPLOY.md](./DEPLOY.md)


