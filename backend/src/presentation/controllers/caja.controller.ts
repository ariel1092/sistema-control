import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetResumenDiaUseCase } from '../../application/use-cases/caja/get-resumen-dia.use-case';
import { ResumenDiaDto } from '../../application/dtos/caja/resumen-dia.dto';
import { CierreCajaResponseDto, AbrirCajaDto, CerrarCajaDto } from '../../application/dtos/caja/cierre-caja.dto';
// TODO: Importar guards cuando estén implementados
// import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';

@ApiTags('Caja')
@Controller('caja')
// @UseGuards(JwtAuthGuard) // TODO: Activar cuando auth esté implementado
// @ApiBearerAuth()
export class CajaController {
  constructor(
    private readonly getResumenDiaUseCase: GetResumenDiaUseCase,
  ) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen diario de caja' })
  @ApiResponse({
    status: 200,
    description: 'Resumen del día',
    type: CierreCajaResponseDto,
  })
  async getResumen(
    @Query('fecha') fecha?: string,
  ): Promise<CierreCajaResponseDto> {
    // Parsear fecha correctamente (formato YYYY-MM-DD)
    // Usar UTC para evitar problemas de zona horaria
    let fechaBusqueda: Date;
    if (fecha) {
      const [year, month, day] = fecha.split('-').map(Number);
      // Crear fecha en UTC para que coincida con cómo se guardan las ventas
      fechaBusqueda = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      fechaBusqueda = new Date();
    }
    return this.getResumenDiaUseCase.execute(fechaBusqueda);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Obtener historial de cierres de caja' })
  @ApiResponse({
    status: 200,
    description: 'Historial de cierres',
    type: [CierreCajaResponseDto],
  })
  async getHistorial(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ): Promise<CierreCajaResponseDto[]> {
    // TODO: Implementar caso de uso GetHistorialCajaUseCase
    throw new Error('Not implemented yet');
  }

  @Post('abrir')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir caja del día' })
  @ApiResponse({
    status: 201,
    description: 'Caja abierta exitosamente',
    type: CierreCajaResponseDto,
  })
  async abrir(
    @Body() abrirCajaDto: AbrirCajaDto,
    // @CurrentUser() user: any, // TODO: Descomentar cuando auth esté implementado
  ): Promise<CierreCajaResponseDto> {
    const usuarioId = 'usuario-temp-id'; // TODO: Obtener del usuario autenticado
    // TODO: Implementar caso de uso AbrirCajaUseCase
    throw new Error('Not implemented yet');
  }

  @Post('cerrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar caja del día' })
  @ApiResponse({
    status: 200,
    description: 'Caja cerrada exitosamente',
    type: CierreCajaResponseDto,
  })
  async cerrar(
    @Body() cerrarCajaDto: CerrarCajaDto,
    // @CurrentUser() user: any, // TODO: Descomentar cuando auth esté implementado
  ): Promise<CierreCajaResponseDto> {
    const usuarioId = 'usuario-temp-id'; // TODO: Obtener del usuario autenticado
    // TODO: Implementar caso de uso CerrarCajaUseCase
    throw new Error('Not implemented yet');
  }
}




