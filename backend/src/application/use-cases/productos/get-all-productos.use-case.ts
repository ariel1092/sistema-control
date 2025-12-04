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
  ) {}

  async execute(activos?: boolean): Promise<Producto[]> {
    // Generar clave de caché única por parámetros
    const cacheKey = `productos:all:${activos ?? 'all'}`;
    
    // Intentar obtener del caché
    const cached = await this.cacheManager.get<Producto[]>(cacheKey);
    if (cached) {
      // Si el caché tiene un array vacío, puede ser un cache miss anterior
      // Invalidar y buscar de nuevo
      if (cached.length === 0) {
        await this.cacheManager.del(cacheKey);
      } else {
        return cached;
      }
    }

    // Si no está en caché, obtener de la BD
    const productos = await this.productoRepository.findAll(activos);
    
    // Solo guardar en caché si hay productos (evitar cachear arrays vacíos)
    if (productos.length > 0) {
      await this.cacheManager.set(cacheKey, productos, 600);
    }
    
    return productos;
  }
}

