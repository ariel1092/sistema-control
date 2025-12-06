# 🗑️ Cómo Borrar la Base de Datos de Producción

## ⚠️ ADVERTENCIA

Este proceso **BORRARÁ TODOS LOS DATOS** de la base de datos de producción de forma **PERMANENTE e IRREVERSIBLE**.

## 📋 Pasos

### Opción 1: Usando PowerShell (Windows)

```powershell
# Establecer la variable de entorno y ejecutar
$env:MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority"; npm run clear:db:prod
```

**Nota:** Reemplaza `mongodb+srv://usuario:password@cluster.mongodb.net/...` con tu URI real de producción.

### Opción 2: Crear archivo .env temporal

1. Crea un archivo `.env` en la carpeta `backend/` con:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority
   ```

2. Ejecuta:
   ```powershell
   npm run clear:db:prod
   ```

3. **IMPORTANTE:** Elimina el archivo `.env` después de usar el script.

### Opción 3: Obtener URI desde Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio `ventas-ferreteria-backend`
3. Ve a **Environment** → Busca `MONGODB_URI`
4. Copia el valor completo
5. Úsalo en el comando de PowerShell

## 🔒 Seguridad

El script requiere **3 confirmaciones** antes de borrar:
1. Escribir: `SI, BORRAR TODO`
2. Escribir: `CONFIRMO BORRAR PRODUCCION`
3. Escribir: `SI` (después de ver el número de colecciones)

## 📝 Ejemplo Completo

```powershell
# 1. Ir al directorio backend
cd backend

# 2. Establecer URI de producción (reemplaza con tu URI real)
$env:MONGODB_URI="mongodb+srv://admin:password123@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority"

# 3. Ejecutar el script
npm run clear:db:prod

# 4. Seguir las confirmaciones en pantalla
```

## ⚠️ Después de Borrar

Después de borrar la base de datos, necesitarás:
- ✅ Recrear usuarios (ejecutar `npm run seed:admin`)
- ✅ Recrear productos (si tienes un script de seed)
- ✅ Verificar que el sistema funcione correctamente


