import { Module } from '@nestjs/common';
import { ReportesController } from '../../presentation/controllers/reportes.controller';
import { GetReporteFinancieroUseCase } from '../../application/use-cases/reportes/get-reporte-financiero.use-case';
import { GetReporteSociosUseCase } from '../../application/use-cases/reportes/get-reporte-socios.use-case';
import { GetReporteGastosAvanzadoUseCase } from '../../application/use-cases/reportes/get-reporte-gastos-avanzado.use-case';
import { VentasModule } from '../ventas/ventas.module';
import { GastosDiariosModule } from '../gastos-diarios/gastos-diarios.module';
import { RetirosSociosModule } from '../retiros-socios/retiros-socios.module';

@Module({
  imports: [VentasModule, GastosDiariosModule, RetirosSociosModule],
  controllers: [ReportesController],
  providers: [
    GetReporteFinancieroUseCase,
    GetReporteSociosUseCase,
    GetReporteGastosAvanzadoUseCase,
  ],
  exports: [
    GetReporteFinancieroUseCase,
    GetReporteSociosUseCase,
    GetReporteGastosAvanzadoUseCase,
  ],
})
export class ReportesModule {}









