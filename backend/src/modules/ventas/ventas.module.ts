import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VentasController } from '../../presentation/controllers/ventas.controller';
import { CreateVentaUseCase } from '../../application/use-cases/ventas/create-venta.use-case';
import { GetVentasDiaUseCase } from '../../application/use-cases/ventas/get-ventas-dia.use-case';
import { GetVentasRecientesUseCase } from '../../application/use-cases/ventas/get-ventas-recientes.use-case';
import { CancelVentaUseCase } from '../../application/use-cases/ventas/cancel-venta.use-case';
import { GetTransferenciasSocioUseCase } from '../../application/use-cases/ventas/get-transferencias-socio.use-case';
import { VentaRepository } from '../../infrastructure/persistence/mongodb/repositories/venta.repository';
import { ProductoRepository } from '../../infrastructure/persistence/mongodb/repositories/producto.repository';
import { VentaMongo, VentaSchema } from '../../infrastructure/persistence/mongodb/schemas/venta.schema';
import { DetalleVentaMongo, DetalleVentaSchema } from '../../infrastructure/persistence/mongodb/schemas/detalle-venta.schema';
import { ProductoMongo, ProductoSchema } from '../../infrastructure/persistence/mongodb/schemas/producto.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VentaMongo.name, schema: VentaSchema },
      { name: DetalleVentaMongo.name, schema: DetalleVentaSchema },
      { name: ProductoMongo.name, schema: ProductoSchema },
    ]),
  ],
  controllers: [VentasController],
  providers: [
    // Repositorios
    {
      provide: 'IVentaRepository',
      useClass: VentaRepository,
    },
    {
      provide: 'IProductoRepository',
      useClass: ProductoRepository,
    },
    // Casos de uso
    CreateVentaUseCase,
    GetVentasDiaUseCase,
    GetVentasRecientesUseCase,
    CancelVentaUseCase,
    GetTransferenciasSocioUseCase,
  ],
  exports: [
    CreateVentaUseCase,
    GetVentasDiaUseCase,
    'IVentaRepository',
  ],
})
export class VentasModule {}




