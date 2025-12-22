export enum FuentePrecioProveedorProducto {
  MANUAL = 'MANUAL',
  FACTURA_PROVEEDOR = 'FACTURA_PROVEEDOR',
  ORDEN_COMPRA = 'ORDEN_COMPRA',
}

export enum MonedaPrecio {
  ARS = 'ARS',
  USD = 'USD',
}

export class PrecioProveedorProducto {
  constructor(
    public readonly id: string | undefined,
    public readonly productoId: string,
    public readonly proveedorId: string,
    public readonly precioUnitario: number,
    public readonly descuentoPct: number = 0,
    public readonly ivaPct: number = 0,
    public readonly moneda: MonedaPrecio = MonedaPrecio.ARS,
    public readonly fecha: Date = new Date(),
    public readonly fuente: FuentePrecioProveedorProducto = FuentePrecioProveedorProducto.MANUAL,
    public readonly activo: boolean = true,
    public readonly referenciaTipo?: string,
    public readonly referenciaId?: string,
    public readonly codigoProducto?: string,
    public readonly nombreProducto?: string,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    // Validaciones requeridas
    if (this.precioUnitario < 0) {
      throw new Error('precioUnitario debe ser >= 0');
    }
    if (this.descuentoPct < 0 || this.descuentoPct > 100) {
      throw new Error('descuentoPct debe estar entre 0 y 100');
    }
    if (this.ivaPct < 0 || this.ivaPct > 100) {
      throw new Error('ivaPct debe estar entre 0 y 100');
    }
  }

  public calcularPrecioNeto(): number {
    return this.precioUnitario - (this.precioUnitario * this.descuentoPct) / 100;
  }

  public calcularPrecioFinal(): number {
    const precioNeto = this.calcularPrecioNeto();
    return precioNeto + (precioNeto * this.ivaPct) / 100;
  }
}


