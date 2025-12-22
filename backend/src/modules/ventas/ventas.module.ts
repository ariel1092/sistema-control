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
import { ProductosModule } from '../productos/productos.module';
import { MovimientoVentaMongo, MovimientoVentaSchema } from '../../infrastructure/persistence/mongodb/schemas/movimiento-venta.schema';
import { MovimientoVentaRepository } from '../../infrastructure/persistence/mongodb/repositories/movimiento-venta.repository';
import { RegistrarMovimientoVentaUseCase } from '../../application/use-cases/ventas/registrar-movimiento-venta.use-case';
import { RegistrarMovimientoCCVentaUseCase } from '../../application/use-cases/ventas/registrar-movimiento-cc-venta.use-case';
import { ClientesModule } from '../clientes/clientes.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { CancelarVentaUseCase } from '../../application/use-cases/ventas/cancelar-venta.use-case';
import { CajaModule } from '../caja/caja.module';
import { RegistrarMovimientosCajaVentaUseCase } from '../../application/use-cases/caja/registrar-movimientos-caja-venta.use-case';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VentaMongo.name, schema: VentaSchema },
      { name: DetalleVentaMongo.name, schema: DetalleVentaSchema },
      { name: MovimientoVentaMongo.name, schema: MovimientoVentaSchema },
    ]),
    ProductosModule,
    ClientesModule,
    AuditoriaModule,
    CajaModule,
    ConfiguracionModule,
  ],
  controllers: [VentasController],
  providers: [
    {
      provide: 'IVentaRepository',
      useClass: VentaRepository,
    },
    {
      provide: 'IMovimientoVentaRepository',
      useClass: MovimientoVentaRepository,
    },
    CreateVentaUseCase,
    GetVentasDiaUseCase,
    GetVentasRecientesUseCase,
    GetTransferenciasSocioUseCase,
    CancelarVentaUseCase,
    RegistrarMovimientoVentaUseCase,
    RegistrarMovimientoCCVentaUseCase,
    RegistrarMovimientosCajaVentaUseCase,
  ],
  exports: ['IVentaRepository', GetVentasDiaUseCase, GetVentasRecientesUseCase],
})
export class VentasModule { }
