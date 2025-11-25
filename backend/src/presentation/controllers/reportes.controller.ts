import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetReporteFinancieroUseCase } from '../../application/use-cases/reportes/get-reporte-financiero.use-case';
import { GetReporteSociosUseCase } from '../../application/use-cases/reportes/get-reporte-socios.use-case';
import { GetReporteGastosAvanzadoUseCase } from '../../application/use-cases/reportes/get-reporte-gastos-avanzado.use-case';
import { ReporteFinancieroDto } from '../../application/dtos/reportes/reporte-financiero.dto';
import { ReporteSociosDto } from '../../application/dtos/reportes/reporte-socios.dto';
import { ReporteGastosAvanzadoDto } from '../../application/dtos/reportes/reporte-gastos-avanzado.dto';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly getReporteFinancieroUseCase: GetReporteFinancieroUseCase,
    private readonly getReporteSociosUseCase: GetReporteSociosUseCase,
    private readonly getReporteGastosAvanzadoUseCase: GetReporteGastosAvanzadoUseCase,
  ) {}

  @Get('financiero')
  @ApiOperation({ summary: 'Obtener reporte financiero consolidado' })
  @ApiResponse({ status: 200, description: 'Reporte financiero', type: ReporteFinancieroDto })
  async getReporteFinanciero(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<ReporteFinancieroDto> {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteFinancieroUseCase.execute(fechaInicioDate, fechaFinDate);
  }

  @Get('socios')
  @ApiOperation({ summary: 'Obtener reporte de balance de socios' })
  @ApiResponse({ status: 200, description: 'Reporte de socios', type: ReporteSociosDto })
  async getReporteSocios(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<ReporteSociosDto> {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteSociosUseCase.execute(fechaInicioDate, fechaFinDate);
  }

  @Get('gastos-avanzado')
  @ApiOperation({ summary: 'Obtener reporte avanzado de gastos' })
  @ApiResponse({ status: 200, description: 'Reporte de gastos avanzado', type: ReporteGastosAvanzadoDto })
  async getReporteGastosAvanzado(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<ReporteGastosAvanzadoDto> {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    return this.getReporteGastosAvanzadoUseCase.execute(fechaInicioDate, fechaFinDate);
  }
}


