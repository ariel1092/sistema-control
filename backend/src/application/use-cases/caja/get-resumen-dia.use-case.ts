import { Injectable, Inject } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { CierreCajaResponseDto } from '../../dtos/caja/cierre-caja.dto';
import { MovimientoCaja, OrigenMovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { toBusinessDayStartUtc } from '../../../utils/date.utils';
import { measureLogic } from '../../../infrastructure/performance/performance.storage';

@Injectable()
export class GetResumenDiaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
  ) {}

  async execute(fecha?: Date): Promise<CierreCajaResponseDto> {
    return measureLogic(async () => {
      const fechaBusqueda = fecha || new Date();
      
      // Normalizar por "día de negocio" (calendario local) para evitar corrimientos por UTC.
      const fechaInicio = toBusinessDayStartUtc(fechaBusqueda);

      /**
       * READ-ONLY: Resolver el "cierre del día" sin crear documentos.
       *
       * Importante (P0):
       * Puede haber múltiples documentos históricos CERRADOS para una misma fecha (legacy / datos previos).
       * Para no romper operación, si existe una caja ABIERTA para el día, debe tener prioridad absoluta.
       */
      const cajaAbierta = await this.cajaRepository.findCajaAbierta(fechaInicio);
      const cierreCaja = cajaAbierta || await this.cajaRepository.findByFecha(fechaInicio);

      // Contrato: si no existe cierre_cajas para la fecha => estado CERRADO + existeCaja=false
      if (!cierreCaja) {
        const resumenVacio = {
          existeCaja: false,
          id: undefined,
          fecha: fechaInicio,
          usuarioId: undefined,
          totalEfectivo: 0,
          totalTarjeta: 0,
          totalTransferencia: 0,
          totalGeneral: 0,
          totalAbdul: 0,
          totalOsvaldo: 0,
          cantidadVentas: 0,
          estado: 'CERRADO',
          observaciones: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        };

        // Nota: el tipo retornado oficialmente no incluye `existeCaja`.
        // Lo devolvemos igual como parte del contrato HTTP sin mutar el resto del sistema.
        return resumenVacio as any;
      }

      // Recalcular totales exclusivamente desde asientos (movimientos_caja) — NO deducir desde ventas
      const movimientos = await this.movimientoCajaRepository.findByCierreCajaId(cierreCaja.id!);
      const resumen = this.calcularResumenDesdeMovimientos(movimientos);

      // READ-ONLY: NO persistir ni "arreglar" totales, incluso si la caja está CERRADA.
      const response = {
        existeCaja: true,
        id: cierreCaja.id!,
        fecha: cierreCaja.fecha,
        usuarioId: cierreCaja.usuarioId,
        totalEfectivo: resumen.totalEfectivo,
        totalTarjeta: resumen.totalTarjeta,
        totalTransferencia: resumen.totalTransferencia,
        totalGeneral: redondear2(resumen.totalEfectivo + resumen.totalTarjeta + resumen.totalTransferencia),
        totalAbdul: resumen.totalAbdul,
        totalOsvaldo: resumen.totalOsvaldo,
        cantidadVentas: resumen.cantidadVentas,
        estado: cierreCaja.estado,
        observaciones: cierreCaja.observaciones,
        createdAt: cierreCaja.createdAt,
        updatedAt: cierreCaja.updatedAt,
      };

      // Nota: el tipo retornado oficialmente no incluye `existeCaja`.
      // Lo devolvemos igual como parte del contrato HTTP sin mutar el resto del sistema.
      return response as any;
    });
  }

  private calcularResumenDesdeMovimientos(movimientos: MovimientoCaja[]): {
    totalEfectivo: number;
    totalTarjeta: number;
    totalTransferencia: number;
    totalAbdul: number;
    totalOsvaldo: number;
    cantidadVentas: number;
  } {
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;
    let totalAbdul = 0;
    let totalOsvaldo = 0;

    const ventas = new Set<string>();
    const ventasRevertidas = new Set<string>();

    for (const m of movimientos) {
      const signo = m.tipo === TipoMovimientoCaja.INGRESO ? 1 : -1;
      const metodo = (m.metodoPago || 'EFECTIVO').toString(); // manual sin método => asumimos efectivo
      const monto = (m.monto || 0) * signo;

      if (m.origen === OrigenMovimientoCaja.VENTA && m.ventaId) ventas.add(m.ventaId);
      if (m.origen === OrigenMovimientoCaja.REVERSO_VENTA && m.ventaId) ventasRevertidas.add(m.ventaId);

      if (metodo === 'EFECTIVO') {
        totalEfectivo += monto;
      } else if (metodo === 'TRANSFERENCIA') {
        totalTransferencia += monto;
        if ((m.cuentaBancaria || '').toUpperCase() === 'ABDUL') totalAbdul += monto;
        if ((m.cuentaBancaria || '').toUpperCase() === 'OSVALDO') totalOsvaldo += monto;
      } else {
        // TARJETA / DEBITO / CREDITO u otros => Tarjeta (otros)
        totalTarjeta += monto;
      }
    }

    // Ventas netas (no contar ventas revertidas/canceladas)
    let cantidadVentas = 0;
    for (const v of ventas) {
      if (!ventasRevertidas.has(v)) cantidadVentas++;
    }

    return {
      totalEfectivo: redondear2(totalEfectivo),
      totalTarjeta: redondear2(totalTarjeta),
      totalTransferencia: redondear2(totalTransferencia),
      totalAbdul: redondear2(totalAbdul),
      totalOsvaldo: redondear2(totalOsvaldo),
      cantidadVentas,
    };
  }
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

