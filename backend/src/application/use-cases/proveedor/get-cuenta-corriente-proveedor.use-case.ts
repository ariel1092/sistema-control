import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { IRemitoProveedorRepository } from '../../ports/remito-proveedor.repository.interface';
import { IMovimientoCuentaCorrienteRepository } from '../../ports/movimiento-cuenta-corriente.repository.interface';
import { IOrdenCompraRepository } from '../../ports/orden-compra.repository.interface';
import { differenceInDays } from 'date-fns';

export interface CuentaCorrienteProveedorDto {
  proveedorId: string;
  deudaTotal: number;
  facturasPendientes: Array<{
    id: string;
    numero: string;
    fecha: Date;
    fechaVencimiento: Date;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    diasHastaVencimiento: number;
    estaVencida: boolean;
    estaPorVencer: boolean;
  }>;
  remitosSinFacturar: Array<{
    id: string;
    numero: string;
    fecha: Date;
    total: number;
  }>;
  ordenesCompraPendientes: Array<{
    id: string;
    numero: string;
    fecha: Date;
    fechaEstimadaEntrega?: Date;
    total: number;
    estado: string;
  }>;
  movimientos: Array<{
    id: string;
    tipo: string;
    fecha: Date;
    monto: number;
    descripcion: string;
    saldoAnterior: number;
    saldoActual: number;
  }>;
}

@Injectable()
export class GetCuentaCorrienteProveedorUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
    @Inject('IRemitoProveedorRepository')
    private readonly remitoRepository: IRemitoProveedorRepository,
    @Inject('IMovimientoCuentaCorrienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteRepository,
    @Inject('IOrdenCompraRepository')
    private readonly ordenCompraRepository: IOrdenCompraRepository,
  ) {}

  async execute(proveedorId: string): Promise<CuentaCorrienteProveedorDto> {
    const proveedor = await this.proveedorRepository.findById(proveedorId);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    // Obtener deuda total
    const deudaTotal = await this.movimientoRepository.getDeudaTotal(proveedorId);

    // Obtener facturas pendientes
    const facturasPendientes = await this.facturaRepository.findPendientes(proveedorId);
    const facturasPendientesDto = facturasPendientes.map((factura) => {
      const hoy = new Date();
      const diasHastaVencimiento = differenceInDays(factura.fechaVencimiento, hoy);
      return {
        id: factura.id!,
        numero: factura.numero,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        total: factura.calcularTotal(),
        montoPagado: factura.montoPagado,
        saldoPendiente: factura.calcularSaldoPendiente(),
        diasHastaVencimiento,
        estaVencida: factura.estaVencida(),
        estaPorVencer: factura.estaPorVencer(5),
      };
    });

    // Obtener remitos sin facturar
    const remitosSinFacturar = await this.remitoRepository.findSinFacturar(proveedorId);
    const remitosSinFacturarDto = remitosSinFacturar.map((remito) => ({
      id: remito.id!,
      numero: remito.numero,
      fecha: remito.fecha,
      total: remito.calcularTotal(),
    }));

    // Obtener órdenes de compra pendientes
    const ordenesCompra = await this.ordenCompraRepository.findByProveedor(proveedorId);
    const ordenesPendientes = ordenesCompra.filter(
      (orden) => orden.estado !== 'COMPLETADO' && orden.estado !== 'CANCELADO',
    );
    const ordenesPendientesDto = ordenesPendientes.map((orden) => ({
      id: orden.id!,
      numero: orden.numero,
      fecha: orden.fecha,
      fechaEstimadaEntrega: orden.fechaEstimadaEntrega,
      total: orden.calcularTotal(),
      estado: orden.estado,
    }));

    // Obtener movimientos de cuenta corriente
    const movimientos = await this.movimientoRepository.findByProveedor(proveedorId);
    const movimientosDto = movimientos.map((mov) => ({
      id: mov.id!,
      tipo: mov.tipo,
      fecha: mov.fecha,
      monto: mov.monto,
      descripcion: mov.descripcion,
      saldoAnterior: mov.saldoAnterior,
      saldoActual: mov.saldoActual,
    }));

    return {
      proveedorId,
      deudaTotal,
      facturasPendientes: facturasPendientesDto,
      remitosSinFacturar: remitosSinFacturarDto,
      ordenesCompraPendientes: ordenesPendientesDto,
      movimientos: movimientosDto,
    };
  }
}


