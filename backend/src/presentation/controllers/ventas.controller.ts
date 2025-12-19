import { Controller, Get, Post, Body, Param, Query, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateVentaUseCase } from '../../application/use-cases/ventas/create-venta.use-case';
import { GetVentasDiaUseCase } from '../../application/use-cases/ventas/get-ventas-dia.use-case';
import { GetVentasRecientesUseCase } from '../../application/use-cases/ventas/get-ventas-recientes.use-case';
import { GetTransferenciasSocioUseCase } from '../../application/use-cases/ventas/get-transferencias-socio.use-case';
import { CancelarVentaUseCase } from '../../application/use-cases/ventas/cancelar-venta.use-case';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(
    private readonly createVentaUseCase: CreateVentaUseCase,
    private readonly getVentasDiaUseCase: GetVentasDiaUseCase,
    private readonly getVentasRecientesUseCase: GetVentasRecientesUseCase,
    private readonly getTransferenciasSocioUseCase: GetTransferenciasSocioUseCase,
    private readonly cancelarVentaUseCase: CancelarVentaUseCase,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Obtener ventas recientes por fecha' })
  async findAll(@Query('fecha') fecha?: string) {
    if (fecha) {
      const fechaDate = new Date(fecha);
      const ventas = await this.getVentasRecientesUseCase.execute(fechaDate);
      // Mapear entidades a objetos planos para la respuesta
      return ventas.map(venta => ({
        id: venta.id,
        numero: venta.numero,
        fecha: venta.fecha,
        total: venta.calcularTotal(),
        metodosPago: venta.metodosPago.map(mp => ({
          tipo: mp.tipo,
          monto: mp.monto,
          cuentaBancaria: mp.cuentaBancaria,
          recargo: mp.recargo,
        })),
        createdAt: venta.createdAt,
        estado: venta.estado,
      }));
    }
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una venta por ID' })
  findOne(@Param('id') id: string) {
    // TODO: Implementar GetVentaByIdUseCase
    return null;
  }

  @Get('rango')
  @ApiOperation({ summary: 'Obtener ventas por rango de fechas' })
  findByRange(@Query('fechaInicio') fechaInicio: string, @Query('fechaFin') fechaFin: string) {
    // TODO: Implementar GetVentasRangoUseCase
    return [];
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva venta' })
  create(@Body() dto: any, @Query('vendedorId') vendedorId?: string) {
    // El vendedorId puede venir en el body o en el query parameter
    const vendedorIdFinal = dto.vendedorId || vendedorId;
    if (!vendedorIdFinal) {
      throw new BadRequestException('El vendedorId es obligatorio. Debe enviarse en el body o como query parameter.');
    }
    return this.createVentaUseCase.execute(dto, vendedorIdFinal);
  }

  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una venta' })
  cancel(@Param('id') id: string, @Body() body: { motivo: string }, @Query('user') user: string, @Req() req: Request) {
    if (!body.motivo) {
      throw new BadRequestException('El motivo de la cancelación es obligatorio');
    }
    return this.cancelarVentaUseCase.execute({
      ventaId: id,
      usuarioId: user,
      razon: body.motivo,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
