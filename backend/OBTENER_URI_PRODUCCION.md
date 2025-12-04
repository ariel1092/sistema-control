# 🔍 Cómo Obtener la URI de Producción

## Opción 1: Desde Render Dashboard (Recomendado)

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio: **ventas-ferreteria-backend**
3. Click en **Environment** (en el menú lateral)
4. Busca la variable `MONGODB_URI`
5. Click en el ícono de **copiar** o selecciona y copia el valor completo
6. El formato debería ser algo como:
   ```
   mongodb+srv://admin:password123@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority
   ```

## Opción 2: Desde MongoDB Atlas

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu cluster
4. Click en **Connect**
5. Elige **Connect your application**
6. Selecciona **Node.js** y la versión más reciente
7. Copia la connection string
8. Reemplaza `<password>` con tu contraseña real
9. Asegúrate de que el nombre de la base de datos sea `ventas-ferreteria`

## ⚠️ Formato Correcto

La URI debe tener este formato:
```
mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority
```

**Ejemplo real:**
```
mongodb+srv://admin:MiPassword123@cluster0.abc123.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority&appName=Sistema-control
```

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas tu URI completa públicamente
- ⚠️ La URI contiene credenciales sensibles
- ✅ Usa variables de entorno para almacenarla
- ✅ Elimina archivos `.env` después de usarlos

## 📝 Usar la URI en PowerShell

Una vez que tengas la URI real:

```powershell
# Reemplaza con tu URI real (sin espacios)
$env:MONGODB_URI="mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority"

# Ejecutar el script
npm run clear:db:prod
```

**Nota:** Si la URI tiene caracteres especiales, puede que necesites usar comillas simples o escapar caracteres.

