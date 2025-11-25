import { DetalleFacturaProveedor } from './detalle-factura-proveedor.entity';

export class FacturaProveedor {
  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly proveedorId: string,
    public readonly fecha: Date,
    public readonly fechaVencimiento: Date,
    public readonly detalles: DetalleFacturaProveedor[],
    public readonly remitoId?: string, // Remito asociado
    public readonly ordenCompraId?: string, // Orden de compra asociada
    public readonly pagada: boolean = false,
    public readonly montoPagado: number = 0,
    public readonly fechaPago?: Date,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.numero || this.numero.trim().length === 0) {
      throw new Error('El número de factura es obligatorio');
    }

    if (!this.proveedorId) {
      throw new Error('El proveedor es obligatorio');
    }

    if (this.detalles.length === 0) {
      throw new Error('La factura debe tener al menos un detalle');
    }

    if (this.fechaVencimiento < this.fecha) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de la factura');
    }

    if (this.montoPagado < 0) {
      throw new Error('El monto pagado no puede ser negativo');
    }

    const total = this.calcularTotal();
    if (this.montoPagado > total) {
      throw new Error('El monto pagado no puede ser mayor al total de la factura');
    }
  }

  public calcularSubtotal(): number {
    return this.detalles.reduce((sum, detalle) => sum + detalle.calcularSubtotal(), 0);
  }

  public calcularTotalIva(): number {
    return this.detalles.reduce((sum, detalle) => {
      const subtotal = detalle.calcularSubtotal();
      return sum + (subtotal * (detalle.iva / 100));
    }, 0);
  }

  public calcularTotal(): number {
    return this.detalles.reduce((sum, detalle) => sum + detalle.calcularTotalConIva(), 0);
  }

  public calcularSaldoPendiente(): number {
    return this.calcularTotal() - this.montoPagado;
  }

  public estaVencida(): boolean {
    return new Date() > this.fechaVencimiento && !this.pagada;
  }

  public estaPorVencer(dias: number = 5): boolean {
    const hoy = new Date();
    const fechaLimite = new Date(this.fechaVencimiento);
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    return hoy >= fechaLimite && !this.pagada;
  }

  public registrarPago(monto: number): void {
    if (monto <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const nuevoMontoPagado = this.montoPagado + monto;
    const total = this.calcularTotal();

    if (nuevoMontoPagado > total) {
      throw new Error('El monto pagado no puede exceder el total de la factura');
    }

    (this as any).montoPagado = nuevoMontoPagado;
    (this as any).fechaPago = new Date();

    if (nuevoMontoPagado >= total) {
      (this as any).pagada = true;
    }
  }

  public asociarRemito(remitoId: string): void {
    (this as any).remitoId = remitoId;
  }

  public asociarOrdenCompra(ordenCompraId: string): void {
    (this as any).ordenCompraId = ordenCompraId;
  }

  static crear(params: {
    numero: string;
    proveedorId: string;
    fecha: Date;
    fechaVencimiento: Date;
    detalles: DetalleFacturaProveedor[];
    remitoId?: string;
    ordenCompraId?: string;
    observaciones?: string;
  }): FacturaProveedor {
    return new FacturaProveedor(
      undefined,
      params.numero,
      params.proveedorId,
      params.fecha,
      params.fechaVencimiento,
      params.detalles,
      params.remitoId,
      params.ordenCompraId,
      false,
      0,
      undefined,
      params.observaciones,
    );
  }
}


