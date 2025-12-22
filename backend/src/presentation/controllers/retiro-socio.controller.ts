import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateRetiroSocioUseCase } from '../../application/use-cases/retiro-socio/create-retiro-socio.use-case';
import { GetRetirosSocioUseCase } from '../../application/use-cases/retiro-socio/get-retiros-socio.use-case';
import { parseLocalDateOnly } from '../../utils/date.utils';

@ApiTags('Retiros Socios')
@Controller('retiros')
export class RetiroSocioController {
  constructor(
    private readonly createRetiroSocioUseCase: CreateRetiroSocioUseCase,
    private readonly getRetirosSocioUseCase: GetRetirosSocioUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los retiros' })
  findAll(
    @Query('cuentaBancaria') cuentaBancaria?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const inicio = fechaInicio ? parseLocalDateOnly(fechaInicio) : undefined;
    const fin = fechaFin ? parseLocalDateOnly(fechaFin) : undefined;
    return this.getRetirosSocioUseCase.execute(cuentaBancaria as any, inicio, fin);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo retiro' })
  create(@Body() dto: any) {
    return this.createRetiroSocioUseCase.execute(dto);
  }
}
