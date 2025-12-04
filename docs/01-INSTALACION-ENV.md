# 📝 Crear archivo .env

## Pasos

1. **Copia el archivo de ejemplo:**
   ```powershell
   copy .env.example .env
   ```

2. **O crea manualmente** un archivo `.env` en `backend/` con:

```env
# Database - SIN AUTENTICACIÓN (desarrollo)
MONGODB_URI=mongodb://localhost:27017/ventas-ferreteria
MONGODB_USE_AUTH=false

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

3. **Guarda el archivo**

4. **Reinicia el backend** para que cargue las nuevas variables

---

**¡Listo!** El backend debería conectarse a MongoDB sin problemas.





