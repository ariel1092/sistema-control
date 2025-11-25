import { DetalleRemito } from './detalle-remito.entity';

export class RemitoProveedor {
  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly proveedorId: string,
    public readonly fecha: Date,
    public readonly detalles: DetalleRemito[],
    public readonly ordenCompraId?: string, // Orden de compra asociada
    public readonly facturado: boolean = false,
    public readonly facturaId?: string, // Factura asociada si está facturado
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.numero || this.numero.trim().length === 0) {
      throw new Error('El número de remito es obligatorio');
    }

    if (!this.proveedorId) {
      throw new Error('El proveedor es obligatorio');
    }

    if (this.detalles.length === 0) {
      throw new Error('El remito debe tener al menos un detalle');
    }
  }

  public calcularTotal(): number {
    return this.detalles.reduce((sum, detalle) => sum + detalle.calcularSubtotal(), 0);
  }

  public marcarFacturado(facturaId: string): void {
    (this as any).facturado = true;
    (this as any).facturaId = facturaId;
  }

  public asociarOrdenCompra(ordenCompraId: string): void {
    (this as any).ordenCompraId = ordenCompraId;
  }

  static crear(params: {
    numero: string;
    proveedorId: string;
    fecha: Date;
    detalles: DetalleRemito[];
    ordenCompraId?: string;
    observaciones?: string;
  }): RemitoProveedor {
    return new RemitoProveedor(
      undefined,
      params.numero,
      params.proveedorId,
      params.fecha,
      params.detalles,
      params.ordenCompraId,
      false,
      undefined,
      params.observaciones,
    );
  }
}


