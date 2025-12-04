import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VentasController } from '../../presentation/controllers/ventas.controller';
import { VentaRepository } from '../../infrastructure/persistence/mongodb/repositories/venta.repository';
import { VentaMongo, VentaSchema } from '../../infrastructure/persistence/mongodb/schemas/venta.schema';
import { DetalleVentaMongo, DetalleVentaSchema } from '../../infrastructure/persistence/mongodb/schemas/detalle-venta.schema';
import { CreateVentaUseCase } from '../../application/use-cases/ventas/create-venta.use-case';
import { GetVentasDiaUseCase } from '../../application/use-cases/ventas/get-ventas-dia.use-case';
import { GetVentasRecientesUseCase } from '../../application/use-cases/ventas/get-ventas-recientes.use-case';
import { GetTransferenciasSocioUseCase } from '../../application/use-cases/ventas/get-transferencias-socio.use-case';
import { CancelVentaUseCase } from '../../application/use-cases/ventas/cancel-venta.use-case';
import { ProductosModule } from '../productos/productos.module';
// import { GetVentaByIdUseCase } from '../../application/use-cases/ventas/get-venta-by-id.use-case';
// import { GetVentasRangoUseCase } from '../../application/use-cases/ventas/get-ventas-rango.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VentaMongo.name, schema: VentaSchema },
      { name: DetalleVentaMongo.name, schema: DetalleVentaSchema },
    ]),
    ProductosModule,
  ],
  controllers: [VentasController],
  providers: [
    {
      provide: 'IVentaRepository',
      useClass: VentaRepository,
    },
    CreateVentaUseCase,
    GetVentasDiaUseCase,
    GetVentasRecientesUseCase,
    GetTransferenciasSocioUseCase,
    CancelVentaUseCase,
    // GetVentaByIdUseCase,
    // GetVentasRangoUseCase,
  ],
  exports: ['IVentaRepository', GetVentasDiaUseCase, GetVentasRecientesUseCase],
})
export class VentasModule {}
