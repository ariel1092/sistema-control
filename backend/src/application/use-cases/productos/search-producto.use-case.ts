import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';

@Injectable()
export class SearchProductoUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async execute(termino: string): Promise<Producto[]> {
    if (!termino || termino.trim() === '') {
      return [];
    }

    // Buscar por código exacto primero
    const productoPorCodigo = await this.productoRepository.findByCodigo(
      termino.trim(),
    );

    if (productoPorCodigo) {
      return [productoPorCodigo];
    }

    // Buscar por texto (nombre, descripción)
    const productos = await this.productoRepository.search(termino.trim());

    // Filtrar solo activos
    return productos.filter((p) => p.activo);
  }
}





