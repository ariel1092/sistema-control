import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { Producto } from '../../../domain/entities/producto.entity';
import { CreateProductoDto } from '../../dtos/productos/create-producto.dto';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';

@Injectable()
export class CreateProductoUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

  async execute(dto: CreateProductoDto): Promise<Producto> {
    // Validar que el código no exista
    const productoExistente = await this.productoRepository.findByCodigo(
      dto.codigo,
    );

    if (productoExistente) {
      throw new VentaApplicationException(
        `Ya existe un producto con el código ${dto.codigo}`,
        409,
        'PRODUCTO_DUPLICADO',
      );
    }

    // Crear el producto
    const producto = Producto.crear({
      codigo: dto.codigo,
      nombre: dto.nombre,
      categoria: dto.categoria,
      precioVenta: dto.precioVenta,
      stockActual: dto.stockActual,
      stockMinimo: dto.stockMinimo,
      unidadMedida: dto.unidadMedida,
      descripcion: dto.descripcion,
      marca: dto.marca,
      precioCosto: dto.precioCosto,
      activo: dto.activo !== undefined ? dto.activo : true,
    });

    // Guardar
    return await this.productoRepository.save(producto);
  }
}

