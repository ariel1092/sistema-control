export class DetalleFacturaProveedor {
  constructor(
    public readonly id: string | undefined,
    public readonly facturaId: string | undefined,
    public readonly productoId: string,
    public readonly codigoProducto: string,
    public readonly nombreProducto: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly descuento: number = 0,
    public readonly iva: number = 0,
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

    if (this.descuento < 0 || this.descuento > 100) {
      throw new Error('El descuento debe estar entre 0 y 100%');
    }

    if (this.iva < 0 || this.iva > 100) {
      throw new Error('El IVA debe estar entre 0 y 100%');
    }

    if (!this.productoId || !this.codigoProducto || !this.nombreProducto) {
      throw new Error('Producto ID, código y nombre son obligatorios');
    }
  }

  public calcularSubtotal(): number {
    const subtotal = this.cantidad * this.precioUnitario;
    const descuentoMonto = subtotal * (this.descuento / 100);
    return subtotal - descuentoMonto;
  }

  public calcularTotalConIva(): number {
    const subtotal = this.calcularSubtotal();
    const ivaMonto = subtotal * (this.iva / 100);
    return subtotal + ivaMonto;
  }

  static crear(params: {
    productoId: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    iva?: number;
    observaciones?: string;
  }): DetalleFacturaProveedor {
    return new DetalleFacturaProveedor(
      undefined,
      undefined,
      params.productoId,
      params.codigoProducto,
      params.nombreProducto,
      params.cantidad,
      params.precioUnitario,
      params.descuento || 0,
      params.iva || 0,
      params.observaciones,
    );
  }
}


