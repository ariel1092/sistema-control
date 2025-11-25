import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateVentaUseCase } from '../../application/use-cases/ventas/create-venta.use-case';
import { GetVentasDiaUseCase } from '../../application/use-cases/ventas/get-ventas-dia.use-case';
import { GetVentasRecientesUseCase } from '../../application/use-cases/ventas/get-ventas-recientes.use-case';
import { CancelVentaUseCase } from '../../application/use-cases/ventas/cancel-venta.use-case';
import { GetTransferenciasSocioUseCase } from '../../application/use-cases/ventas/get-transferencias-socio.use-case';
import { CreateVentaDto } from '../../application/dtos/ventas/create-venta.dto';
import { VentaResponseDto } from '../../application/dtos/ventas/venta-response.dto';
import { ResumenDiaDto } from '../../application/dtos/caja/resumen-dia.dto';
// TODO: Importar guards cuando estén implementados
// import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';

@ApiTags('Ventas')
@Controller('ventas')
// @UseGuards(JwtAuthGuard) // TODO: Activar cuando auth esté implementado
// @ApiBearerAuth()
export class VentasController {
  constructor(
    private readonly createVentaUseCase: CreateVentaUseCase,
    private readonly getVentasDiaUseCase: GetVentasDiaUseCase,
    private readonly getVentasRecientesUseCase: GetVentasRecientesUseCase,
    private readonly cancelVentaUseCase: CancelVentaUseCase,
    private readonly getTransferenciasSocioUseCase: GetTransferenciasSocioUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva venta' })
  @ApiResponse({
    status: 201,
    description: 'Venta creada exitosamente',
    type: VentaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(
    @Body() createVentaDto: CreateVentaDto,
    // @CurrentUser() user: any, // TODO: Descomentar cuando auth esté implementado
  ): Promise<VentaResponseDto> {
    // Generar un ObjectId válido para el vendedor temporal del sistema
    // TODO: Reemplazar con usuario autenticado cuando auth esté implementado
    const { Types } = await import('mongoose');
    const vendedorId = new Types.ObjectId().toString();
    
    const venta = await this.createVentaUseCase.execute(
      createVentaDto,
      vendedorId,
    );

    return this.mapVentaToResponse(venta);
  }

  @Get('dia')
  @ApiOperation({ summary: 'Obtener ventas del día' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de ventas del día',
    type: ResumenDiaDto,
  })
  async getVentasDia(
    @Query('fecha') fecha?: string,
  ): Promise<ResumenDiaDto> {
    const fechaBusqueda = fecha ? new Date(fecha) : new Date();
    return this.getVentasDiaUseCase.execute(fechaBusqueda);
  }

  @Get('recientes')
  @ApiOperation({ summary: 'Obtener ventas recientes del día' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas recientes',
    type: [VentaResponseDto],
  })
  async getVentasRecientes(
    @Query('fecha') fecha?: string,
    @Query('tipoMetodoPago') tipoMetodoPago?: string,
  ): Promise<VentaResponseDto[]> {
    // Parsear fecha correctamente (formato YYYY-MM-DD) en UTC
    let fechaBusqueda: Date;
    if (fecha) {
      const [year, month, day] = fecha.split('-').map(Number);
      // Crear fecha en UTC para que coincida con cómo se guardan las ventas
      fechaBusqueda = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      fechaBusqueda = new Date();
    }
    
    const ventas = await this.getVentasRecientesUseCase.execute(
      fechaBusqueda,
      tipoMetodoPago as any,
    );
    return ventas.map((v) => this.mapVentaToResponse(v));
  }

  @Get('transferencias/:cuentaBancaria')
  @ApiOperation({ summary: 'Obtener transferencias de un socio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferencias del socio',
    type: [VentaResponseDto],
  })
  async getTransferenciasSocio(
    @Param('cuentaBancaria') cuentaBancaria: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<VentaResponseDto[]> {
    let fechaInicioDate: Date | undefined;
    let fechaFinDate: Date | undefined;

    if (fechaInicio) {
      const [year, month, day] = fechaInicio.split('-').map(Number);
      fechaInicioDate = new Date(year, month - 1, day);
    }

    if (fechaFin) {
      const [year, month, day] = fechaFin.split('-').map(Number);
      fechaFinDate = new Date(year, month - 1, day);
    }

    const ventas = await this.getTransferenciasSocioUseCase.execute(
      cuentaBancaria as any,
      fechaInicioDate,
      fechaFinDate,
    );
    return ventas.map((v) => this.mapVentaToResponse(v));
  }

  @Get('rango')
  @ApiOperation({ summary: 'Obtener ventas por rango de fechas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas en el rango especificado',
    type: [VentaResponseDto],
  })
  async getVentasRango(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ): Promise<VentaResponseDto[]> {
    // TODO: Implementar caso de uso GetVentasRangoUseCase
    throw new Error('Not implemented yet');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una venta' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la venta',
    type: VentaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async getById(@Param('id') id: string): Promise<VentaResponseDto> {
    // TODO: Implementar caso de uso GetVentaByIdUseCase
    throw new Error('Not implemented yet');
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una venta del día actual' })
  @ApiResponse({
    status: 200,
    description: 'Venta cancelada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'No se puede cancelar la venta' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async cancel(
    @Param('id') id: string,
    @Body('motivo') motivo?: string,
    // @CurrentUser() user: any, // TODO: Descomentar cuando auth esté implementado
  ): Promise<{ message: string }> {
    const usuarioId = 'usuario-temp-id'; // TODO: Obtener del usuario autenticado
    await this.cancelVentaUseCase.execute(id, usuarioId, motivo);

    return { message: 'Venta cancelada exitosamente' };
  }

  private mapVentaToResponse(venta: any): VentaResponseDto {
    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    return {
      id: venta.id || venta._id?.toString() || '',
      numero: venta.numero,
      vendedorId: venta.vendedorId,
      clienteNombre: venta.clienteNombre,
      clienteDNI: venta.clienteDNI,
      fecha: venta.fecha,
      detalles: (venta.detalles || []).map((d: any) => ({
        id: d.id || d._id?.toString() || '',
        productoId: d.productoId,
        codigoProducto: d.codigoProducto,
        nombreProducto: d.nombreProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descuentoItem: d.descuentoItem,
        subtotal: typeof d.calcularSubtotal === 'function' ? d.calcularSubtotal() : (d.precioUnitario * d.cantidad * (1 - (d.descuentoItem || 0) / 100)),
      })),
      subtotal: typeof venta.calcularSubtotal === 'function' ? venta.calcularSubtotal() : 0,
      descuentoGeneral: venta.descuentoGeneral || 0,
      descuento: typeof venta.calcularDescuento === 'function' ? venta.calcularDescuento() : 0,
      total: typeof venta.calcularTotal === 'function' ? venta.calcularTotal() : 0,
      metodosPago: (venta.metodosPago || []).map((mp: any) => 
        typeof mp.toPlainObject === 'function' ? mp.toPlainObject() : mp
      ),
      estado: venta.estado,
      observaciones: venta.observaciones,
      canceladoPor: venta.canceladoPor,
      canceladoEn: venta.canceladoEn,
      createdAt: venta.createdAt,
      updatedAt: venta.updatedAt,
    };
  }
}




