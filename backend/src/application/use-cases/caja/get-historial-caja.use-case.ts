import { Injectable, Inject } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';

export interface HistorialCajaItemDto {
  id: string;
  fecha: Date;
  usuarioId: string;
  estado: 'ABIERTO' | 'CERRADO';
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalGeneral: number;
  cantidadVentas: number;
  observaciones?: string;
  movimientos: Array<{
    id: string;
    tipo: string;
    monto: number;
    motivo: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetHistorialCajaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date): Promise<HistorialCajaItemDto[]> {
    const inicio = fechaInicio || new Date(new Date().setDate(new Date().getDate() - 30));
    const fin = fechaFin || new Date();

    const cierres = await this.cajaRepository.findByRangoFechas(inicio, fin);

    const historial: HistorialCajaItemDto[] = [];

    for (const cierre of cierres) {
      const movimientos = await this.movimientoCajaRepository.findByCierreCajaId(cierre.id!);
      
      historial.push({
        id: cierre.id!,
        fecha: cierre.fecha,
        usuarioId: cierre.usuarioId,
        estado: cierre.estado,
        totalEfectivo: cierre.totalEfectivo,
        totalTarjeta: cierre.totalTarjeta,
        totalTransferencia: cierre.totalTransferencia,
        totalGeneral: cierre.totalGeneral,
        cantidadVentas: cierre.cantidadVentas,
        observaciones: cierre.observaciones,
        movimientos: movimientos.map((m) => ({
          id: m.id!,
          tipo: m.tipo,
          monto: m.monto,
          motivo: m.motivo,
          createdAt: m.createdAt,
        })),
        createdAt: cierre.createdAt,
        updatedAt: cierre.updatedAt,
      });
    }

    return historial;
  }
}

