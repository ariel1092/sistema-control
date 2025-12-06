import { Inject, Injectable } from '@nestjs/common';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { IFacturaClienteRepository } from '../../ports/factura-cliente.repository.interface';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { differenceInDays } from 'date-fns';

export interface CuentaCorrienteClienteDto {
  clienteId: string;
  deudaTotal: number;
  facturasPendientes: Array<{
    id: string;
    numero: string;
    fecha: Date;
    fechaVencimiento: Date;
    montoTotal: number;
    montoPagado: number;
    saldoPendiente: number;
    diasHastaVencimiento: number;
    estaVencida: boolean;
    estaPorVencer: boolean;
    descripcion?: string;
  }>;
  movimientos: Array<{
    id: string;
    tipo: string;
    fecha: Date;
    monto: number;
    descripcion: string;
    saldoAnterior: number;
    saldoActual: number;
    observaciones?: string;
    usuarioId?: string;
    createdAt: Date; // Para auditoría completa con fecha y hora
  }>;
}

@Injectable()
export class GetCuentaCorrienteClienteUseCase {
  constructor(
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
    @Inject('IFacturaClienteRepository')
    private readonly facturaRepository: IFacturaClienteRepository,
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoRepository: IMovimientoCuentaCorrienteClienteRepository,
  ) {}

  async execute(clienteId: string): Promise<CuentaCorrienteClienteDto> {
    const cliente = await this.clienteRepository.findById(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // Obtener deuda total (saldo actual)
    const deudaTotal = await this.movimientoRepository.getUltimoSaldo(clienteId);

    // Obtener facturas pendientes
    const facturasPendientes = await this.facturaRepository.findPendientes(clienteId);
    const hoy = new Date();
    const facturasPendientesDto = facturasPendientes.map((factura) => {
      const diasHastaVencimiento = differenceInDays(factura.fechaVencimiento, hoy);
      return {
        id: factura.id!,
        numero: factura.numero,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        montoTotal: factura.montoTotal,
        montoPagado: factura.montoPagado,
        saldoPendiente: factura.calcularSaldoPendiente(),
        diasHastaVencimiento,
        estaVencida: factura.estaVencida(),
        estaPorVencer: factura.estaPorVencer(5),
        descripcion: factura.descripcion,
      };
    });

    // Obtener movimientos de cuenta corriente (con auditoría completa)
    const movimientos = await this.movimientoRepository.findByCliente(clienteId);
    const movimientosDto = movimientos.map((mov) => ({
      id: mov.id!,
      tipo: mov.tipo,
      fecha: mov.fecha,
      monto: mov.monto,
      descripcion: mov.descripcion,
      saldoAnterior: mov.saldoAnterior,
      saldoActual: mov.saldoActual,
      observaciones: mov.observaciones,
      usuarioId: mov.usuarioId,
      createdAt: mov.createdAt, // Fecha y hora exacta del movimiento (auditoría)
    }));

    return {
      clienteId,
      deudaTotal,
      facturasPendientes: facturasPendientesDto,
      movimientos: movimientosDto,
    };
  }
}


