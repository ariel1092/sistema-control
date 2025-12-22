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

    /**
     * REGLA DE ORO:
     * Históricamente hubo movimientos guardados con `saldoAnterior/saldoActual` incorrectos (por bug).
     * Para no romper UI ni deuda total, recalculamos el saldo en tiempo real desde los movimientos,
     * usando `createdAt` como orden cronológico.
     */
    const movimientosChron = [...movimientos].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let saldo = 0;
    const saldoPorMovimientoId = new Map<string, { saldoAnterior: number; saldoActual: number }>();
    for (const mov of movimientosChron) {
      const saldoAnteriorCalc = saldo;
      if ((mov as any).esDebito?.()) {
        saldo = saldo + mov.monto;
      } else if ((mov as any).esCredito?.()) {
        saldo = saldo - mov.monto;
      } else {
        // Fallback defensivo: si el tipo no está clasificado, no alteramos saldo
        saldo = saldo;
      }
      saldoPorMovimientoId.set(mov.id!, { saldoAnterior: saldoAnteriorCalc, saldoActual: saldo });
    }

    const deudaTotal = saldo;

    const movimientosDto = movimientos.map((mov) => {
      const calc = saldoPorMovimientoId.get(mov.id!) || { saldoAnterior: mov.saldoAnterior, saldoActual: mov.saldoActual };
      return {
        id: mov.id!,
        tipo: mov.tipo,
        fecha: mov.fecha,
        monto: mov.monto,
        descripcion: mov.descripcion,
        saldoAnterior: calc.saldoAnterior,
        saldoActual: calc.saldoActual,
        observaciones: mov.observaciones,
        usuarioId: mov.usuarioId,
        createdAt: mov.createdAt, // Fecha y hora exacta del movimiento (auditoría)
      };
    });

    return {
      clienteId,
      deudaTotal,
      facturasPendientes: facturasPendientesDto,
      movimientos: movimientosDto,
    };
  }
}


