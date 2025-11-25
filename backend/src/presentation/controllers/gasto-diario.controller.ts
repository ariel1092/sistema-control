import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateGastoDiarioUseCase } from '../../application/use-cases/gasto-diario/create-gasto-diario.use-case';
import { GetGastosDiariosUseCase } from '../../application/use-cases/gasto-diario/get-gastos-diarios.use-case';
import { GetResumenGastosUseCase } from '../../application/use-cases/gasto-diario/get-resumen-gastos.use-case';
import { CreateGastoDiarioDto } from '../../application/dtos/gasto-diario/create-gasto-diario.dto';
import { GastoDiarioResponseDto } from '../../application/dtos/gasto-diario/gasto-diario-response.dto';
import { GastoDiarioMapper } from '../../presentation/mappers/gasto-diario.mapper';

@ApiTags('Gastos Diarios')
@Controller('gastos-diarios')
export class GastoDiarioController {
  constructor(
    private readonly createGastoDiarioUseCase: CreateGastoDiarioUseCase,
    private readonly getGastosDiariosUseCase: GetGastosDiariosUseCase,
    private readonly getResumenGastosUseCase: GetResumenGastosUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo gasto diario' })
  @ApiResponse({ status: 201, description: 'Gasto creado exitosamente', type: GastoDiarioResponseDto })
  async crear(@Body() dto: CreateGastoDiarioDto): Promise<GastoDiarioResponseDto> {
    const gasto = await this.createGastoDiarioUseCase.execute(dto);
    return GastoDiarioMapper.toResponseDto(gasto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos diarios' })
  @ApiResponse({ status: 200, description: 'Lista de gastos', type: [GastoDiarioResponseDto] })
  async obtenerTodos(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('categoria') categoria?: string,
  ): Promise<GastoDiarioResponseDto[]> {
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    const gastos = await this.getGastosDiariosUseCase.execute(fechaInicioDate, fechaFinDate, categoria);
    return gastos.map((gasto) => GastoDiarioMapper.toResponseDto(gasto));
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de gastos' })
  async obtenerResumen(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    return await this.getResumenGastosUseCase.execute(fechaInicioDate, fechaFinDate);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un gasto diario' })
  async eliminar(@Param('id') id: string): Promise<void> {
    // TODO: Implementar use case para eliminar
    throw new Error('Not implemented');
  }
}

