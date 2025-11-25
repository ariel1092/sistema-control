import { EstadoOrdenCompra } from '../enums/estado-orden-compra.enum';
import { DetalleOrdenCompra } from './detalle-orden-compra.entity';

export class OrdenCompra {
  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly proveedorId: string,
    public readonly fecha: Date,
    public readonly detalles: DetalleOrdenCompra[],
    public readonly estado: EstadoOrdenCompra = EstadoOrdenCompra.PENDIENTE,
    public readonly fechaEstimadaEntrega?: Date,
    public readonly observaciones?: string,
    public readonly remitoId?: string, // Remito asociado si existe
    public readonly facturaId?: string, // Factura asociada si existe
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.numero || this.numero.trim().length === 0) {
      throw new Error('El número de orden de compra es obligatorio');
    }

    if (!this.proveedorId) {
      throw new Error('El proveedor es obligatorio');
    }

    if (this.detalles.length === 0) {
      throw new Error('La orden de compra debe tener al menos un detalle');
    }

    if (!Object.values(EstadoOrdenCompra).includes(this.estado)) {
      throw new Error('El estado de la orden de compra no es válido');
    }
  }

  public calcularTotal(): number {
    return this.detalles.reduce((sum, detalle) => sum + detalle.calcularSubtotal(), 0);
  }

  public calcularTotalRecibido(): number {
    return this.detalles.reduce(
      (sum, detalle) => sum + (detalle.cantidadRecibida * detalle.precioUnitario),
      0,
    );
  }

  public cantidadItemsPendientes(): number {
    return this.detalles.filter((d) => !d.estaCompleto()).length;
  }

  public cantidadItemsCompletos(): number {
    return this.detalles.filter((d) => d.estaCompleto()).length;
  }

  public estaCompleta(): boolean {
    return this.detalles.every((d) => d.estaCompleto());
  }

  public actualizarEstado(nuevoEstado: EstadoOrdenCompra): void {
    if (!Object.values(EstadoOrdenCompra).includes(nuevoEstado)) {
      throw new Error('El estado no es válido');
    }

    // Validaciones de transición de estado
    if (this.estado === EstadoOrdenCompra.CANCELADO && nuevoEstado !== EstadoOrdenCompra.CANCELADO) {
      throw new Error('No se puede cambiar el estado de una orden cancelada');
    }

    (this as any).estado = nuevoEstado;
  }

  public asociarRemito(remitoId: string): void {
    (this as any).remitoId = remitoId;
    if (this.estaCompleta()) {
      this.actualizarEstado(EstadoOrdenCompra.COMPLETADO);
    } else {
      this.actualizarEstado(EstadoOrdenCompra.PARCIAL);
    }
  }

  public asociarFactura(facturaId: string): void {
    (this as any).facturaId = facturaId;
  }

  static crear(params: {
    numero: string;
    proveedorId: string;
    fecha: Date;
    detalles: DetalleOrdenCompra[];
    fechaEstimadaEntrega?: Date;
    observaciones?: string;
  }): OrdenCompra {
    return new OrdenCompra(
      undefined,
      params.numero,
      params.proveedorId,
      params.fecha,
      params.detalles,
      EstadoOrdenCompra.PENDIENTE,
      params.fechaEstimadaEntrega,
      params.observaciones,
    );
  }
}

