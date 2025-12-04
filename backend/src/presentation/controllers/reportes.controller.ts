import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GetReporteFinancieroUseCase } from '../../application/use-cases/reportes/get-reporte-financiero.use-case';
import { GetReporteSociosUseCase } from '../../application/use-cases/reportes/get-reporte-socios.use-case';
import { GetReporteGastosAvanzadoUseCase } from '../../application/use-cases/reportes/get-reporte-gastos-avanzado.use-case';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly getReporteFinancieroUseCase: GetReporteFinancieroUseCase,
    private readonly getReporteSociosUseCase: GetReporteSociosUseCase,
    private readonly getReporteGastosAvanzadoUseCase: GetReporteGastosAvanzadoUseCase,
  ) {}

  @Get('financiero')
  @ApiOperation({ summary: 'Obtener reporte financiero' })
  getFinanciero(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteFinancieroUseCase.execute(inicio, fin);
  }

  @Get('socios')
  @ApiOperation({ summary: 'Obtener reporte de socios' })
  getSocios(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteSociosUseCase.execute(inicio, fin);
  }

  @Get('gastos-avanzado')
  @ApiOperation({ summary: 'Obtener reporte de gastos avanzado' })
  getGastosAvanzado(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteGastosAvanzadoUseCase.execute(inicio, fin);
  }
}
