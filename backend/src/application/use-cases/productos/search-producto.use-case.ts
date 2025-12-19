import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';

@Injectable()
export class SearchProductoUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) { }

  async execute(termino: string, limit: number = 50, skip: number = 0): Promise<{ data: Producto[], total: number }> {
    if (!termino || termino.trim() === '') {
      return { data: [], total: 0 };
    }

    // Buscar por código exacto primero
    const productoPorCodigo = await this.productoRepository.findByCodigo(
      termino.trim(),
    );

    if (productoPorCodigo) {
      return { data: [productoPorCodigo], total: 1 };
    }

    // Buscar por texto (nombre, descripción)
    return this.productoRepository.search(termino.trim(), limit, skip);
  }
}












