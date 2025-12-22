import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObtenerSiguienteNumeroFiscalUseCase } from '../../application/use-cases/comprobantes-fiscales/obtener-siguiente-numero-fiscal.use-case';
import { NumeradorFiscalMongo, NumeradorFiscalSchema } from '../../infrastructure/persistence/mongodb/schemas/numerador-fiscal.schema';
import { NumeradorFiscalRepository } from '../../infrastructure/persistence/mongodb/repositories/numerador-fiscal.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NumeradorFiscalMongo.name, schema: NumeradorFiscalSchema },
    ]),
  ],
  providers: [
    {
      provide: 'INumeradorFiscalRepository',
      useClass: NumeradorFiscalRepository,
    },
    ObtenerSiguienteNumeroFiscalUseCase,
  ],
  exports: [ObtenerSiguienteNumeroFiscalUseCase],
})
export class NumeracionFiscalModule {}





