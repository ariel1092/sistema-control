import { Inject, Injectable } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja, OrigenMovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { Venta } from '../../../domain/entities/venta.entity';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';

@Injectable()
export class RegistrarMovimientosCajaVentaUseCase {
  constructor(
    @Inject('ICajaRepository') private readonly cajaRepository: ICajaRepository,
    @Inject('IMovimientoCajaRepository') private readonly movimientoCajaRepository: IMovimientoCajaRepository,
  ) {}

  async registrarPorVenta(params: {
    venta: Venta;
    usuarioId: string;
    comprobanteFiscalId?: string;
  }, options: { session: any }): Promise<void> {
    const session = options?.session;
    if (!session) throw new Error('RegistrarMovimientosCajaVentaUseCase requiere session (transacción obligatoria)');
    if (typeof session.inTransaction === 'function' && !session.inTransaction()) {
      throw new Error('RegistrarMovimientosCajaVentaUseCase debe ejecutarse dentro de una transacción Mongo');
    }

    const { venta, usuarioId } = params;
    if (!venta.id) throw new Error('La venta debe tener id para registrar movimientos de caja');

    // Idempotencia: si ya existen movimientos VENTA para esta venta, no duplicar
    const existentes = await this.movimientoCajaRepository.findByVentaId(venta.id);
    if (existentes.some((m) => m.origen === OrigenMovimientoCaja.VENTA)) {
      return;
    }

    // P0: PROHIBIDO auto-crear caja desde ventas.
    // Requerir explícitamente caja ABIERTO para la fecha de la venta.
    const caja = await this.cajaRepository.findCajaAbierta(venta.fecha, { session });
    if (!caja || caja.estaCerrada()) {
      throw new Error(
        'No se puede registrar movimiento de caja: no existe una caja ABIERTA para la fecha de la venta. ' +
        'Debe abrir la caja antes de registrar ventas.',
      );
    }

    /**
     * REGLA: 1 movimiento por medio de pago (soporta pagos mixtos).
     * Agrupamos por (tipo + cuentaBancaria en transferencias) para evitar duplicados
     * y respetar el índice único { ventaId, metodoPago, origen }.
     */
    const grupos = new Map<string, {
      tipo: string;
      cuentaBancaria?: string;
      referencia?: string;
      recargo?: number;
      monto: number;
      referenciasDistintas: boolean;
    }>();

    for (const mp of venta.metodosPago) {
      // Cuenta corriente NO impacta caja
      if (mp.tipo === TipoMetodoPago.CUENTA_CORRIENTE || String(mp.tipo) === 'CUENTA_CORRIENTE') continue;

      const tipo = String(mp.tipo);
      const cuentaBancaria = (mp as any).cuentaBancaria ? String((mp as any).cuentaBancaria) : undefined;
      const key = tipo === TipoMetodoPago.TRANSFERENCIA ? `${tipo}:${cuentaBancaria || 'S/C'}` : tipo;

      const prev = grupos.get(key);
      if (!prev) {
        grupos.set(key, {
          tipo,
          cuentaBancaria,
          referencia: mp.referencia,
          recargo: mp.recargo,
          monto: mp.monto,
          referenciasDistintas: false,
        });
      } else {
        prev.monto += mp.monto;
        // Si hay referencias diferentes, marcamos como multi
        if ((prev.referencia || '') !== (mp.referencia || '')) {
          prev.referenciasDistintas = true;
        }
      }
    }

    const movimientos: MovimientoCaja[] = [];
    for (const g of grupos.values()) {
      const motivo = `Venta ${venta.numero} - ${g.tipo}${g.cuentaBancaria ? ` (${g.cuentaBancaria})` : ''}`;
      movimientos.push(MovimientoCaja.crear({
        cierreCajaId: caja.id!,
        tipo: TipoMovimientoCaja.INGRESO,
        monto: g.monto,
        motivo,
        usuarioId,
        origen: OrigenMovimientoCaja.VENTA,
        metodoPago: g.tipo,
        referencia: g.referenciasDistintas ? 'MULTI' : g.referencia,
        cuentaBancaria: g.cuentaBancaria,
        recargo: g.recargo,
        ventaId: venta.id,
        ventaNumero: venta.numero,
        comprobanteFiscalId: params.comprobanteFiscalId,
      }));
    }

    if (movimientos.length === 0) return;
    await this.movimientoCajaRepository.saveMany(movimientos, { session });
  }

  async revertirPorVenta(params: {
    venta: Venta;
    usuarioId: string;
    motivo?: string;
  }, options: { session: any }): Promise<void> {
    const session = options?.session;
    if (!session) throw new Error('RegistrarMovimientosCajaVentaUseCase.revertirPorVenta requiere session (transacción obligatoria)');
    if (typeof session.inTransaction === 'function' && !session.inTransaction()) {
      throw new Error('RegistrarMovimientosCajaVentaUseCase.revertirPorVenta debe ejecutarse dentro de una transacción Mongo');
    }

    const { venta, usuarioId } = params;
    if (!venta.id) return;

    const movimientosVenta = await this.movimientoCajaRepository.findByVentaId(venta.id);
    const ingresosVenta = movimientosVenta.filter((m) => m.origen === OrigenMovimientoCaja.VENTA);
    if (ingresosVenta.length === 0) return;

    // Idempotencia: si ya existe reverso, no duplicar
    if (movimientosVenta.some((m) => m.origen === OrigenMovimientoCaja.REVERSO_VENTA)) {
      return;
    }

    const reversos = ingresosVenta.map((m) =>
      MovimientoCaja.crear({
        cierreCajaId: m.cierreCajaId,
        tipo: TipoMovimientoCaja.SALIDA,
        monto: m.monto,
        motivo: params.motivo || `Reverso Venta ${venta.numero}`,
        usuarioId,
        origen: OrigenMovimientoCaja.REVERSO_VENTA,
        metodoPago: m.metodoPago,
        referencia: m.referencia,
        cuentaBancaria: m.cuentaBancaria,
        recargo: m.recargo,
        ventaId: venta.id!,
        ventaNumero: venta.numero,
        comprobanteFiscalId: m.comprobanteFiscalId,
      }),
    );

    await this.movimientoCajaRepository.saveMany(reversos, { session });
  }
}


