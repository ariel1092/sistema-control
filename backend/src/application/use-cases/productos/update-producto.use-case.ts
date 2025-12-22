import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';

@Injectable()
export class UpdateProductoUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(id: string, dto: any): Promise<Producto> {
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Validar código único si se está cambiando
    if (dto.codigo && dto.codigo !== producto.codigo) {
      const productoConCodigo = await this.productoRepository.findByCodigo(dto.codigo);
      if (productoConCodigo && productoConCodigo.id !== id) {
        throw new BadRequestException(`Ya existe un producto con el código ${dto.codigo}`);
      }
    }

    // Actualizar campos permitidos
    if (dto.nombre !== undefined) {
      (producto as any).nombre = dto.nombre;
    }
    if (dto.categoria !== undefined) {
      (producto as any).categoria = dto.categoria;
    }
    if (dto.proveedorId !== undefined) {
      (producto as any).proveedorId = dto.proveedorId;
    }
    if (dto.precioVenta !== undefined) {
      producto.actualizarPrecio(dto.precioVenta);
    }
    if (dto.precioCosto !== undefined) {
      (producto as any).precioCosto = dto.precioCosto;
    }
    if (dto.stockMinimo !== undefined) {
      (producto as any).stockMinimo = dto.stockMinimo;
    }
    if (dto.descripcion !== undefined) {
      (producto as any).descripcion = dto.descripcion;
    }
    if (dto.marca !== undefined) {
      (producto as any).marca = dto.marca;
    }
    if (dto.codigoBarras !== undefined) {
      (producto as any).codigoBarras = dto.codigoBarras;
    }
    if (dto.activo !== undefined) {
      producto.marcarActivo(dto.activo);
    }
    if (dto.descuento !== undefined) {
      producto.descuento = dto.descuento;
    }
    if (dto.iva !== undefined) {
      producto.iva = dto.iva;
    }
    if (dto.codigo !== undefined && dto.codigo !== producto.codigo) {
      (producto as any).codigo = dto.codigo;
    }

    const productoActualizado = await this.productoRepository.save(producto);

    // Invalidar caché de productos
    await this.cacheManager.del('productos:all:true');
    await this.cacheManager.del('productos:all:all');

    return productoActualizado;
  }
}

