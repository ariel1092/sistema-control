import { TipoMovimientoStock } from '../enums/tipo-movimiento-stock.enum';
import { ProductoDomainException } from '../exceptions/producto.exception';

export class MovimientoStock {
  constructor(
    public readonly id: string | undefined,
    public readonly productoId: string,
    public readonly tipo: TipoMovimientoStock,
    public readonly cantidad: number,
    public readonly descripcion: string,
    public readonly usuarioId: string,
    public readonly ventaId?: string, // Para movimientos relacionados con ventas
    public readonly createdAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.productoId || this.productoId.trim() === '') {
      throw new ProductoDomainException('El ID del producto es obligatorio');
    }

    if (!Object.values(TipoMovimientoStock).includes(this.tipo)) {
      throw new ProductoDomainException('El tipo de movimiento no es válido');
    }

    if (this.cantidad <= 0) {
      throw new ProductoDomainException(
        'La cantidad del movimiento debe ser mayor a 0',
      );
    }

    if (!this.descripcion || this.descripcion.trim() === '') {
      throw new ProductoDomainException(
        'La descripción del movimiento es obligatoria',
      );
    }

    if (!this.usuarioId || this.usuarioId.trim() === '') {
      throw new ProductoDomainException('El ID del usuario es obligatorio');
    }
  }

  static crear(params: {
    productoId: string;
    tipo: TipoMovimientoStock;
    cantidad: number;
    descripcion: string;
    usuarioId: string;
    ventaId?: string;
  }): MovimientoStock {
    return new MovimientoStock(
      undefined,
      params.productoId,
      params.tipo,
      params.cantidad,
      params.descripcion,
      params.usuarioId,
      params.ventaId,
    );
  }
}
