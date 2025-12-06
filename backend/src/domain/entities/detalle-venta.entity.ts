import { VentaDomainException } from '../exceptions/venta.exception';

export class DetalleVenta {
  constructor(
    public readonly id: string | undefined,
    public readonly ventaId: string | undefined,
    public readonly productoId: string,
    public readonly codigoProducto: string,
    public readonly nombreProducto: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly descuentoItem: number = 0,
    public readonly createdAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.cantidad <= 0) {
      throw new VentaDomainException('La cantidad debe ser mayor a 0');
    }

    if (this.precioUnitario < 0) {
      throw new VentaDomainException('El precio no puede ser negativo');
    }

    if (this.descuentoItem < 0 || this.descuentoItem > 100) {
      throw new VentaDomainException(
        'Descuento de ítem debe estar entre 0 y 100%',
      );
    }

    if (!this.productoId || !this.codigoProducto || !this.nombreProducto) {
      throw new VentaDomainException(
        'Producto ID, código y nombre son obligatorios',
      );
    }
  }

  public calcularSubtotal(): number {
    const subtotal = this.cantidad * this.precioUnitario;
    const descuento = subtotal * (this.descuentoItem / 100);
    return subtotal - descuento;
  }

  static crear(params: {
    productoId: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    descuentoItem?: number;
  }): DetalleVenta {
    return new DetalleVenta(
      undefined,
      undefined, // será asignado al agregar a la venta
      params.productoId,
      params.codigoProducto,
      params.nombreProducto,
      params.cantidad,
      params.precioUnitario,
      params.descuentoItem || 0,
    );
  }

  public asignarVenta(ventaId: string): DetalleVenta {
    return new DetalleVenta(
      this.id,
      ventaId,
      this.productoId,
      this.codigoProducto,
      this.nombreProducto,
      this.cantidad,
      this.precioUnitario,
      this.descuentoItem,
      this.createdAt,
    );
  }
}












