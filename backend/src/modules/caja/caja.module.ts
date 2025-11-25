import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CajaController } from '../../presentation/controllers/caja.controller';
import { GetResumenDiaUseCase } from '../../application/use-cases/caja/get-resumen-dia.use-case';
import { CajaRepository } from '../../infrastructure/persistence/mongodb/repositories/caja.repository';
import { CierreCajaMongo, CierreCajaSchema } from '../../infrastructure/persistence/mongodb/schemas/cierre-caja.schema';
import { VentasModule } from '../ventas/ventas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CierreCajaMongo.name, schema: CierreCajaSchema },
    ]),
    VentasModule, // Para usar GetVentasDiaUseCase
  ],
  controllers: [CajaController],
  providers: [
    // Repositorio
    {
      provide: 'ICajaRepository',
      useClass: CajaRepository,
    },
    // Casos de uso
    GetResumenDiaUseCase,
  ],
  exports: [
    GetResumenDiaUseCase,
    'ICajaRepository',
  ],
})
export class CajaModule {}





