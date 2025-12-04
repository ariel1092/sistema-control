import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  collections?: string[];
}

async function backupMongoDB(options: BackupOptions = {}) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get(Connection, { strict: false });

  try {
    console.log('🔄 Iniciando backup de MongoDB...\n');

    // Obtener URI de conexión
    const mongoUri = process.env.MONGODB_URI || connection.host;
    const dbName = process.env.MONGODB_DB_NAME || 'ventas-ferreteria';

    // Configurar directorio de salida
    const outputDir = options.outputDir || path.join(process.cwd(), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(outputDir, `backup-${timestamp}`);

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Directorio de backups creado: ${outputDir}`);
    }

    // Extraer información de conexión de la URI
    let mongoHost = 'localhost';
    let mongoPort = '27017';
    let mongoUser = '';
    let mongoPassword = '';
    let authSource = 'admin';

    if (mongoUri && mongoUri.startsWith('mongodb://')) {
      const uriMatch = mongoUri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)\/([^?]+)(?:\?([^#]+))?/);
      if (uriMatch) {
        mongoUser = uriMatch[1] || '';
        mongoPassword = uriMatch[2] || '';
        mongoHost = uriMatch[3] || 'localhost';
        mongoPort = uriMatch[4] || '27017';
        const queryParams = uriMatch[6] || '';
        if (queryParams.includes('authSource=')) {
          authSource = queryParams.split('authSource=')[1].split('&')[0];
        }
      }
    }

    // Construir comando mongodump
    let mongodumpCmd = `mongodump --host ${mongoHost}:${mongoPort} --db ${dbName} --out ${backupPath}`;

    if (mongoUser && mongoPassword) {
      mongodumpCmd += ` --username ${mongoUser} --password ${mongoPassword} --authenticationDatabase ${authSource}`;
    }

    if (options.collections && options.collections.length > 0) {
      mongodumpCmd += ` --collection ${options.collections.join(' --collection ')}`;
    }

    console.log('📦 Ejecutando mongodump...');
    console.log(`   Host: ${mongoHost}:${mongoPort}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Output: ${backupPath}\n`);

    // Ejecutar mongodump
    const { stdout, stderr } = await execAsync(mongodumpCmd);

    if (stderr && !stderr.includes('writing') && !stderr.includes('done')) {
      console.error('⚠️  Advertencias durante el backup:', stderr);
    }

    console.log('✅ Backup completado exitosamente');

    // Comprimir si se solicita
    if (options.compress) {
      console.log('🗜️  Comprimiendo backup...');
      const zipPath = `${backupPath}.tar.gz`;
      const compressCmd = `tar -czf ${zipPath} -C ${outputDir} backup-${timestamp}`;
      await execAsync(compressCmd);
      console.log(`✅ Backup comprimido: ${zipPath}`);

      // Eliminar directorio sin comprimir
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log(`📁 Backup final: ${zipPath}`);
      console.log(`📊 Tamaño: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log(`📁 Backup guardado en: ${backupPath}`);
      const stats = fs.statSync(backupPath);
      console.log(`📊 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Limpiar backups antiguos (mantener solo los últimos 10)
    console.log('\n🧹 Limpiando backups antiguos...');
    const backups = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(outputDir, file),
        time: fs.statSync(path.join(outputDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      for (const backup of toDelete) {
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(`   🗑️  Eliminado: ${backup.name}`);
      }
      console.log(`✅ Se mantienen los últimos 10 backups`);
    } else {
      console.log(`✅ Total de backups: ${backups.length}`);
    }

    console.log('\n✨ Proceso de backup finalizado exitosamente');

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: BackupOptions = {};

  // Parsear argumentos
  if (args.includes('--compress')) {
    options.compress = true;
  }

  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.outputDir = args[outputIndex + 1];
  }

  const collectionsIndex = args.indexOf('--collections');
  if (collectionsIndex !== -1 && args[collectionsIndex + 1]) {
    options.collections = args[collectionsIndex + 1].split(',');
  }

  backupMongoDB(options).catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
}

export { backupMongoDB };

