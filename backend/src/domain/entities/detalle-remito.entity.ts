export class DetalleRemito {
  constructor(
    public readonly id: string | undefined,
    public readonly remitoId: string | undefined,
    public readonly productoId: string,
    public readonly codigoProducto: string,
    public readonly nombreProducto: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    if (this.precioUnitario < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    if (!this.productoId || !this.codigoProducto || !this.nombreProducto) {
      throw new Error('Producto ID, código y nombre son obligatorios');
    }
  }

  public calcularSubtotal(): number {
    return this.cantidad * this.precioUnitario;
  }

  static crear(params: {
    productoId: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    observaciones?: string;
  }): DetalleRemito {
    return new DetalleRemito(
      undefined,
      undefined,
      params.productoId,
      params.codigoProducto,
      params.nombreProducto,
      params.cantidad,
      params.precioUnitario,
      params.observaciones,
    );
  }
}


