# 🚀 Guía de Despliegue - Ventas Ferretería

Esta guía te ayudará a desplegar el sistema completo en producción:
- **Backend**: Render.com
- **Frontend**: Vercel.com
- **Base de Datos**: MongoDB Atlas (recomendado) o MongoDB en Render

---

## 📋 Prerequisitos

1. **Cuentas necesarias:**
   - [Render](https://render.com) (gratis con limitaciones)
   - [Vercel](https://vercel.com) (gratis)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratis hasta 512MB)

2. **Repositorio Git:**
   - Tu código debe estar en GitHub, GitLab o Bitbucket

---

## 🔧 Paso 1: Configurar MongoDB Atlas

### 1.1 Crear Cluster en MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (elige la opción gratuita M0)
4. Espera a que el cluster se cree (5-10 minutos)

### 1.2 Configurar Acceso

1. **Network Access:**
   - Ve a "Network Access" en el menú lateral
   - Click en "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0) para desarrollo
   - O agrega la IP específica de Render cuando la tengas

2. **Database Access:**
   - Ve a "Database Access"
   - Click en "Add New Database User"
   - Crea un usuario con contraseña segura
   - Asigna rol: "Atlas admin" o "Read and write to any database"
   - Guarda las credenciales

### 1.3 Obtener Connection String

1. Ve a "Database" → "Connect"
2. Selecciona "Connect your application"
3. Copia la connection string, será algo como:
   ```
   mongodb+srv://<db_username>:password@cluster0.xxxxx.mongodb.net/?appName=nombre-app
   ```
4. **Reemplaza los placeholders:**
   - `<db_username>` → Tu nombre de usuario de MongoDB Atlas
   - `password` → Tu contraseña (ya debería estar en la string)
   - Agrega el nombre de la base de datos antes del `?`
   
5. **Formato correcto final:**
   ```
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority&appName=Sistema-control
   ```
   
   **Ejemplo con tu connection string:**
   ```
   mongodb+srv://sangeronimo:VJGQJhR2tHSRSP13@sistema-control.heaixfc.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority&appName=Sistema-control
   ```
   
   ⚠️ **Importante:** 
   - Reemplaza `tu_usuario` con tu nombre de usuario real de MongoDB Atlas
   - El nombre de la base de datos (`ventas-ferreteria`) va después del `/` y antes del `?`
   - Los parámetros `retryWrites=true&w=majority` son recomendados para producción

---

## 🖥️ Paso 2: Desplegar Backend en Render

### 2.1 Crear Nuevo Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio Git
4. Selecciona el repositorio del proyecto

### 2.2 Configurar el Servicio

**Configuración básica:**
- **Name**: `ventas-ferreteria-backend`
- **Region**: `Oregon` (o la más cercana a ti)
- **Branch**: `main` (o tu rama principal)
- **Root Directory**: `backend`
- **Language/Runtime**: `Node` ⚠️ **NO elijas Docker** (usa Node para simplicidad)
- **Build Command**: `npm install && npm run build:tsc:verify` ⚠️ **IMPORTANTE:** Usa `build:tsc:verify` que compila y verifica los archivos generados
- **Start Command**: `bash start.sh` ⚠️ **CRÍTICO:** Usa el script `start.sh` que verifica el directorio y archivos antes de ejecutar. El archivo compilado está en `dist/src/main.js` (no en `dist/main.js`)

**⚠️ Solución al error "nest: not found":**
Si ves el error `sh: 1: nest: not found`, el problema es que Render no está instalando las `devDependencies` necesarias para el build. Soluciones:

1. **Opción 1 (Recomendada):** Cambia el **Build Command** a:
   ```
   NODE_ENV=development npm install && npm run build
   ```
   Esto fuerza la instalación de devDependencies durante el build.

2. **Opción 2:** Usa `npm ci` que instala devDependencies por defecto:
   ```
   npm ci && npm run build
   ```

3. **Opción 3:** Asegúrate de que la variable de entorno `NODE_ENV` NO esté configurada como `production` en las variables de entorno ANTES del build. Render la configurará automáticamente después del build para el runtime.

**Nota sobre Language:**
- ✅ **Elige "Node"** - Render detectará automáticamente Node.js y usará los comandos de build/start
- ❌ **NO elijas "Docker"** - Aunque el proyecto tiene un Dockerfile, está en una subcarpeta y requiere configuración adicional. Usar Node es más simple y directo.

### 2.3 Variables de Entorno

Agrega las siguientes variables de entorno en Render:

```env
NODE_ENV=production
PORT=10000
API_PREFIX=api/v1
CORS_ORIGIN=https://sistema-control-nome.vercel.app,https://*.vercel.app
MONGODB_URI=mongodb+srv://tu_usuario:VJGQJhR2tHSRSP13@sistema-control.heaixfc.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority&appName=Sistema-control
JWT_SECRET=tusupersecreto
JWT_EXPIRATION=24h
LOG_LEVEL=info
```

**Nota**: 
- ⚠️ **IMPORTANTE:** Reemplaza `tu_usuario` en `MONGODB_URI` con tu nombre de usuario real de MongoDB Atlas
- El formato correcto es: `mongodb+srv://USUARIO:CONTRASEÑA@HOST/NOMBRE_DB?parametros`
- Asegúrate de incluir el nombre de la base de datos (`ventas-ferreteria`) después del `/` y antes del `?`
- Genera un `JWT_SECRET` seguro (puedes usar: `openssl rand -base64 32`)
- Actualiza `CORS_ORIGIN` con la URL de tu frontend después de desplegarlo

### 2.4 Desplegar

1. Click en "Create Web Service"
2. Render comenzará a construir y desplegar tu backend
3. Espera a que el despliegue termine (5-10 minutos)
4. Tu backend estará disponible en: `https://ventas-ferreteria-backend.onrender.com`

### 2.5 Verificar Despliegue

1. Visita: `https://ventas-ferreteria-backend.onrender.com/api/v1/docs`
2. Deberías ver la documentación Swagger
3. Si hay errores, revisa los logs en Render

---

## 🌐 Paso 3: Desplegar Frontend en Vercel

### 3.1 Importar Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Add New..." → "Project"
3. Importa tu repositorio Git
4. Selecciona el repositorio del proyecto

### 3.2 Configurar el Proyecto

**Configuración básica:**
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` ⚠️ **CRÍTICO:** Debe estar configurado como `frontend`
- **Build Command**: (dejar vacío - usará el del `vercel.json` en `frontend/`)
- **Output Directory**: (dejar vacío - usará el del `vercel.json` en `frontend/`)
- **Install Command**: (dejar vacío - usará el del `vercel.json` en `frontend/`)

**⚠️ IMPORTANTE:** 
- El `vercel.json` está en `frontend/vercel.json` y ya está configurado correctamente
- Si configuras el **Root Directory** como `frontend`, Vercel usará automáticamente el `vercel.json` dentro de `frontend/`
- Si Vercel muestra error "No Output Directory found", verifica que el Root Directory esté configurado como `frontend`

### 3.3 Variables de Entorno

Agrega la siguiente variable de entorno:

```env
VITE_API_URL=https://ventas-ferreteria-backend.onrender.com/api/v1
```

**Nota**: Reemplaza con la URL real de tu backend en Render

### 3.4 Desplegar

1. Click en "Deploy"
2. Vercel comenzará a construir y desplegar tu frontend
3. Espera a que el despliegue termine (2-5 minutos)
4. Tu frontend estará disponible en: `https://ventas-ferreteria.vercel.app`

### 3.5 Actualizar CORS en Backend

Una vez que tengas la URL de Vercel:

1. Ve a Render Dashboard → Tu servicio backend → Environment
2. Busca la variable `CORS_ORIGIN`
3. Actualiza con la URL exacta de tu frontend en Vercel:
   ```
   CORS_ORIGIN=https://sistema-control-nome.vercel.app,https://*.vercel.app
   ```
   ⚠️ **Reemplaza `sistema-control-nome.vercel.app` con tu URL real de Vercel**
4. Guarda los cambios
5. Render reiniciará el servicio automáticamente
6. Espera 1-2 minutos para que el servicio se reinicie completamente

---

## 🔄 Paso 4: Configurar Dominio Personalizado (Opcional)

### 4.1 Backend en Render

1. En Render Dashboard → Tu servicio
2. Ve a "Settings" → "Custom Domain"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

### 4.2 Frontend en Vercel

1. En Vercel Dashboard → Tu proyecto
2. Ve a "Settings" → "Domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

---

## ✅ Paso 5: Verificar Todo Funciona

### 5.1 Verificar Backend

1. **Swagger Docs**: `https://tu-backend.onrender.com/api/v1/docs`
2. **Health Check**: `https://tu-backend.onrender.com/api/v1/health` (si existe)
3. Revisa los logs en Render para asegurarte de que no hay errores

### 5.2 Verificar Frontend

1. Visita tu URL de Vercel
2. Abre la consola del navegador (F12)
3. Verifica que no haya errores de CORS
4. Intenta hacer una petición (ej: cargar productos)

### 5.3 Verificar Conexión

1. En el frontend, intenta cargar datos del backend
2. Si hay errores, revisa:
   - Variables de entorno en ambos servicios
   - CORS configurado correctamente
   - MongoDB Atlas permite conexiones desde Render

---

## 🐛 Solución de Problemas

### Error: CORS bloqueado

**Solución:**
- Verifica que `CORS_ORIGIN` en Render incluya la URL exacta de Vercel
- Asegúrate de incluir `https://` y no `http://`
- Puedes usar `*` temporalmente para desarrollo (no recomendado en producción)

### Error: MongoDB connection failed

**Síntomas:**
- Error: `MongoServerError: bad auth : Authentication failed`
- La aplicación se inicia pero no puede conectar a MongoDB

**Soluciones:**

1. **Verifica las credenciales en Render:**
   - Ve a Render Dashboard → Tu servicio → Environment
   - Verifica que `MONGODB_URI` tenga el formato correcto:
     ```
     mongodb+srv://USUARIO:CONTRASEÑA@sistema-control.heaixfc.mongodb.net/ventas-ferreteria?retryWrites=true&w=majority&appName=Sistema-control
     ```
   - ⚠️ **IMPORTANTE:** Reemplaza `USUARIO` con tu nombre de usuario real de MongoDB Atlas (ej: `sangeronimo`)
   - Si tu contraseña tiene caracteres especiales, codifícalos en URL (ej: `@` → `%40`, `#` → `%23`)

2. **Verifica el usuario en MongoDB Atlas:**
   - Ve a MongoDB Atlas → Database Access
   - Verifica que el usuario existe y tiene la contraseña correcta
   - Asegúrate de que el usuario tenga rol "Atlas admin" o "Read and write to any database"

3. **Verifica Network Access:**
   - Ve a MongoDB Atlas → Network Access
   - Asegúrate de que "Allow Access from Anywhere" (0.0.0.0/0) esté configurado
   - O agrega la IP de Render específicamente

4. **Prueba la connection string localmente:**
   - Copia la `MONGODB_URI` de Render
   - Prueba conectarte usando `mongosh` o MongoDB Compass
   - Si funciona localmente pero no en Render, el problema es la configuración en Render

5. **Si la contraseña tiene caracteres especiales:**
   - Codifica la contraseña en URL antes de ponerla en la connection string
   - Ejemplo: Si tu contraseña es `P@ss#123`, usa `P%40ss%23123`

### Error: Build failed en Render

**Solución:**
- Verifica que `Root Directory` esté configurado como `backend`
- Verifica que los comandos de build sean correctos
- Revisa los logs de build para ver el error específico

### Error: "Reached heap limit" o "No open ports detected" después del build

**Síntomas:**
- El build es exitoso pero el deploy falla
- Error: `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`
- Error: `No open ports detected`
- El log muestra: `==> Running 'npm run start'` (incorrecto)

**Causa:**
Render está usando `npm run start` (que ejecuta `nest start`) en lugar de `npm run start:prod` (que ejecuta `node dist/main`). `nest start` intenta compilar TypeScript en tiempo de ejecución, consumiendo mucha memoria.

**Solución:**
1. Ve a Render Dashboard → Tu servicio → Settings
2. Busca la sección **"Start Command"**
3. Cambia el comando a: `npm run start:prod`
4. Guarda los cambios
5. Render iniciará un nuevo deploy automáticamente

**Verificación:**
- El Start Command debe ser exactamente: `npm run start:prod`
- NO debe ser: `npm run start` o `npm start`

### Error: "Cannot find module '/opt/render/project/src/backend/dist/main'"

**Síntomas:**
- El build es exitoso pero el deploy falla
- Error: `Error: Cannot find module '/opt/render/project/src/backend/dist/main'`
- El log muestra que el build se completó pero no encuentra el archivo al ejecutar

**Causa:**
El build está generando los archivos, pero Render no los encuentra en la ubicación esperada, o el archivo no se está generando correctamente.

**Soluciones:**

1. **Opción 1 (Recomendada):** Verifica que el build esté generando los archivos. Cambia el **Build Command** a:
   ```
   npm install && npm run build && ls -la dist/
   ```
   Esto listará los archivos generados para verificar que `main.js` existe.

2. **Opción 2 (RECOMENDADA):** Usa el script de inicio que verifica el directorio:
   ```
   bash start.sh
   ```
   Este script verifica el directorio actual, lista los archivos, y luego ejecuta la aplicación desde la ubicación correcta (`dist/src/main.js`). Si los archivos no existen, mostrará información de debug útil.

   **Nota importante:** TypeScript compila manteniendo la estructura de directorios, por lo que `main.js` está en `dist/src/main.js`, no en `dist/main.js`.

3. **Opción 3:** Verifica que el **Root Directory** esté configurado exactamente como `backend` (sin espacios, sin barras adicionales).

4. **Opción 4:** Si nada funciona, agrega un script de verificación. Modifica temporalmente el **Build Command** a:
   ```
   npm install && npm run build && echo "Build files:" && ls -la dist/ && echo "Current directory:" && pwd
   ```
   Esto te ayudará a debuggear dónde se están generando los archivos.

**Nota:** El archivo debería generarse como `dist/main.js` (Node.js busca automáticamente la extensión `.js` cuando ejecutas `node dist/main`).

**Solución si `nest build` no genera archivos JavaScript:**
Si el `ls -la dist/` muestra solo directorios (`src/`, `scripts/`) pero no archivos `.js`, significa que `nest build` no está compilando correctamente. Solución:

1. Cambia el **Build Command** a:
   ```
   npm install && npm run build:tsc:verify
   ```
   Esto usa `tsc` directamente, resuelve los path mappings con `tsc-alias`, y verifica qué archivos se generan.

2. Asegúrate de que el proyecto tenga `tsconfig.build.json` y `tsc-alias` en las devDependencies (ya incluidos en el proyecto).

**Solución si los archivos se generan pero no se encuentran al ejecutar:**
Si el build muestra que los archivos se generan correctamente pero Render no los encuentra al ejecutar:

1. **Verifica el Root Directory:** Asegúrate de que esté configurado exactamente como `backend` (sin espacios, sin barras).

2. **Usa el Build Command de verificación:**
   ```
   npm install && npm run build:tsc:verify
   ```
   Esto mostrará exactamente qué archivos se generan y dónde están.

3. **Si los archivos se generan pero no se suben:** El problema podría ser que Render no está preservando los archivos después del build. En este caso, intenta usar el **Start Command** con ruta absoluta:
   ```
   cd /opt/render/project/src/backend && node dist/main.js
   ```
   O verifica que el Root Directory esté configurado correctamente.

### Error: Build failed en Vercel

**Síntomas:**
- Error: `sh: line 1: cd: frontend: No such file or directory`
- Error: `Command "cd frontend && npm ci && npm run build" exited with 1`

**Solución:**
1. **Verifica el Root Directory:**
   - Ve a Vercel Dashboard → Tu proyecto → Settings → General
   - Busca la sección "Root Directory"
   - Asegúrate de que esté configurado exactamente como: `frontend`
   - Sin espacios, sin barras adicionales

2. **Si el Root Directory está configurado correctamente:**
   - El `vercel.json` en la raíz ya está actualizado para no usar `cd frontend`
   - Los comandos de build deben ser:
     - **Build Command**: `npm ci && npm run build` (o dejar vacío)
     - **Output Directory**: `dist` (o dejar vacío)
     - **Install Command**: `npm ci` (o dejar vacío)

3. **Si el error persiste:**
   - Elimina el `vercel.json` de la raíz temporalmente
   - Configura manualmente en Vercel:
     - Root Directory: `frontend`
     - Build Command: `npm ci && npm run build`
     - Output Directory: `dist`
     - Framework: `Vite`

### El frontend no se conecta al backend

**Solución:**
- Verifica que `VITE_API_URL` en Vercel sea correcta
- Asegúrate de que el backend esté funcionando (revisa logs)
- Verifica que CORS esté configurado correctamente
- Abre la consola del navegador para ver errores específicos

---

## 📝 Notas Importantes

### Seguridad

1. **Nunca** commitees archivos `.env` al repositorio
2. Usa variables de entorno en Render y Vercel
3. Genera un `JWT_SECRET` fuerte y único
4. En producción, restringe el acceso a MongoDB Atlas por IP

### Costos

- **Render Free Tier**: 
  - Servicios se "duermen" después de 15 minutos de inactividad
  - Primer request puede tardar 30-60 segundos
  - Considera el plan Starter ($7/mes) para producción

- **Vercel Free Tier**:
  - Generoso para proyectos pequeños
  - Sin límites de tiempo de ejecución para frontends estáticos

- **MongoDB Atlas Free Tier**:
  - 512MB de almacenamiento
  - Suficiente para desarrollo y proyectos pequeños

### Monitoreo

1. Configura alertas en Render para errores
2. Usa los logs de Vercel para monitorear el frontend
3. Considera agregar un servicio de monitoreo (Sentry, LogRocket, etc.)

---

## 🔄 Actualizaciones Futuras

Para actualizar el sistema:

1. **Backend**: 
   - Haz push a tu rama principal
   - Render detectará los cambios y desplegará automáticamente

2. **Frontend**:
   - Haz push a tu rama principal
   - Vercel detectará los cambios y desplegará automáticamente

Ambos servicios tienen **auto-deploy** habilitado por defecto.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render y Vercel
2. Verifica la documentación oficial:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

---

¡Feliz despliegue! 🎉

