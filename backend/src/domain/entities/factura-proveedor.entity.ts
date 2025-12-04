import { DetalleFacturaProveedor } from './detalle-factura-proveedor.entity';
import { differenceInDays } from 'date-fns';

export class FacturaProveedor {
  public montoPagado: number = 0;

  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly proveedorId: string,
    public readonly fecha: Date,
    public readonly fechaVencimiento: Date,
    public readonly detalles: DetalleFacturaProveedor[],
    public readonly remitoId?: string,
    public readonly ordenCompraId?: string,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.detalles.length === 0) {
      throw new Error('Una factura debe tener al menos un detalle');
    }

    if (!this.numero || this.numero.trim() === '') {
      throw new Error('El número de factura es obligatorio');
    }

    if (!this.proveedorId) {
      throw new Error('El proveedor es obligatorio');
    }

    if (this.fechaVencimiento < this.fecha) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de factura');
    }
  }

  public calcularSubtotalBruto(): number {
    return this.detalles.reduce(
      (sum, detalle) => sum + detalle.calcularSubtotalBruto(),
      0,
    );
  }

  public calcularDescuentoTotal(): number {
    return this.detalles.reduce(
      (sum, detalle) => sum + detalle.calcularDescuentoMonto(),
      0,
    );
  }

  public calcularTotal(): number {
    return this.detalles.reduce(
      (sum, detalle) => sum + detalle.calcularTotalBrutoConIva(),
      0,
    );
  }

  public calcularSaldoPendiente(): number {
    return Math.max(0, this.calcularTotal() - this.montoPagado);
  }

  public get pagada(): boolean {
    return this.calcularSaldoPendiente() === 0;
  }

  public estaVencida(): boolean {
    return new Date() > this.fechaVencimiento;
  }

  public estaPorVencer(dias: number = 5): boolean {
    const hoy = new Date();
    const diasHastaVencimiento = differenceInDays(this.fechaVencimiento, hoy);
    return diasHastaVencimiento >= 0 && diasHastaVencimiento <= dias;
  }

  public registrarPago(monto: number): void {
    if (monto <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const saldoPendiente = this.calcularSaldoPendiente();
    if (monto > saldoPendiente) {
      throw new Error(`El monto del pago ($${monto}) excede el saldo pendiente ($${saldoPendiente})`);
    }

    this.montoPagado += monto;
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
    const detalles = params.detalles.map((det) =>
      det.asignarFactura(undefined as any),
    );

    return new FacturaProveedor(
      undefined,
      params.numero,
      params.proveedorId,
      params.fecha,
      params.fechaVencimiento,
      detalles,
      params.remitoId,
      params.ordenCompraId,
      params.observaciones,
    );
  }
}
