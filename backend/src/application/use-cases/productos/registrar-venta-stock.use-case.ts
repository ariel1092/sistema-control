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
    const producto = await this.productoRepository.findById(productId, { session });
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

  /**
   * Optimización de alto impacto: elimina N+1 (por ítem) usando:
   * - 1 bulkWrite para descontar stock de productos
   * - 1 insertMany para registrar movimientos de stock
   * Todo dentro de la misma `session` (transacción).
   */
  async executeBatch(
    items: Array<{ productoId: string; cantidad: number }>,
    ventaId: string,
    userId: string,
    options?: { session?: any },
  ): Promise<void> {
    const session = options?.session;
    if (!items || items.length === 0) return;

    // Consolidar cantidades por producto (equivalente a múltiples execute() sobre el mismo producto).
    const porProducto = new Map<string, number>();
    for (const it of items) {
      porProducto.set(it.productoId, (porProducto.get(it.productoId) || 0) + it.cantidad);
    }

    const bulkItems = Array.from(porProducto.entries()).map(([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));

    // 1) Descontar stock en batch (1 round-trip)
    await this.productoRepository.bulkDescontarStock(bulkItems, { session });

    // 2) Registrar movimientos de stock en batch (1 round-trip)
    const movimientos = items.map((it) =>
      MovimientoStock.crear({
        productoId: it.productoId,
        tipo: TipoMovimientoStock.VENTA,
        cantidad: it.cantidad,
        descripcion: `Venta ${ventaId}`,
        usuarioId: userId,
        ventaId,
      }),
    );

    await this.movimientoStockRepository.saveMany(movimientos, { session });
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

