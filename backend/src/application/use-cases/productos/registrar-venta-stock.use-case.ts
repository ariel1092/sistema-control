import { Injectable, Inject } from '@nestjs/common';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { IMovimientoStockRepository } from '../../ports/movimiento-stock.repository.interface';
import { MovimientoStock } from '../../../domain/entities/movimiento-stock.entity';
import { TipoMovimientoStock } from '../../../domain/enums/tipo-movimiento-stock.enum';

@Injectable()
export class RegistrarVentaStockUseCase {
  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository: IMovimientoStockRepository,
  ) { }

  async execute(
    productId: string,
    quantity: number,
    ventaId: string,
    userId: string,
    options?: { session?: any },
  ): Promise<MovimientoStock> {
    const session = options?.session;
    const producto = await this.productoRepository.findById(productId);
    if (!producto) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    // Descontar stock
    producto.descontar(quantity);
    await this.productoRepository.save(producto, { session });

    // Registrar movimiento de venta
    const movimiento = MovimientoStock.crear({
      productoId: producto.id!,
      tipo: TipoMovimientoStock.VENTA,
      cantidad: quantity,
      descripcion: `Venta ${ventaId}`,
      usuarioId: userId,
      ventaId: ventaId,
    });

    return await this.movimientoStockRepository.save(movimiento, { session });
  }

  async revertirVenta(
    productId: string,
    quantity: number,
    ventaId: string,
    userId: string,
    options?: { session?: any },
  ): Promise<MovimientoStock> {
    const session = options?.session;
    const producto = await this.productoRepository.findById(productId);
    if (!producto) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    // Reponer stock
    producto.reponer(quantity);
    await this.productoRepository.save(producto, { session });

    // Registrar movimiento de cancelación
    const movimiento = MovimientoStock.crear({
      productoId: producto.id!,
      tipo: TipoMovimientoStock.VENTA_CANCELADA,
      cantidad: quantity,
      descripcion: `Venta cancelada ${ventaId}`,
      usuarioId: userId,
      ventaId: ventaId,
    });

    return await this.movimientoStockRepository.save(movimiento, { session });
  }
}

