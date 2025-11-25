import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRetiroSocioUseCase } from '../../application/use-cases/retiro-socio/create-retiro-socio.use-case';
import { GetRetirosSocioUseCase } from '../../application/use-cases/retiro-socio/get-retiros-socio.use-case';
import { CreateRetiroSocioDto } from '../../application/dtos/retiro-socio/create-retiro-socio.dto';
import { RetiroSocioResponseDto } from '../../application/dtos/retiro-socio/retiro-socio-response.dto';
import { RetiroSocioMapper } from '../mappers/retiro-socio.mapper';
import { CuentaBancaria } from '../../domain/enums/cuenta-bancaria.enum';

@ApiTags('Retiros Socios')
@Controller('retiros-socios')
export class RetiroSocioController {
  constructor(
    private readonly createRetiroSocioUseCase: CreateRetiroSocioUseCase,
    private readonly getRetirosSocioUseCase: GetRetirosSocioUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo retiro de socio' })
  @ApiResponse({ status: 201, description: 'Retiro registrado exitosamente', type: RetiroSocioResponseDto })
  async crear(@Body() dto: CreateRetiroSocioDto): Promise<RetiroSocioResponseDto> {
    const retiro = await this.createRetiroSocioUseCase.execute(dto);
    return RetiroSocioMapper.toResponseDto(retiro);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los retiros de socios' })
  @ApiResponse({ status: 200, description: 'Lista de retiros', type: [RetiroSocioResponseDto] })
  async obtenerTodos(
    @Query('cuentaBancaria') cuentaBancaria?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<RetiroSocioResponseDto[]> {
    const cuentaBancariaEnum = cuentaBancaria ? (cuentaBancaria as CuentaBancaria) : undefined;
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : undefined;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : undefined;
    
    const retiros = await this.getRetirosSocioUseCase.execute(cuentaBancariaEnum, fechaInicioDate, fechaFinDate);
    return retiros.map((retiro) => RetiroSocioMapper.toResponseDto(retiro));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un retiro de socio' })
  async eliminar(@Param('id') id: string): Promise<void> {
    // TODO: Implementar use case para eliminar
    throw new Error('Not implemented');
  }
}


