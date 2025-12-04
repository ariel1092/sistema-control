/**
 * 🔄 Script Keep-Alive para Render
 * 
 * Este script hace ping periódico al endpoint de health check para mantener
 * el servicio activo en Render (evita que se "duerma").
 * 
 * Uso:
 *   1. Ejecutar localmente: ts-node scripts/keep-alive.ts
 *   2. O configurar en un servicio de cron (cron-job.org, UptimeRobot, etc.)
 *   3. O usar el script de Node.js con PM2 para ejecutarlo 24/7
 * 
 * Frecuencia recomendada: Cada 10-14 minutos (Render se duerme después de ~15 min)
 */

import axios from 'axios';

// URL del backend en producción (ajustar según tu deploy)
const BACKEND_URL = process.env.BACKEND_URL || 'https://sistema-control.onrender.com';
const HEALTH_ENDPOINT = `${BACKEND_URL}/api/v1/health`;
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos en milisegundos

let pingCount = 0;
let lastSuccessTime: Date | null = null;

async function pingBackend() {
  try {
    const startTime = Date.now();
    const response = await axios.get(HEALTH_ENDPOINT, {
      timeout: 10000, // 10 segundos timeout
    });
    const duration = Date.now() - startTime;
    
    pingCount++;
    lastSuccessTime = new Date();
    
    console.log(`✅ [${new Date().toLocaleTimeString()}] Ping #${pingCount} exitoso - ${duration}ms`);
    console.log(`   Status: ${response.status} | Response: ${JSON.stringify(response.data).substring(0, 100)}`);
    
    return true;
  } catch (error: any) {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Error en ping #${pingCount + 1}:`, error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('   ⚠️  El servicio puede estar "dormido". Render lo despertará en el próximo request.');
    }
    
    return false;
  }
}

async function startKeepAlive() {
  console.log('🔄 Iniciando Keep-Alive para Render...');
  console.log(`📍 URL: ${BACKEND_URL}`);
  console.log(`⏰ Intervalo: ${PING_INTERVAL / 1000 / 60} minutos`);
  console.log('');

  // Hacer ping inmediato
  await pingBackend();

  // Configurar ping periódico
  setInterval(async () => {
    await pingBackend();
    
    // Mostrar estadísticas cada 10 pings
    if (pingCount % 10 === 0 && lastSuccessTime) {
      console.log(`\n📊 Estadísticas: ${pingCount} pings exitosos | Último éxito: ${lastSuccessTime.toLocaleString()}\n`);
    }
  }, PING_INTERVAL);

  // Manejar cierre graceful
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Deteniendo Keep-Alive...');
    console.log(`📊 Total de pings: ${pingCount}`);
    if (lastSuccessTime) {
      console.log(`✅ Último ping exitoso: ${lastSuccessTime.toLocaleString()}`);
    }
    process.exit(0);
  });

  console.log('✅ Keep-Alive activo. Presiona Ctrl+C para detener.\n');
}

// Ejecutar
startKeepAlive();

