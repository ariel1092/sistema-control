/**
 * ⚠️⚠️⚠️ SCRIPT MUY PELIGROSO: VACÍA LA BASE DE DATOS DE PRODUCCIÓN ⚠️⚠️⚠️
 * 
 * Este script elimina TODAS las colecciones de la base de datos de PRODUCCIÓN.
 * 
 * ⚠️ ADVERTENCIA: ESTO BORRARÁ TODOS LOS DATOS DE PRODUCCIÓN DE FORMA PERMANENTE.
 * 
 * Uso:
 *   PRODUCTION=true npm run clear:db:prod
 *   o
 *   ts-node scripts/clear-database-prod.ts
 * 
 * El script requiere que MONGODB_URI esté configurada con la URI de producción.
 */

import mongoose from 'mongoose';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Intentar cargar variables de entorno desde .env si existe
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const COLLECTIONS = [
  'ventas',
  'detalle_ventas',
  'productos',
  'clientes',
  'usuarios',
  'proveedores',
  'empleados',
  'cierre_cajas',
  'movimientos_stock',
  'movimientos_caja',
  'facturas_proveedores',
  'detalle_factura_proveedor',
  'remitos_proveedores',
  'detalle_remitos',
  'ordenes_compra',
  'detalle_orden_compra',
  'retiros_socios',
  'gastos_diarios',
  'movimientos_cuenta_corriente',
];

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function clearProductionDatabase() {
  try {
    // Verificar que MONGODB_URI esté configurada
    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      console.error('❌ ERROR: MONGODB_URI no está configurada.');
      console.error('   Configura la variable de entorno MONGODB_URI con la URI de producción.');
      console.error('   Ejemplo (PowerShell): $env:MONGODB_URI="mongodb+srv://..."; npm run clear:db:prod');
      console.error('\n   📍 Cómo obtener la URI:');
      console.error('   1. Ve a Render Dashboard → Tu servicio → Environment');
      console.error('   2. Busca MONGODB_URI y copia el valor completo');
      console.error('   3. O ve a MongoDB Atlas → Connect → Connection String');
      process.exit(1);
    }

    // Validar que la URI no sea un ejemplo
    if (mongodbUri.includes('usuario:password') || mongodbUri.includes('cluster.mongodb.net') && !mongodbUri.includes('@')) {
      console.error('❌ ERROR: Parece que estás usando una URI de ejemplo.');
      console.error('   Necesitas usar la URI REAL de tu base de datos de producción.');
      console.error('   La URI debe tener el formato: mongodb+srv://USUARIO:CONTRASEÑA@cluster.xxxxx.mongodb.net/...');
      process.exit(1);
    }

    // Mostrar advertencias
    console.log('\n⚠️⚠️⚠️  ADVERTENCIA CRÍTICA  ⚠️⚠️⚠️');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Este script eliminará TODOS los datos de la base de datos de');
    console.log('PRODUCCIÓN de forma PERMANENTE e IRREVERSIBLE.');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Mostrar URI (ocultando credenciales)
    const maskedUri = mongodbUri.replace(/\/\/.*:.*@/, '//***:***@');
    console.log('🔌 Base de datos de destino:');
    console.log(`   ${maskedUri}\n`);

    console.log('📋 Colecciones que se eliminarán:');
    COLLECTIONS.forEach(col => console.log(`   - ${col}`));
    console.log('');

    // Primera confirmación
    const confirm1 = await askQuestion('⚠️  ¿Estás SEGURO de que quieres continuar? (escribe "SI, BORRAR TODO" para confirmar): ');
    
    if (confirm1 !== 'SI, BORRAR TODO') {
      console.log('❌ Operación cancelada. No se borró nada.');
      process.exit(0);
    }

    // Segunda confirmación
    console.log('\n⚠️  ÚLTIMA OPORTUNIDAD:');
    const confirm2 = await askQuestion('⚠️  Escribe "CONFIRMO BORRAR PRODUCCION" para proceder: ');
    
    if (confirm2 !== 'CONFIRMO BORRAR PRODUCCION') {
      console.log('❌ Operación cancelada. No se borró nada.');
      process.exit(0);
    }

    console.log('\n🔌 Conectando a MongoDB de producción...');
    await mongoose.connect(mongodbUri);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la instancia de la base de datos');
    }

    // Obtener todas las colecciones existentes
    const existingCollections = await db.listCollections().toArray();
    const collectionNames = existingCollections.map(col => col.name);

    console.log(`\n📊 Colecciones encontradas en la base de datos: ${collectionNames.length}`);
    collectionNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // Última confirmación con el número de colecciones
    const confirm3 = await askQuestion(`⚠️  Se eliminarán ${collectionNames.length} colecciones. ¿Continuar? (escribe "SI"): `);
    
    if (confirm3 !== 'SI') {
      console.log('❌ Operación cancelada. No se borró nada.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Eliminar cada colección
    console.log('\n🗑️  Eliminando colecciones...\n');
    let deletedCount = 0;
    for (const collectionName of collectionNames) {
      try {
        await db.collection(collectionName).drop();
        console.log(`✅ Eliminada: ${collectionName}`);
        deletedCount++;
      } catch (error: any) {
        if (error.code === 26) {
          // Colección no existe, ignorar
          console.log(`⚠️  No existe: ${collectionName}`);
        } else {
          console.error(`❌ Error al eliminar ${collectionName}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Proceso completado. ${deletedCount} colecciones eliminadas.`);
    console.log('💾 La base de datos de PRODUCCIÓN está ahora vacía.');
    console.log('⚠️  Recuerda recrear los datos necesarios (usuarios, productos, etc.)');

  } catch (error: any) {
    console.error('\n❌ Error al vaciar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
    process.exit(0);
  }
}

// Ejecutar
clearProductionDatabase();

