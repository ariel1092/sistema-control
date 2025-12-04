# Guía Paso a Paso: Configuración de Monitoreo y Backups

Esta guía te llevará paso a paso para configurar UptimeRobot, Sentry y los backups automáticos.

---

## 📊 Parte 1: Configurar UptimeRobot

UptimeRobot es un servicio gratuito que monitorea tu aplicación y te envía alertas si está caída.

### Paso 1: Crear cuenta en UptimeRobot

1. Ve a https://uptimerobot.com
2. Click en **"Sign Up"** (arriba a la derecha)
3. Completa el formulario:
   - **Email**: Tu email
   - **Password**: Crea una contraseña segura
   - Acepta los términos y condiciones
4. Click en **"Create Account"**
5. Verifica tu email (revisa tu bandeja de entrada)

### Paso 2: Agregar un monitor

1. Una vez dentro de UptimeRobot, verás el dashboard
2. Click en el botón **"+ Add New Monitor"** (botón verde grande)

### Paso 3: Configurar el monitor

Completa el formulario con estos datos:

**Monitor Type:**
- Selecciona: **HTTP(s)**

**Friendly Name:**
- Escribe: `Ferretería API` (o el nombre que prefieras)

**URL (or IP):**
- Escribe: `https://tu-dominio.com/api/v1/health`
  - ⚠️ **IMPORTANTE**: Reemplaza `tu-dominio.com` con tu dominio real
  - Ejemplo: `https://ventas-ferreteria.onrender.com/api/v1/health`
  - Ejemplo: `https://api.mi-ferreteria.com/api/v1/health`

**Monitoring Interval:**
- Selecciona: **5 minutes** (gratis permite hasta 50 monitores)

**Alert Contacts:**
- Marca tu email para recibir alertas

### Paso 4: Guardar

1. Click en **"Create Monitor"**
2. ¡Listo! Tu monitor está activo

### Paso 5: Verificar que funciona

1. Espera 5 minutos
2. El monitor debería cambiar a estado **"Up"** (verde)
3. Si está en **"Down"** (rojo), verifica:
   - Que la URL sea correcta
   - Que tu backend esté corriendo
   - Que el endpoint `/api/v1/health` responda

**💡 Tip**: UptimeRobot hace ping cada 5 minutos, lo que mantiene despierto tu servidor de Render (evita que se "duerma" en el plan gratuito).

---

## 🔔 Parte 2: Configurar Sentry

Sentry monitorea errores en tiempo real y te envía notificaciones cuando algo falla.

### Paso 1: Crear cuenta en Sentry

1. Ve a https://sentry.io
2. Click en **"Sign Up"** (arriba a la derecha)
3. Puedes registrarte con:
   - Google
   - GitHub
   - Email
4. Completa el formulario si usas email
5. Verifica tu email si es necesario

### Paso 2: Crear proyecto para Backend (Node.js)

1. Una vez dentro de Sentry, verás el dashboard
2. Click en **"Create Project"** o **"+ New Project"**
3. Selecciona la plataforma: **Node.js**
4. Click en **"Create Project"**
5. **Copia el DSN** que aparece (algo como: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
   - ⚠️ **GUARDA ESTE DSN**, lo necesitarás después
6. Click en **"Skip this onboarding"** (ya tenemos el código configurado)

### Paso 3: Crear proyecto para Frontend (React)

1. Click en **"+ New Project"** nuevamente
2. Selecciona la plataforma: **React**
3. Click en **"Create Project"**
4. **Copia el DSN** del proyecto React
   - ⚠️ **GUARDA ESTE DSN**, es diferente al del backend
5. Click en **"Skip this onboarding"**

### Paso 4: Configurar Backend con Sentry

Ahora necesitas agregar el DSN de Sentry a tu backend.

#### Si usas Render:

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio de backend
3. Click en **"Environment"** (en el menú lateral)
4. Click en **"Add Environment Variable"**
5. Agrega:
   - **Key**: `SENTRY_DSN`
   - **Value**: Pega el DSN del proyecto Node.js de Sentry
6. Click en **"Save Changes"**
7. Render reiniciará automáticamente tu servicio

#### Si usas otro servicio (Vercel, Railway, etc.):

1. Ve a la configuración de variables de entorno de tu servicio
2. Agrega:
   - **Key**: `SENTRY_DSN`
   - **Value**: El DSN del proyecto Node.js de Sentry
3. Guarda y reinicia el servicio

#### Si usas Docker/local:

1. Edita tu archivo `.env` o `docker-compose.yml`
2. Agrega:
   ```env
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Reinicia tu aplicación

### Paso 5: Configurar Frontend con Sentry

#### Si usas Vercel:

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto de frontend
3. Click en **"Settings"**
4. Click en **"Environment Variables"**
5. Agrega:
   - **Key**: `VITE_SENTRY_DSN`
   - **Value**: Pega el DSN del proyecto React de Sentry
   - **Environment**: Production (y Development si quieres)
6. Click en **"Save"**
7. Vercel desplegará automáticamente con la nueva variable

#### Si usas Netlify:

1. Ve a tu proyecto en Netlify: https://app.netlify.com
2. Selecciona tu sitio
3. Click en **"Site settings"**
4. Click en **"Environment variables"**
5. Click en **"Add a variable"**
6. Agrega:
   - **Key**: `VITE_SENTRY_DSN`
   - **Value**: El DSN del proyecto React de Sentry
7. Click en **"Save"**
8. Ve a **"Deploys"** y haz un nuevo deploy

#### Si usas otro servicio:

1. Ve a la configuración de variables de entorno
2. Agrega:
   - **Key**: `VITE_SENTRY_DSN`
   - **Value**: El DSN del proyecto React de Sentry
3. Guarda y redespliega

### Paso 6: Verificar que Sentry funciona

1. Espera unos minutos después de configurar
2. Ve a tu dashboard de Sentry
3. Deberías ver eventos si hay errores
4. Para probar, puedes hacer un error intencional en tu código y verificar que aparece en Sentry

**💡 Tip**: Sentry es gratuito hasta 5,000 eventos/mes, suficiente para la mayoría de aplicaciones.

---

## 💾 Parte 3: Configurar Backups Automáticos

Tienes 3 opciones. Elige la que mejor se adapte a tu situación.

---

### 🔹 Opción A: PM2 en tu servidor (Recomendado si tienes un servidor propio)

PM2 es un gestor de procesos para Node.js que mantiene tus scripts corriendo.

#### Paso 1: Instalar PM2

En tu servidor (o computadora que esté siempre encendida):

```bash
npm install -g pm2
```

#### Paso 2: Instalar dependencias del script de backup

```bash
cd /ruta/a/tu/proyecto/backend
npm install mongodb node-cron dotenv
```

#### Paso 3: Crear archivo .env para backups

Crea un archivo `.env` en la raíz del proyecto (o en `backend/`):

```bash
nano .env
```

Agrega estas variables:

```env
MONGODB_URI=mongodb://usuario:password@host:27017/ventas-ferreteria?authSource=admin
BACKUP_DIR=./backups
BACKUP_SCHEDULE=0 2 * * *
KEEP_BACKUPS=10
```

**Explicación:**
- `MONGODB_URI`: Tu cadena de conexión a MongoDB
- `BACKUP_DIR`: Donde se guardarán los backups
- `BACKUP_SCHEDULE`: Horario en formato cron (`0 2 * * *` = 2 AM diario)
- `KEEP_BACKUPS`: Cuántos backups mantener (10 = últimos 10)

#### Paso 4: Iniciar el script con PM2

```bash
cd /ruta/a/tu/proyecto/backend
pm2 start scripts/backup-mongodb-cron.js --name "backup-ferreteria"
```

#### Paso 5: Guardar configuración de PM2

```bash
pm2 save
```

Esto guarda la lista de procesos para que PM2 los recuerde.

#### Paso 6: Configurar PM2 para iniciar al arrancar el servidor

```bash
pm2 startup
```

Este comando te dará un comando para ejecutar como `sudo`. Cópialo y ejecútalo.

#### Paso 7: Verificar que funciona

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs backup-ferreteria

# Verificar que el backup se ejecutó
ls -la backups/
```

**Comandos útiles de PM2:**
```bash
pm2 stop backup-ferreteria    # Detener
pm2 restart backup-ferreteria  # Reiniciar
pm2 delete backup-ferreteria  # Eliminar
pm2 logs backup-ferreteria    # Ver logs
```

---

### 🔹 Opción B: Render Background Worker (Recomendado si usas Render)

Render permite crear "Background Workers" que corren scripts continuamente.

#### Paso 1: Crear nuevo servicio en Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Click en **"New +"** (arriba a la derecha)
3. Selecciona **"Background Worker"**

#### Paso 2: Conectar repositorio

1. Conecta tu repositorio de GitHub (si no está conectado)
2. Selecciona el repositorio
3. Click en **"Connect"**

#### Paso 3: Configurar el Background Worker

Completa el formulario:

**Name:**
- `backup-ferreteria` (o el nombre que prefieras)

**Region:**
- Selecciona la región más cercana

**Branch:**
- `main` (o la rama que uses)

**Root Directory:**
- `backend` (si tu código está en la carpeta backend)

**Build Command:**
```bash
npm install mongodb node-cron dotenv
```

**Start Command:**
```bash
node scripts/backup-mongodb-cron.js
```

#### Paso 4: Configurar variables de entorno

En la sección **"Environment Variables"**, agrega:

**MONGODB_URI:**
- Value: Tu cadena de conexión a MongoDB
- Ejemplo: `mongodb://admin:password@host:27017/ventas-ferreteria?authSource=admin`

**BACKUP_DIR:**
- Value: `/opt/render/project/src/backups`
- (Render usa este directorio para archivos persistentes)

**BACKUP_SCHEDULE:**
- Value: `0 2 * * *` (2 AM diario)
- O `0 */6 * * *` (cada 6 horas)
- O `0 0 * * 0` (domingos a medianoche)

**KEEP_BACKUPS:**
- Value: `10`

#### Paso 5: Crear el servicio

1. Click en **"Create Background Worker"**
2. Render comenzará a construir y ejecutar el servicio

#### Paso 6: Verificar que funciona

1. Espera a que el servicio esté "Live"
2. Click en **"Logs"** para ver los logs
3. Deberías ver mensajes del script de backup
4. Espera al horario programado o ejecuta manualmente (ver abajo)

**Para ejecutar un backup manualmente:**

1. En Render, ve a tu Background Worker
2. Click en **"Shell"**
3. Ejecuta:
```bash
node scripts/backup-mongodb-cron.js --once
```

**💡 Tip**: Los backups se guardan en el sistema de archivos de Render. Para backups más seguros, considera subirlos a S3 o Google Cloud Storage.

---

### 🔹 Opción C: Cron en servidor Linux

Si tienes acceso a un servidor Linux, puedes usar cron (el programador de tareas nativo).

#### Paso 1: Instalar dependencias

En tu servidor:

```bash
cd /ruta/a/tu/proyecto/backend
npm install mongodb node-cron dotenv
```

#### Paso 2: Crear archivo .env

```bash
nano .env
```

Agrega:

```env
MONGODB_URI=mongodb://usuario:password@host:27017/ventas-ferreteria?authSource=admin
BACKUP_DIR=/ruta/absoluta/a/backups
BACKUP_SCHEDULE=0 2 * * *
KEEP_BACKUPS=10
```

#### Paso 3: Crear script wrapper para cron

Crea un archivo `backup-wrapper.sh`:

```bash
nano backup-wrapper.sh
```

Contenido:

```bash
#!/bin/bash
cd /ruta/a/tu/proyecto/backend
/usr/bin/node scripts/backup-mongodb-cron.js --once >> /var/log/backup-ferreteria.log 2>&1
```

**⚠️ IMPORTANTE**: Reemplaza `/ruta/a/tu/proyecto/backend` con la ruta real.

#### Paso 4: Hacer el script ejecutable

```bash
chmod +x backup-wrapper.sh
```

#### Paso 5: Configurar cron

```bash
crontab -e
```

Agrega esta línea al final del archivo:

```
0 2 * * * /ruta/completa/a/backup-wrapper.sh
```

**Explicación del formato cron:**
- `0 2 * * *` = Todos los días a las 2:00 AM
- `0 */6 * * *` = Cada 6 horas
- `0 0 * * 0` = Domingos a medianoche

**Ejemplos:**
```
# Todos los días a las 2 AM
0 2 * * * /ruta/a/backup-wrapper.sh

# Cada 6 horas
0 */6 * * * /ruta/a/backup-wrapper.sh

# Cada 12 horas (mediodía y medianoche)
0 0,12 * * * /ruta/a/backup-wrapper.sh
```

#### Paso 6: Guardar y verificar

1. Guarda el archivo (en nano: `Ctrl+X`, luego `Y`, luego `Enter`)
2. Verifica que se agregó:
```bash
crontab -l
```

#### Paso 7: Probar manualmente

```bash
/ruta/a/backup-wrapper.sh
```

Verifica que se creó el backup:
```bash
ls -la /ruta/a/backups/
```

#### Paso 8: Ver logs

```bash
tail -f /var/log/backup-ferreteria.log
```

---

## ✅ Checklist Final

Marca cada paso cuando lo completes:

### UptimeRobot
- [ ] Cuenta creada
- [ ] Monitor configurado
- [ ] URL correcta (con tu dominio real)
- [ ] Monitor muestra estado "Up"

### Sentry
- [ ] Cuenta creada
- [ ] Proyecto Node.js creado
- [ ] Proyecto React creado
- [ ] DSN backend agregado a variables de entorno
- [ ] DSN frontend agregado a variables de entorno
- [ ] Backend redesplegado
- [ ] Frontend redesplegado
- [ ] Errores aparecen en Sentry (probar con un error intencional)

### Backups
- [ ] Opción elegida (A, B o C)
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Script ejecutándose
- [ ] Backup de prueba creado
- [ ] Backup restaurado exitosamente (prueba)

---

## 🆘 Solución de Problemas

### UptimeRobot muestra "Down"

1. Verifica que tu backend esté corriendo
2. Prueba la URL manualmente en el navegador: `https://tu-dominio.com/api/v1/health`
3. Verifica que la URL no tenga errores de escritura
4. Revisa los logs de tu backend

### Sentry no recibe errores

1. Verifica que `SENTRY_DSN` esté en las variables de entorno
2. Verifica que el DSN sea correcto (sin espacios)
3. Reinicia tu aplicación después de agregar la variable
4. Revisa los logs de tu aplicación

### Backups no se ejecutan

**PM2:**
```bash
pm2 logs backup-ferreteria  # Ver logs
pm2 restart backup-ferreteria  # Reiniciar
```

**Render:**
- Revisa los logs en el dashboard
- Verifica las variables de entorno
- Prueba ejecutar manualmente: `node scripts/backup-mongodb-cron.js --once`

**Cron:**
```bash
crontab -l  # Verificar que el cron está configurado
tail -f /var/log/backup-ferreteria.log  # Ver logs
```

---

## 📚 Recursos Adicionales

- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [Sentry Docs](https://docs.sentry.io/)
- [PM2 Docs](https://pm2.keymetrics.io/)
- [Cron Guide](https://crontab.guru/)
- [Render Docs](https://render.com/docs)

---

¿Necesitas ayuda con algún paso específico? Revisa los logs o consulta la documentación oficial.

