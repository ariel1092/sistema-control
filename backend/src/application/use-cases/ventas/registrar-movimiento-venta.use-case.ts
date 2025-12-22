import { Inject, Injectable } from '@nestjs/common';
import { IMovimientoVentaRepository } from '../../ports/movimiento-venta.repository.interface';
import { MovimientoVenta } from '../../../domain/entities/movimiento-venta.entity';
import { TipoEventoVenta } from '../../../domain/enums/tipo-evento-venta.enum';
import { Venta } from '../../../domain/entities/venta.entity';

@Injectable()
export class RegistrarMovimientoVentaUseCase {
  constructor(
    @Inject('IMovimientoVentaRepository')
    private readonly movimientoVentaRepository: IMovimientoVentaRepository,
  ) { }

  async execute(params: {
    venta: Venta;
    tipoEvento: TipoEventoVenta;
    usuarioId?: string;
    observaciones?: string;
    metadata?: Record<string, any>;
  }, options?: { session?: any }): Promise<void> {
    const { venta, tipoEvento, usuarioId, observaciones } = params;
    const session = options?.session;

    // Registrar movimiento de venta
    const movimiento = MovimientoVenta.crear({
      ventaId: venta.id!,
      tipoEvento,
      fecha: new Date(),
      usuarioId,
      observaciones,
    });
    await this.movimientoVentaRepository.save(movimiento, { session });
  }
}






