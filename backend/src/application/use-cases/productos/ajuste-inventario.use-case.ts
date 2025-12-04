import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { IMovimientoStockRepository } from '../../ports/movimiento-stock.repository.interface';
import { MovimientoStock } from '../../../domain/entities/movimiento-stock.entity';
import { TipoMovimientoStock } from '../../../domain/enums/tipo-movimiento-stock.enum';

@Injectable()
export class AjusteInventarioUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository: IMovimientoStockRepository,
  ) {}

  async execute(
    productId: string,
    quantity: number, // Puede ser positivo o negativo
    motivo: string,
    userId: string,
  ): Promise<{ producto: any; movimiento: MovimientoStock }> {
    if (quantity === 0) {
      throw new BadRequestException('La cantidad del ajuste no puede ser 0');
    }

    const producto = await this.productoRepository.findById(productId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Si es negativo, verificar que no quede stock negativo
    if (quantity < 0 && Math.abs(quantity) > producto.stockActual) {
      throw new BadRequestException(
        `No se puede ajustar. Stock actual: ${producto.stockActual}, Ajuste: ${quantity}`,
      );
    }

    // Aplicar ajuste
    if (quantity > 0) {
      producto.reponer(quantity);
    } else {
      producto.descontar(Math.abs(quantity));
    }

    // Guardar producto actualizado
    const productoActualizado = await this.productoRepository.save(producto);

    // Registrar movimiento
    const movimiento = MovimientoStock.crear({
      productoId: producto.id!,
      tipo: TipoMovimientoStock.AJUSTE,
      cantidad: Math.abs(quantity),
      descripcion: `${quantity > 0 ? '+' : ''}${quantity} - ${motivo}`,
      usuarioId: userId,
    });

    const movimientoGuardado = await this.movimientoStockRepository.save(movimiento);

    return {
      producto: productoActualizado,
      movimiento: movimientoGuardado,
    };
  }
}

