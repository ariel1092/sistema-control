import { differenceInDays } from 'date-fns';

export class FacturaCliente {
  public montoPagado: number = 0;

  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly clienteId: string,
    public readonly fecha: Date,
    public readonly fechaVencimiento: Date,
    public readonly montoTotal: number,
    public readonly descripcion?: string,
    public readonly observaciones?: string,
    public readonly ventaId?: string, // Opcional: relacionar con una venta
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.numero || this.numero.trim() === '') {
      throw new Error('El número de factura es obligatorio');
    }

    if (!this.clienteId) {
      throw new Error('El cliente es obligatorio');
    }

    if (this.montoTotal <= 0) {
      throw new Error('El monto total debe ser mayor a 0');
    }

    if (this.fechaVencimiento < this.fecha) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de factura');
    }
  }

  public calcularSaldoPendiente(): number {
    return Math.max(0, this.montoTotal - this.montoPagado);
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
    clienteId: string;
    fecha: Date;
    fechaVencimiento: Date;
    montoTotal: number;
    descripcion?: string;
    observaciones?: string;
    ventaId?: string;
  }): FacturaCliente {
    return new FacturaCliente(
      undefined,
      params.numero,
      params.clienteId,
      params.fecha,
      params.fechaVencimiento,
      params.montoTotal,
      params.descripcion,
      params.observaciones,
      params.ventaId,
    );
  }
}


