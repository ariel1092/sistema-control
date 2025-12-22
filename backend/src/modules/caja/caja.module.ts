import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CajaController } from '../../presentation/controllers/caja.controller';
import { CajaRepository } from '../../infrastructure/persistence/mongodb/repositories/caja.repository';
import { MovimientoCajaRepository } from '../../infrastructure/persistence/mongodb/repositories/movimiento-caja.repository';
import { CierreCajaMongo, CierreCajaSchema } from '../../infrastructure/persistence/mongodb/schemas/cierre-caja.schema';
import { MovimientoCajaMongo, MovimientoCajaSchema } from '../../infrastructure/persistence/mongodb/schemas/movimiento-caja.schema';
import { GetResumenDiaUseCase } from '../../application/use-cases/caja/get-resumen-dia.use-case';
import { AbrirCajaUseCase } from '../../application/use-cases/caja/abrir-caja.use-case';
import { CerrarCajaUseCase } from '../../application/use-cases/caja/cerrar-caja.use-case';
import { GetHistorialCajaUseCase } from '../../application/use-cases/caja/get-historial-caja.use-case';
import { CrearMovimientoCajaUseCase } from '../../application/use-cases/caja/crear-movimiento-caja.use-case';
import { RegistrarMovimientosCajaVentaUseCase } from '../../application/use-cases/caja/registrar-movimientos-caja-venta.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CierreCajaMongo.name, schema: CierreCajaSchema },
      { name: MovimientoCajaMongo.name, schema: MovimientoCajaSchema },
    ]),
  ],
  controllers: [CajaController],
  providers: [
    {
      provide: 'ICajaRepository',
      useClass: CajaRepository,
    },
    {
      provide: 'IMovimientoCajaRepository',
      useClass: MovimientoCajaRepository,
    },
    GetResumenDiaUseCase,
    AbrirCajaUseCase,
    CerrarCajaUseCase,
    GetHistorialCajaUseCase,
    CrearMovimientoCajaUseCase,
    RegistrarMovimientosCajaVentaUseCase,
  ],
  exports: ['ICajaRepository', 'IMovimientoCajaRepository', GetResumenDiaUseCase, RegistrarMovimientosCajaVentaUseCase],
})
export class CajaModule {}
