import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { Venta } from '../../../domain/entities/venta.entity';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { ResumenDiaDto } from '../../dtos/caja/resumen-dia.dto';

@Injectable()
export class GetVentasDiaUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
  ) {}

  async execute(fecha?: Date): Promise<ResumenDiaDto> {
    const fechaBusqueda = fecha || new Date();
    
    // Normalizar fecha al inicio del día en UTC para evitar problemas de zona horaria
    // IMPORTANTE: Usar métodos UTC para extraer año, mes y día
    const año = fechaBusqueda.getUTCFullYear();
    const mes = fechaBusqueda.getUTCMonth();
    const dia = fechaBusqueda.getUTCDate();
    
    // Crear fechas en UTC (00:00:00 y 23:59:59)
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999));

    const ventas = await this.ventaRepository.findByRangoFechas(
      fechaInicio,
      fechaFin,
    );

    // DEBUG: Log para verificar qué ventas se están consultando
    console.log(`[GetVentasDia] Fecha consultada: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);
    console.log(`[GetVentasDia] Total ventas encontradas: ${ventas.length}`);

    // Filtrar solo ventas completadas
    const ventasCompletadas = ventas.filter(
      (v) => v.estado === EstadoVenta.COMPLETADA,
    );

    console.log(`[GetVentasDia] Ventas completadas: ${ventasCompletadas.length}`);

    // Calcular totales por método de pago
    // Efectivo separado, resto junto (tarjetas + transferencias)
    let totalEfectivo = 0;
    let totalOtros = 0; // Tarjetas + Transferencias + Débito + Crédito
    let totalAbdul = 0; // Transferencias a cuenta Abdul
    let totalOsvaldo = 0; // Transferencias a cuenta Osvaldo

    ventasCompletadas.forEach((venta) => {
      venta.metodosPago.forEach((mp) => {
        switch (mp.tipo) {
          case TipoMetodoPago.EFECTIVO:
            totalEfectivo += mp.monto;
            break;
          case TipoMetodoPago.TARJETA:
          case TipoMetodoPago.DEBITO:
          case TipoMetodoPago.CREDITO:
            totalOtros += mp.monto;
            break;
          case TipoMetodoPago.TRANSFERENCIA:
            totalOtros += mp.monto;
            // Diferenciar por cuenta bancaria
            if (mp.cuentaBancaria === 'ABDUL') {
              totalAbdul += mp.monto;
            } else if (mp.cuentaBancaria === 'OSVALDO') {
              totalOsvaldo += mp.monto;
            }
            break;
        }
      });
    });

    // DEBUG: Log de totales calculados
    console.log(`[GetVentasDia] Total Efectivo: $${totalEfectivo.toFixed(2)}`);
    console.log(`[GetVentasDia] Total Otros: $${totalOtros.toFixed(2)}`);
    console.log(`[GetVentasDia] Total Abdul: $${totalAbdul.toFixed(2)}`);
    console.log(`[GetVentasDia] Total Osvaldo: $${totalOsvaldo.toFixed(2)}`);
    console.log(`[GetVentasDia] Total General: $${(totalEfectivo + totalOtros).toFixed(2)}`);

    return {
      fecha: fechaInicio,
      ventas: ventasCompletadas.map(this.mapVentaToResponse),
      cantidadVentas: ventasCompletadas.length,
      totalEfectivo,
      totalOtros, // Tarjetas + Transferencias + Débito + Crédito
      totalAbdul,
      totalOsvaldo,
      totalGeneral: totalEfectivo + totalOtros,
    };
  }

  private mapVentaToResponse(venta: Venta) {
    return {
      id: venta.id!,
      numero: venta.numero,
      vendedorId: venta.vendedorId,
      clienteNombre: venta.clienteNombre,
      clienteDNI: venta.clienteDNI,
      fecha: venta.fecha,
      detalles: venta.detalles.map((d) => ({
        id: d.id!,
        productoId: d.productoId,
        codigoProducto: d.codigoProducto,
        nombreProducto: d.nombreProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descuentoItem: d.descuentoItem,
        subtotal: d.calcularSubtotal(),
      })),
      subtotal: venta.calcularSubtotal(),
      descuentoGeneral: venta.descuentoGeneral,
      descuento: venta.calcularDescuento(),
      total: venta.calcularTotal(),
      metodosPago: venta.metodosPago.map((mp) => mp.toPlainObject()),
      estado: venta.estado,
      observaciones: venta.observaciones,
      canceladoPor: venta.canceladoPor,
      canceladoEn: venta.canceladoEn,
      createdAt: venta.createdAt,
      updatedAt: venta.updatedAt,
    };
  }
}

