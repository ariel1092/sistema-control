import { Injectable, Inject } from '@nestjs/common';
import { IMovimientoStockRepository } from '../../ports/movimiento-stock.repository.interface';
import { MovimientoStock } from '../../../domain/entities/movimiento-stock.entity';
import { TipoMovimientoStock } from '../../../domain/enums/tipo-movimiento-stock.enum';

@Injectable()
export class GetMovimientosStockUseCase {
  constructor(
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository: IMovimientoStockRepository,
  ) {}

  async execute(
    productoId?: string,
    tipo?: TipoMovimientoStock,
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<MovimientoStock[]> {
    if (productoId) {
      return await this.movimientoStockRepository.findByProductoId(productoId);
    }

    if (tipo) {
      return await this.movimientoStockRepository.findByTipo(tipo, fechaInicio, fechaFin);
    }

    return await this.movimientoStockRepository.findAll(fechaInicio, fechaFin);
  }
}

