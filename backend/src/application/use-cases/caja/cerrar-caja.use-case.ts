import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { CerrarCajaDto } from '../../dtos/caja/cerrar-caja.dto';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja, OrigenMovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { toBusinessDayStartUtc } from '../../../utils/date.utils';

@Injectable()
export class CerrarCajaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(dto: CerrarCajaDto, usuarioId: string): Promise<CierreCaja> {
    const session = await this.connection.startSession();
    try {
      let result: CierreCaja | undefined;
      try {
        await session.withTransaction(async () => {
          const fechaHoy = new Date();
          // Normalizar fecha al inicio del "día de negocio" (calendario local)
          const fechaInicio = toBusinessDayStartUtc(fechaHoy);

          // Buscar caja abierta
          const caja = await this.cajaRepository.findCajaAbierta(fechaInicio, { session });
          if (!caja) {
            throw new NotFoundException('No hay una caja abierta para cerrar');
          }

          if (caja.estaCerrada()) {
            throw new BadRequestException('La caja ya está cerrada');
          }

          // Obtener movimientos del día (asientos explícitos)
          const movimientos = await this.movimientoCajaRepository.findByCierreCajaId(caja.id!);
    
          // Recalcular totales desde movimientos (NO deducir desde ventas) — SOLO EN MEMORIA (arqueo)
          const resumen = this.calcularResumenDesdeMovimientos(movimientos);

          // Diferencia de efectivo (no bloqueante, queda registrada en observaciones)
          const diferencia = redondear2(dto.montoFinal - resumen.totalEfectivo);
          const hayDiferencia = Math.abs(diferencia) > 0.01;
          // P0: No persistir totales en cierre_cajas. Persistimos SOLO metadata de arqueo en observaciones.
          // (Hasta que el schema tenga campos estructurados de arqueo/diferencia).
          const baseObs = dto.observaciones || '';
          const separador = baseObs ? ' | ' : '';
          const arqueoObs = `ARQUEO EFECTIVO: ${redondear2(dto.montoFinal)}`;
          const diferenciaObs = `DIFERENCIA EFECTIVO: ${diferencia >= 0 ? '+' : ''}${diferencia}`;
          const observacionesFinal = hayDiferencia
            ? `${baseObs}${separador}${arqueoObs} | ${diferenciaObs}`
            : `${baseObs}${separador}${arqueoObs}`;

          // Cerrar la caja
          caja.cerrar(observacionesFinal);

          // Guardar
          result = await this.cajaRepository.update(caja, { session });
        });
      } catch (error: any) {
        if (String(error?.message || '').includes('Transaction numbers are only allowed on a replica set member')) {
          throw new Error(
            'MongoDB debe estar configurado como Replica Set para usar transacciones. ' +
            'Configura un replica set (incluso single-node) y reinicia la aplicación.',
          );
        }
        throw error;
      }

      return result!;
    } finally {
      await session.endSession();
    }
  }

  private calcularResumenDesdeMovimientos(movimientos: MovimientoCaja[]): {
    totalEfectivo: number;
    totalTarjeta: number;
    totalTransferencia: number;
    cantidadVentas: number;
  } {
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;

    const ventas = new Set<string>();
    const ventasRevertidas = new Set<string>();

    for (const m of movimientos) {
      const signo = m.tipo === TipoMovimientoCaja.INGRESO ? 1 : -1;
      const metodo = (m.metodoPago || 'EFECTIVO').toString();
      const monto = (m.monto || 0) * signo;

      if (m.origen === OrigenMovimientoCaja.VENTA && m.ventaId) ventas.add(m.ventaId);
      if (m.origen === OrigenMovimientoCaja.REVERSO_VENTA && m.ventaId) ventasRevertidas.add(m.ventaId);

      if (metodo === 'EFECTIVO') totalEfectivo += monto;
      else if (metodo === 'TRANSFERENCIA') totalTransferencia += monto;
      else totalTarjeta += monto;
    }

    let cantidadVentas = 0;
    for (const v of ventas) if (!ventasRevertidas.has(v)) cantidadVentas++;

    return {
      totalEfectivo: redondear2(totalEfectivo),
      totalTarjeta: redondear2(totalTarjeta),
      totalTransferencia: redondear2(totalTransferencia),
      cantidadVentas,
    };
  }
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

