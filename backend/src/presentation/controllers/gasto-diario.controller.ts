import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateGastoDiarioUseCase } from '../../application/use-cases/gasto-diario/create-gasto-diario.use-case';
import { GetGastosDiariosUseCase } from '../../application/use-cases/gasto-diario/get-gastos-diarios.use-case';
import { GetResumenGastosUseCase } from '../../application/use-cases/gasto-diario/get-resumen-gastos.use-case';

@ApiTags('Gastos Diarios')
@Controller('gastos')
export class GastoDiarioController {
  constructor(
    private readonly createGastoDiarioUseCase: CreateGastoDiarioUseCase,
    private readonly getGastosDiariosUseCase: GetGastosDiariosUseCase,
    private readonly getResumenGastosUseCase: GetResumenGastosUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos' })
  findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.getGastosDiariosUseCase.execute(inicio, fin);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de gastos' })
  getResumen(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.getResumenGastosUseCase.execute(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo gasto' })
  create(@Body() dto: any) {
    return this.createGastoDiarioUseCase.execute(dto);
  }
}
