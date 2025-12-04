import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { IMovimientoStockRepository } from '../../ports/movimiento-stock.repository.interface';

@Injectable()
export class DeleteProductoUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository: IMovimientoStockRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(id: string): Promise<void> {
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Verificar si tiene movimientos
    const tieneMovimientos = await this.movimientoStockRepository.hasMovimientos(id);
    if (tieneMovimientos) {
      throw new BadRequestException(
        'No se puede eliminar un producto que tiene movimientos de stock registrados',
      );
    }

    // Soft delete: marcar como inactivo
    await this.productoRepository.delete(id);

    // Invalidar caché de productos
    await this.cacheManager.del('productos:all:true');
    await this.cacheManager.del('productos:all:all');
  }
}

