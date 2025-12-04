import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { MovimientoCaja, TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';
import { CrearMovimientoCajaDto } from '../../dtos/caja/movimiento-caja.dto';
import { ICajaRepository } from '../../ports/caja.repository.interface';

@Injectable()
export class CrearMovimientoCajaUseCase {
  constructor(
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
  ) {}

  async execute(dto: CrearMovimientoCajaDto, usuarioId: string): Promise<MovimientoCaja> {
    const fechaHoy = new Date();
    
    // Normalizar fecha al inicio del día
    const año = fechaHoy.getUTCFullYear();
    const mes = fechaHoy.getUTCMonth();
    const dia = fechaHoy.getUTCDate();
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));

    // Verificar que existe una caja abierta
    const caja = await this.cajaRepository.findCajaAbierta(fechaInicio);
    if (!caja) {
      throw new NotFoundException('No hay una caja abierta. Debe abrir la caja primero');
    }

    if (caja.estaCerrada()) {
      throw new BadRequestException('No se pueden realizar movimientos en una caja cerrada');
    }

    // Crear movimiento
    const movimiento = MovimientoCaja.crear({
      cierreCajaId: caja.id!,
      tipo: dto.tipo,
      monto: dto.monto,
      motivo: dto.motivo,
      usuarioId,
    });

    return await this.movimientoCajaRepository.save(movimiento);
  }
}

