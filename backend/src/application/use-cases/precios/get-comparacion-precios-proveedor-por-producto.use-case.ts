import { Inject, Injectable } from '@nestjs/common';
import { IPrecioProveedorProductoRepository } from '../../ports/precio-proveedor-producto.repository.interface';
import { PrecioProveedorProducto } from '../../../domain/entities/precio-proveedor-producto.entity';
import {
  GetComparacionPreciosProveedorPorProductoResponseDto,
  GetComparacionPreciosProveedorPorProductoItemDto,
} from '../../dtos/precios/get-comparacion-precios-proveedor-por-producto-response.dto';

@Injectable()
export class GetComparacionPreciosProveedorPorProductoUseCase {
  constructor(
    @Inject('IPrecioProveedorProductoRepository')
    private readonly precioProveedorProductoRepository: IPrecioProveedorProductoRepository,
  ) {}

  async execute(productoId: string): Promise<GetComparacionPreciosProveedorPorProductoResponseDto> {
    const vigentes = await this.precioProveedorProductoRepository.findVigentesByProducto(productoId);

    const items: GetComparacionPreciosProveedorPorProductoItemDto[] = vigentes.map((v) => {
      const precio = new PrecioProveedorProducto(
        v.id,
        v.productoId,
        v.proveedorId,
        v.precioUnitario,
        v.descuentoPct,
        v.ivaPct,
        v.moneda as any,
        v.fecha,
        v.fuente as any,
        true,
      );

      const precioNeto = precio.calcularPrecioNeto();
      const precioFinal = precio.calcularPrecioFinal();

      return {
        proveedorId: v.proveedorId,
        proveedorNombre: v.proveedorNombre,
        precioUnitario: v.precioUnitario,
        descuentoPct: v.descuentoPct,
        ivaPct: v.ivaPct,
        precioNeto,
        precioFinal,
        fecha: v.fecha,
        fuente: v.fuente as any,
      };
    });

    items.sort((a, b) => a.precioFinal - b.precioFinal);

    return {
      productoId,
      items,
    };
  }
}


