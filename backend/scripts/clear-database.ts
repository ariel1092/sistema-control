/**
 * ⚠️ SCRIPT PELIGROSO: VACÍA TODA LA BASE DE DATOS
 * 
 * Este script elimina TODAS las colecciones de la base de datos.
 * ÚSALO SOLO EN DESARROLLO O SI ESTÁS SEGURO DE QUERER PERDER TODOS LOS DATOS.
 * 
 * Uso:
 *   npm run clear-db
 *   o
 *   ts-node scripts/clear-database.ts
 */

import mongoose from 'mongoose';
import { getDatabaseConfig } from '../src/infrastructure/config/database.config';

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

async function clearDatabase() {
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos.');
    console.log('📋 Colecciones que se eliminarán:');
    COLLECTIONS.forEach(col => console.log(`   - ${col}`));
    console.log('');

    // Obtener configuración de la base de datos
    const config = getDatabaseConfig();
    const uri = config.uri as string;

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(uri);

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

    // Eliminar cada colección
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
    console.log('💾 La base de datos está ahora vacía.');

  } catch (error: any) {
    console.error('❌ Error al vaciar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada.');
    process.exit(0);
  }
}

// Ejecutar
clearDatabase();

