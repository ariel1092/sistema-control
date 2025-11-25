import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { ProductosModule } from '../productos/productos.module';
import { ProveedorController } from '../../presentation/controllers/proveedor.controller';
import { ProveedorRepository } from '../../infrastructure/persistence/mongodb/repositories/proveedor.repository';
import { OrdenCompraRepository } from '../../infrastructure/persistence/mongodb/repositories/orden-compra.repository';
import { RemitoProveedorRepository } from '../../infrastructure/persistence/mongodb/repositories/remito-proveedor.repository';
import { FacturaProveedorRepository } from '../../infrastructure/persistence/mongodb/repositories/factura-proveedor.repository';
import { MovimientoCuentaCorrienteRepository } from '../../infrastructure/persistence/mongodb/repositories/movimiento-cuenta-corriente.repository';
import { CreateProveedorUseCase } from '../../application/use-cases/proveedor/create-proveedor.use-case';
import { GetProveedoresUseCase } from '../../application/use-cases/proveedor/get-proveedores.use-case';
import { GetProveedorUseCase } from '../../application/use-cases/proveedor/get-proveedor.use-case';
import { UpdateProveedorUseCase } from '../../application/use-cases/proveedor/update-proveedor.use-case';
import { DeleteProveedorUseCase } from '../../application/use-cases/proveedor/delete-proveedor.use-case';
import { GetCuentaCorrienteProveedorUseCase } from '../../application/use-cases/proveedor/get-cuenta-corriente-proveedor.use-case';
import { CreateOrdenCompraUseCase } from '../../application/use-cases/proveedor/create-orden-compra.use-case';
import { CreateFacturaProveedorUseCase } from '../../application/use-cases/proveedor/create-factura-proveedor.use-case';
import { RegistrarPagoProveedorUseCase } from '../../application/use-cases/proveedor/registrar-pago-proveedor.use-case';
import { ProveedorMongo, ProveedorSchema } from '../../infrastructure/persistence/mongodb/schemas/proveedor.schema';
import { OrdenCompraMongo, OrdenCompraSchema } from '../../infrastructure/persistence/mongodb/schemas/orden-compra.schema';
import { DetalleOrdenCompraMongo, DetalleOrdenCompraSchema } from '../../infrastructure/persistence/mongodb/schemas/detalle-orden-compra.schema';
import { RemitoProveedorMongo, RemitoProveedorSchema } from '../../infrastructure/persistence/mongodb/schemas/remito-proveedor.schema';
import { DetalleRemitoMongo, DetalleRemitoSchema } from '../../infrastructure/persistence/mongodb/schemas/detalle-remito.schema';
import { FacturaProveedorMongo, FacturaProveedorSchema } from '../../infrastructure/persistence/mongodb/schemas/factura-proveedor.schema';
import { DetalleFacturaProveedorMongo, DetalleFacturaProveedorSchema } from '../../infrastructure/persistence/mongodb/schemas/detalle-factura-proveedor.schema';
import { MovimientoCuentaCorrienteMongo, MovimientoCuentaCorrienteSchema } from '../../infrastructure/persistence/mongodb/schemas/movimiento-cuenta-corriente.schema';

@Module({
  imports: [
    DatabaseModule,
    ProductosModule,
    MongooseModule.forFeature([
      { name: ProveedorMongo.name, schema: ProveedorSchema },
      { name: OrdenCompraMongo.name, schema: OrdenCompraSchema },
      { name: DetalleOrdenCompraMongo.name, schema: DetalleOrdenCompraSchema },
      { name: RemitoProveedorMongo.name, schema: RemitoProveedorSchema },
      { name: DetalleRemitoMongo.name, schema: DetalleRemitoSchema },
      { name: FacturaProveedorMongo.name, schema: FacturaProveedorSchema },
      { name: DetalleFacturaProveedorMongo.name, schema: DetalleFacturaProveedorSchema },
      { name: MovimientoCuentaCorrienteMongo.name, schema: MovimientoCuentaCorrienteSchema },
    ]),
  ],
  controllers: [ProveedorController],
  providers: [
    {
      provide: 'IProveedorRepository',
      useClass: ProveedorRepository,
    },
    {
      provide: 'IOrdenCompraRepository',
      useClass: OrdenCompraRepository,
    },
    {
      provide: 'IRemitoProveedorRepository',
      useClass: RemitoProveedorRepository,
    },
    {
      provide: 'IFacturaProveedorRepository',
      useClass: FacturaProveedorRepository,
    },
    {
      provide: 'IMovimientoCuentaCorrienteRepository',
      useClass: MovimientoCuentaCorrienteRepository,
    },
    CreateProveedorUseCase,
    GetProveedoresUseCase,
    GetProveedorUseCase,
    UpdateProveedorUseCase,
    DeleteProveedorUseCase,
    GetCuentaCorrienteProveedorUseCase,
    CreateOrdenCompraUseCase,
    CreateFacturaProveedorUseCase,
    RegistrarPagoProveedorUseCase,
  ],
  exports: [
    'IProveedorRepository',
    'IOrdenCompraRepository',
    'IRemitoProveedorRepository',
    'IFacturaProveedorRepository',
    'IMovimientoCuentaCorrienteRepository',
  ],
})
export class ProveedoresModule {}

