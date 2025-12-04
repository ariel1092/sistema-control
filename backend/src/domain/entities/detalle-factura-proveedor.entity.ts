export class DetalleFacturaProveedor {
  constructor(
    public readonly id: string | undefined,
    public readonly facturaId: string | undefined,
    public readonly codigoProducto: string,
    public readonly nombreProducto: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly descuento: number = 0,
    public readonly iva: number = 0,
    public readonly productoId?: string,
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
      throw new Error('Descuento debe estar entre 0 y 100%');
    }

    if (!this.codigoProducto || !this.nombreProducto) {
      throw new Error('Código y nombre del producto son obligatorios');
    }
  }

  public calcularSubtotalBruto(): number {
    return this.cantidad * this.precioUnitario;
  }

  public calcularDescuentoMonto(): number {
    const subtotal = this.calcularSubtotalBruto();
    return subtotal * (this.descuento / 100);
  }

  public calcularTotalBrutoConIva(): number {
    const subtotal = this.calcularSubtotalBruto();
    const descuento = this.calcularDescuentoMonto();
    const subtotalNeto = subtotal - descuento;
    return subtotalNeto * (1 + this.iva / 100);
  }

  static crear(params: {
    productoId?: string;
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
      params.codigoProducto,
      params.nombreProducto,
      params.cantidad,
      params.precioUnitario,
      params.descuento || 0,
      params.iva || 0,
      params.productoId,
      params.observaciones,
    );
  }

  public asignarFactura(facturaId: string): DetalleFacturaProveedor {
    return new DetalleFacturaProveedor(
      this.id,
      facturaId,
      this.codigoProducto,
      this.nombreProducto,
      this.cantidad,
      this.precioUnitario,
      this.descuento,
      this.iva,
      this.productoId,
      this.observaciones,
      this.createdAt,
    );
  }
}
