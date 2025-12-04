# 🔄 Mantener Render Activo (Keep-Alive)

**Problema:** Render (plan gratuito) suspende el servicio después de ~15 minutos sin tráfico.

**Solución:** Implementar un sistema de "ping" periódico para mantener el servicio activo.

---

## 🎯 Opciones Disponibles

### Opción 1: Servicio Externo Gratuito (RECOMENDADO) ⭐

Usa un servicio de monitoreo gratuito que haga ping automáticamente:

#### A) UptimeRobot (Recomendado)
1. Ve a [UptimeRobot](https://uptimerobot.com)
2. Crea cuenta gratuita
3. Click en **"Add New Monitor"**
4. Configura:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Sistema Control Keep-Alive
   - **URL:** `https://sistema-control.onrender.com/api/v1/health`
   - **Monitoring Interval:** 5 minutes (gratis permite hasta 5 min)
5. Click **"Create Monitor"**

**Ventajas:**
- ✅ Gratis
- ✅ Funciona 24/7
- ✅ No consume recursos locales
- ✅ Notificaciones si el servicio cae

#### B) cron-job.org
1. Ve a [cron-job.org](https://cron-job.org)
2. Crea cuenta gratuita
3. Click en **"Create cronjob"**
4. Configura:
   - **Title:** Render Keep-Alive
   - **Address:** `https://sistema-control.onrender.com/api/v1/health`
   - **Schedule:** Cada 10 minutos (`*/10 * * * *`)
5. Click **"Create"**

---

### Opción 2: Script Local con Node.js

Si tienes una máquina que esté siempre encendida:

```bash
# Instalar dependencias si no están
cd backend
npm install

# Ejecutar keep-alive
BACKEND_URL=https://sistema-control.onrender.com npm run keep-alive
```

**Para ejecutar en background (Linux/Mac):**
```bash
nohup npm run keep-alive > keep-alive.log 2>&1 &
```

**Para ejecutar con PM2 (recomendado para producción):**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Ejecutar con PM2
pm2 start npm --name "keep-alive" -- run keep-alive

# Ver logs
pm2 logs keep-alive

# Reiniciar automáticamente si se cae
pm2 startup
pm2 save
```

---

### Opción 3: GitHub Actions (Gratis)

Crea un workflow que haga ping periódicamente:

1. Crea `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Render Alive

on:
  schedule:
    - cron: '*/10 * * * *' # Cada 10 minutos
  workflow_dispatch: # Permite ejecución manual

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render
        run: |
          curl -f https://sistema-control.onrender.com/api/v1/health || exit 1
```

**Ventajas:**
- ✅ Gratis (GitHub Actions tiene 2000 minutos/mes gratis)
- ✅ No requiere servidor propio
- ✅ Se ejecuta automáticamente

---

### Opción 4: Frontend Keep-Alive (Si hay usuarios activos)

Si quieres que el frontend mantenga el servicio activo mientras hay usuarios:

Agrega esto en `frontend/src/App.tsx`:

```typescript
useEffect(() => {
  // Ping al backend cada 10 minutos si el usuario está activo
  const interval = setInterval(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .catch(() => {}); // Ignorar errores silenciosamente
  }, 10 * 60 * 1000); // 10 minutos

  return () => clearInterval(interval);
}, []);
```

**Limitación:** Solo funciona si hay usuarios activos en el frontend.

---

## 📊 Comparación de Opciones

| Opción | Costo | Confiabilidad | Facilidad | Recomendación |
|--------|-------|---------------|-----------|---------------|
| **UptimeRobot** | Gratis | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **MEJOR** |
| **cron-job.org** | Gratis | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Buena |
| **GitHub Actions** | Gratis | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Buena |
| **Script Local** | Gratis* | ⭐⭐⭐ | ⭐⭐ | ⚠️ Requiere PC siempre encendida |
| **Frontend** | Gratis | ⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Solo si hay usuarios activos |

*Requiere tener una máquina siempre encendida

---

## 🎯 Recomendación Final

**Usa UptimeRobot** - Es la opción más simple y confiable:
1. ✅ Gratis
2. ✅ Configuración en 2 minutos
3. ✅ Funciona 24/7 sin intervención
4. ✅ Notificaciones si algo falla
5. ✅ Dashboard para monitoreo

---

## ⚙️ Configuración del Script

Si usas el script local, puedes configurar variables de entorno:

```bash
# URL del backend (ajustar según tu deploy)
BACKEND_URL=https://sistema-control.onrender.com npm run keep-alive

# O crear archivo .env
echo "BACKEND_URL=https://sistema-control.onrender.com" > .env
npm run keep-alive
```

---

## 📝 Notas

- **Frecuencia recomendada:** Cada 10-14 minutos (Render se duerme después de ~15 min)
- **Endpoint usado:** `/api/v1/health` (no consume recursos, solo verifica que el servicio esté activo)
- **Plan de Render:** El plan gratuito tiene limitaciones, considera actualizar si necesitas más recursos

---

**¿Querés que configure alguna de estas opciones?**

