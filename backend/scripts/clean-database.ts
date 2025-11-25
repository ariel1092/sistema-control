import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Importar todos los schemas
import { VentaMongo } from '../src/infrastructure/persistence/mongodb/schemas/venta.schema';
import { DetalleVentaMongo } from '../src/infrastructure/persistence/mongodb/schemas/detalle-venta.schema';
import { ProductoMongo } from '../src/infrastructure/persistence/mongodb/schemas/producto.schema';
import { CierreCajaMongo } from '../src/infrastructure/persistence/mongodb/schemas/cierre-caja.schema';
import { ClienteMongo } from '../src/infrastructure/persistence/mongodb/schemas/cliente.schema';
import { EmpleadoMongo } from '../src/infrastructure/persistence/mongodb/schemas/empleado.schema';
import { GastoDiarioMongo } from '../src/infrastructure/persistence/mongodb/schemas/gasto-diario.schema';
import { RetiroSocioMongo } from '../src/infrastructure/persistence/mongodb/schemas/retiro-socio.schema';
import { ProveedorMongo } from '../src/infrastructure/persistence/mongodb/schemas/proveedor.schema';
import { OrdenCompraMongo } from '../src/infrastructure/persistence/mongodb/schemas/orden-compra.schema';
import { RemitoProveedorMongo } from '../src/infrastructure/persistence/mongodb/schemas/remito-proveedor.schema';
import { FacturaProveedorMongo } from '../src/infrastructure/persistence/mongodb/schemas/factura-proveedor.schema';
import { MovimientoCuentaCorrienteMongo } from '../src/infrastructure/persistence/mongodb/schemas/movimiento-cuenta-corriente.schema';

async function cleanDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // Obtener modelos
    const ventaModel = app.get<Model<any>>(getModelToken(VentaMongo.name));
    const detalleVentaModel = app.get<Model<any>>(getModelToken(DetalleVentaMongo.name));
    const productoModel = app.get<Model<any>>(getModelToken(ProductoMongo.name));
    const cierreCajaModel = app.get<Model<any>>(getModelToken(CierreCajaMongo.name));
    const clienteModel = app.get<Model<any>>(getModelToken(ClienteMongo.name));
    const empleadoModel = app.get<Model<any>>(getModelToken(EmpleadoMongo.name));
    const gastoDiarioModel = app.get<Model<any>>(getModelToken(GastoDiarioMongo.name));
    const retiroSocioModel = app.get<Model<any>>(getModelToken(RetiroSocioMongo.name));
    const proveedorModel = app.get<Model<any>>(getModelToken(ProveedorMongo.name));
    const ordenCompraModel = app.get<Model<any>>(getModelToken(OrdenCompraMongo.name));
    const remitoProveedorModel = app.get<Model<any>>(getModelToken(RemitoProveedorMongo.name));
    const facturaProveedorModel = app.get<Model<any>>(getModelToken(FacturaProveedorMongo.name));
    const movimientoCCModel = app.get<Model<any>>(getModelToken(MovimientoCuentaCorrienteMongo.name));

    // Limpiar colecciones
    console.log('🗑️  Eliminando datos...\n');

    const ventasCount = await ventaModel.countDocuments();
    await ventaModel.deleteMany({});
    console.log(`   ✅ Ventas: ${ventasCount} eliminadas`);

    const detallesCount = await detalleVentaModel.countDocuments();
    await detalleVentaModel.deleteMany({});
    console.log(`   ✅ Detalles de venta: ${detallesCount} eliminados`);

    const productosCount = await productoModel.countDocuments();
    await productoModel.deleteMany({});
    console.log(`   ✅ Productos: ${productosCount} eliminados`);

    const cierresCount = await cierreCajaModel.countDocuments();
    await cierreCajaModel.deleteMany({});
    console.log(`   ✅ Cierres de caja: ${cierresCount} eliminados`);

    const clientesCount = await clienteModel.countDocuments();
    await clienteModel.deleteMany({});
    console.log(`   ✅ Clientes: ${clientesCount} eliminados`);

    const empleadosCount = await empleadoModel.countDocuments();
    await empleadoModel.deleteMany({});
    console.log(`   ✅ Empleados: ${empleadosCount} eliminados`);

    const gastosCount = await gastoDiarioModel.countDocuments();
    await gastoDiarioModel.deleteMany({});
    console.log(`   ✅ Gastos diarios: ${gastosCount} eliminados`);

    const retirosCount = await retiroSocioModel.countDocuments();
    await retiroSocioModel.deleteMany({});
    console.log(`   ✅ Retiros de socios: ${retirosCount} eliminados`);

    const proveedoresCount = await proveedorModel.countDocuments();
    await proveedorModel.deleteMany({});
    console.log(`   ✅ Proveedores: ${proveedoresCount} eliminados`);

    const ordenesCount = await ordenCompraModel.countDocuments();
    await ordenCompraModel.deleteMany({});
    console.log(`   ✅ Órdenes de compra: ${ordenesCount} eliminadas`);

    const remitosCount = await remitoProveedorModel.countDocuments();
    await remitoProveedorModel.deleteMany({});
    console.log(`   ✅ Remitos proveedor: ${remitosCount} eliminados`);

    const facturasCount = await facturaProveedorModel.countDocuments();
    await facturaProveedorModel.deleteMany({});
    console.log(`   ✅ Facturas proveedor: ${facturasCount} eliminadas`);

    const movimientosCount = await movimientoCCModel.countDocuments();
    await movimientoCCModel.deleteMany({});
    console.log(`   ✅ Movimientos cuenta corriente: ${movimientosCount} eliminados`);

    console.log('\n✅ Base de datos limpiada exitosamente!');
    console.log('📊 La base de datos ahora está vacía.');

  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  } finally {
    await app.close();
  }
}

cleanDatabase().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});


