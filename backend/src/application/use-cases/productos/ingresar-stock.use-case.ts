import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { IMovimientoStockRepository } from '../../ports/movimiento-stock.repository.interface';
import { MovimientoStock } from '../../../domain/entities/movimiento-stock.entity';
import { TipoMovimientoStock } from '../../../domain/enums/tipo-movimiento-stock.enum';

@Injectable()
export class IngresarStockUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository: IMovimientoStockRepository,
  ) {}

  async execute(
    productId: string,
    quantity: number,
    description: string,
    userId: string,
  ): Promise<{ producto: any; movimiento: MovimientoStock }> {
    if (quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    const producto = await this.productoRepository.findById(productId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Reponer stock
    producto.reponer(quantity);

    // Guardar producto actualizado
    const productoActualizado = await this.productoRepository.save(producto);

    // Registrar movimiento
    const movimiento = MovimientoStock.crear({
      productoId: producto.id!,
      tipo: TipoMovimientoStock.INGRESO,
      cantidad: quantity,
      descripcion: description,
      usuarioId: userId,
    });

    const movimientoGuardado = await this.movimientoStockRepository.save(movimiento);

    return {
      producto: productoActualizado,
      movimiento: movimientoGuardado,
    };
  }
}

