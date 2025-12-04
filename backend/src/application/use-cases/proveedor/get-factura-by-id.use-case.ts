import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { IMovimientoCuentaCorrienteRepository } from '../../ports/movimiento-cuenta-corriente.repository.interface';
import { FacturaProveedor } from '../../../domain/entities/factura-proveedor.entity';
import { DetalleFacturaProveedor } from '../../../domain/entities/detalle-factura-proveedor.entity';
import { differenceInDays } from 'date-fns';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';

export interface DetalleFacturaResponseDto {
  id: string;
  numero: string;
  fecha: Date;
  fechaVencimiento: Date;
  total: number; // Total neto (con descuentos)
  totalBruto: number; // Total bruto (sin descuentos)
  descuentoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  pagada: boolean;
  diasHastaVencimiento: number;
  estaVencida: boolean;
  estaPorVencer: boolean;
  observaciones?: string;
  detalles: Array<{
    id?: string;
    productoId?: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    iva: number;
    subtotalBruto: number;
    descuentoMonto: number;
    totalBrutoConIva: number;
  }>;
  historialPagos: Array<{
    id: string;
    fecha: Date;
    monto: number;
    tipo: string;
    descripcion: string;
    observaciones?: string;
    saldoAnterior: number;
    saldoDespues: number;
  }>;
}

@Injectable()
export class GetFacturaByIdUseCase {
  constructor(
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
    @Inject('IMovimientoCuentaCorrienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteRepository,
  ) {}

  async execute(facturaId: string): Promise<DetalleFacturaResponseDto> {
    const factura = await this.facturaRepository.findById(facturaId);

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${facturaId} no encontrada`);
    }

    const hoy = new Date();
    const diasHastaVencimiento = differenceInDays(factura.fechaVencimiento, hoy);

    // Obtener historial de pagos de esta factura
    console.log(`[GetFacturaByIdUseCase] Obteniendo historial de pagos para factura: ${factura.id}`);
    const movimientos = await this.movimientoRepository.findByDocumentoId(factura.id!);
    console.log(`[GetFacturaByIdUseCase] Movimientos encontrados: ${movimientos.length}`);
    
    const pagos = movimientos
      .filter(m => {
        const esPago = m.tipo === TipoMovimientoCC.PAGO_COMPLETO || m.tipo === TipoMovimientoCC.PAGO_PARCIAL;
        console.log(`[GetFacturaByIdUseCase] Movimiento tipo: ${m.tipo}, es pago: ${esPago}`);
        return esPago;
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(movimiento => ({
        id: movimiento.id!,
        fecha: movimiento.fecha,
        monto: movimiento.monto,
        tipo: movimiento.tipo,
        descripcion: movimiento.descripcion,
        observaciones: movimiento.observaciones,
        saldoAnterior: movimiento.saldoAnterior,
        saldoDespues: movimiento.saldoActual,
      }));
    
    console.log(`[GetFacturaByIdUseCase] Pagos procesados: ${pagos.length}`);

    return {
      id: factura.id!,
      numero: factura.numero,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      total: factura.calcularTotal(),
      totalBruto: factura.calcularSubtotalBruto(), // Suma de subtotales brutos de detalles
      descuentoTotal: factura.calcularDescuentoTotal(),
      montoPagado: factura.montoPagado,
      saldoPendiente: factura.calcularSaldoPendiente(),
      pagada: factura.pagada,
      diasHastaVencimiento,
      estaVencida: factura.estaVencida(),
      estaPorVencer: factura.estaPorVencer(5),
      observaciones: factura.observaciones,
      detalles: factura.detalles.map((detalle: DetalleFacturaProveedor) => ({
        id: detalle.id,
        productoId: detalle.productoId,
        codigoProducto: detalle.codigoProducto,
        nombreProducto: detalle.nombreProducto,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        descuento: detalle.descuento,
        iva: detalle.iva,
        subtotalBruto: detalle.calcularSubtotalBruto(),
        descuentoMonto: detalle.calcularDescuentoMonto(),
        totalBrutoConIva: detalle.calcularTotalBrutoConIva(),
      })),
      historialPagos: pagos,
    };
  }
}

