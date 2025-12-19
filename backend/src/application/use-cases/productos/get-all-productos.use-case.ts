import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';

@Injectable()
export class GetAllProductosUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async execute(activos?: boolean, limit: number = 0, skip: number = 0): Promise<{ data: Producto[], total: number }> {
    // Generar clave de caché única por parámetros
    const cacheKey = `productos:all:${activos ?? 'all'}:${limit}:${skip}`;

    // Intentar obtener del caché
    const cached = await this.cacheManager.get<{ data: Producto[], total: number }>(cacheKey);
    if (cached) {
      if (cached.data.length === 0 && skip === 0) {
        await this.cacheManager.del(cacheKey);
      } else {
        return cached;
      }
    }

    // Si no está en caché, obtener de la BD
    const result = await this.productoRepository.findAll(activos, limit, skip);

    // Solo guardar en caché si hay productos (evitar cachear arrays vacíos)
    if (result.data.length > 0) {
      await this.cacheManager.set(cacheKey, result, 600);
    }

    return result;
  }
}

