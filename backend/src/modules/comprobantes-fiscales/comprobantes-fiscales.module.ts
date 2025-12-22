import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NumeracionFiscalModule } from '../numeracion-fiscal/numeracion-fiscal.module';
import { VentasModule } from '../ventas/ventas.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { EmitirComprobanteFiscalUseCase } from '../../application/use-cases/comprobantes-fiscales/emitir-comprobante-fiscal.use-case';
import { EmitirComprobantesPendientesUseCase } from '../../application/use-cases/comprobantes-fiscales/emitir-comprobantes-pendientes.use-case';
import { ComprobanteFiscalMongo, ComprobanteFiscalSchema } from '../../infrastructure/persistence/mongodb/schemas/comprobante-fiscal.schema';
import { ComprobanteFiscalRepository } from '../../infrastructure/persistence/mongodb/repositories/comprobante-fiscal.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ComprobanteFiscalMongo.name, schema: ComprobanteFiscalSchema },
    ]),
    // Reutiliza numeración fiscal (secuencial/transaccional)
    NumeracionFiscalModule,
    // Para validar existencia/estado de venta y mapear items (sin tocar Venta)
    VentasModule,
    AuditoriaModule,
  ],
  providers: [
    {
      provide: 'IComprobanteFiscalRepository',
      useClass: ComprobanteFiscalRepository,
    },
    EmitirComprobanteFiscalUseCase,
    EmitirComprobantesPendientesUseCase,
  ],
  exports: [EmitirComprobanteFiscalUseCase, EmitirComprobantesPendientesUseCase],
})
export class ComprobantesFiscalesModule {}


