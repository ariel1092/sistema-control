export class DetalleOrdenCompra {
  constructor(
    public readonly id: string | undefined,
    public readonly ordenCompraId: string | undefined,
    public readonly productoId: string,
    public readonly codigoProducto: string,
    public readonly nombreProducto: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly cantidadRecibida: number = 0,
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

    if (this.cantidadRecibida < 0) {
      throw new Error('La cantidad recibida no puede ser negativa');
    }

    if (this.cantidadRecibida > this.cantidad) {
      throw new Error('La cantidad recibida no puede ser mayor a la cantidad pedida');
    }

    if (!this.productoId || !this.codigoProducto || !this.nombreProducto) {
      throw new Error('Producto ID, código y nombre son obligatorios');
    }
  }

  public calcularSubtotal(): number {
    return this.cantidad * this.precioUnitario;
  }

  public estaCompleto(): boolean {
    return this.cantidadRecibida >= this.cantidad;
  }

  public cantidadPendiente(): number {
    return Math.max(0, this.cantidad - this.cantidadRecibida);
  }

  public actualizarCantidadRecibida(cantidad: number): void {
    if (cantidad < 0 || cantidad > this.cantidad) {
      throw new Error('La cantidad recibida no es válida');
    }
    (this as any).cantidadRecibida = cantidad;
  }

  static crear(params: {
    productoId: string;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    cantidadRecibida?: number;
    observaciones?: string;
  }): DetalleOrdenCompra {
    return new DetalleOrdenCompra(
      undefined,
      undefined,
      params.productoId,
      params.codigoProducto,
      params.nombreProducto,
      params.cantidad,
      params.precioUnitario,
      params.cantidadRecibida || 0,
      params.observaciones,
    );
  }
}


