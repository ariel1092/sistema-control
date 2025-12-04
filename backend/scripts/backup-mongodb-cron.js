// Script de backup de MongoDB con cron
// Uso: node backup-mongodb-cron.js
// Requiere: npm install mongodb node-cron dotenv

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const cron = require('node-cron');

const execAsync = promisify(exec);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ventas-ferreteria';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // 2 AM diario por defecto
const KEEP_BACKUPS = parseInt(process.env.KEEP_BACKUPS || '10');

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Directorio de backups creado: ${BACKUP_DIR}`);
}

async function performBackup() {
  try {
    console.log(`\n🔄 [${new Date().toISOString()}] Iniciando backup de MongoDB...`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
    const zipPath = `${backupPath}.tar.gz`;

    // Extraer información de la URI
    const uri = new URL(MONGO_URI);
    const dbName = uri.pathname.substring(1) || 'ventas-ferreteria';
    const host = uri.hostname || 'localhost';
    const port = uri.port || '27017';
    const username = uri.username || '';
    const password = uri.password || '';
    const authSource = uri.searchParams.get('authSource') || 'admin';

    // Construir comando mongodump
    let mongodumpCmd = `mongodump --host ${host}:${port} --db ${dbName} --out ${backupPath}`;

    if (username && password) {
      mongodumpCmd += ` --username ${username} --password ${password} --authenticationDatabase ${authSource}`;
    }

    console.log(`📦 Ejecutando mongodump...`);
    const { stdout, stderr } = await execAsync(mongodumpCmd);

    if (stderr && !stderr.includes('writing') && !stderr.includes('done')) {
      console.warn('⚠️  Advertencias:', stderr);
    }

    // Comprimir backup
    console.log('🗜️  Comprimiendo backup...');
    await execAsync(`tar -czf ${zipPath} -C ${BACKUP_DIR} backup-${timestamp}`);
    
    // Eliminar directorio sin comprimir
    fs.rmSync(backupPath, { recursive: true, force: true });

    const stats = fs.statSync(zipPath);
    console.log(`✅ Backup completado: ${zipPath}`);
    console.log(`📊 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Limpiar backups antiguos
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      })
      .sort((a, b) => b.time - a.time);

    if (backups.length > KEEP_BACKUPS) {
      const toDelete = backups.slice(KEEP_BACKUPS);
      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        console.log(`🗑️  Eliminado backup antiguo: ${backup.name}`);
      }
    }

    console.log(`✨ Backup finalizado exitosamente\n`);

  } catch (error) {
    console.error(`❌ Error durante el backup:`, error);
    // No lanzar error para que el cron continúe
  }
}

// Ejecutar backup inmediatamente si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--once')) {
    // Ejecutar una sola vez
    performBackup().then(() => {
      console.log('✅ Backup único completado');
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
  } else {
    // Ejecutar con cron
    console.log(`📅 Programando backups con cron: ${BACKUP_SCHEDULE}`);
    console.log(`📁 Directorio de backups: ${BACKUP_DIR}`);
    console.log(`💾 Mantener últimos ${KEEP_BACKUPS} backups\n`);

    // Ejecutar backup inmediatamente
    performBackup();

    // Programar backups periódicos
    cron.schedule(BACKUP_SCHEDULE, performBackup);

    console.log('✅ Cron de backups iniciado. Presiona Ctrl+C para detener.');
  }
}

module.exports = { performBackup };

