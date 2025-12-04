import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GetResumenDiaUseCase } from '../../application/use-cases/caja/get-resumen-dia.use-case';
import { AbrirCajaUseCase } from '../../application/use-cases/caja/abrir-caja.use-case';
import { CerrarCajaUseCase } from '../../application/use-cases/caja/cerrar-caja.use-case';
import { GetHistorialCajaUseCase } from '../../application/use-cases/caja/get-historial-caja.use-case';
import { CrearMovimientoCajaUseCase } from '../../application/use-cases/caja/crear-movimiento-caja.use-case';
import { AbrirCajaDto } from '../../application/dtos/caja/abrir-caja.dto';
import { CerrarCajaDto } from '../../application/dtos/caja/cerrar-caja.dto';
import { CrearMovimientoCajaDto } from '../../application/dtos/caja/movimiento-caja.dto';

@ApiTags('Caja')
@Controller('caja')
export class CajaController {
  constructor(
    private readonly getResumenDiaUseCase: GetResumenDiaUseCase,
    private readonly abrirCajaUseCase: AbrirCajaUseCase,
    private readonly cerrarCajaUseCase: CerrarCajaUseCase,
    private readonly getHistorialCajaUseCase: GetHistorialCajaUseCase,
    private readonly crearMovimientoCajaUseCase: CrearMovimientoCajaUseCase,
  ) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen del día' })
  getResumen(@Query('fecha') fecha?: string) {
    const fechaDate = fecha ? new Date(fecha) : new Date();
    return this.getResumenDiaUseCase.execute(fechaDate);
  }

  @Post('abrir')
  @ApiOperation({ summary: 'Abrir caja' })
  async abrirCaja(@Body() dto: AbrirCajaDto, @Query('usuarioId') usuarioId?: string) {
    if (!usuarioId) {
      throw new BadRequestException('El usuarioId es obligatorio');
    }
    return this.abrirCajaUseCase.execute(dto, usuarioId);
  }

  @Post('cerrar')
  @ApiOperation({ summary: 'Cerrar caja' })
  async cerrarCaja(@Body() dto: CerrarCajaDto, @Query('usuarioId') usuarioId?: string) {
    if (!usuarioId) {
      throw new BadRequestException('El usuarioId es obligatorio');
    }
    return this.cerrarCajaUseCase.execute(dto, usuarioId);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Crear movimiento manual de caja' })
  async crearMovimiento(@Body() dto: CrearMovimientoCajaDto, @Query('usuarioId') usuarioId?: string) {
    if (!usuarioId) {
      throw new BadRequestException('El usuarioId es obligatorio');
    }
    return this.crearMovimientoCajaUseCase.execute(dto, usuarioId);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Obtener historial de caja' })
  getHistorial(@Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    return this.getHistorialCajaUseCase.execute(inicio, fin);
  }
}
