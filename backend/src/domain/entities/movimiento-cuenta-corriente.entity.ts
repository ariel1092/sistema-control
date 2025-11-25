import { TipoMovimientoCC } from '../enums/tipo-movimiento-cc.enum';

export class MovimientoCuentaCorriente {
  constructor(
    public readonly id: string | undefined,
    public readonly proveedorId: string,
    public readonly tipo: TipoMovimientoCC,
    public readonly fecha: Date,
    public readonly monto: number,
    public readonly descripcion: string,
    public readonly documentoId?: string, // ID del documento relacionado (factura, remito, etc.)
    public readonly documentoNumero?: string, // Número del documento relacionado
    public readonly saldoAnterior: number = 0,
    public readonly saldoActual: number = 0,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.proveedorId) {
      throw new Error('El proveedor es obligatorio');
    }

    if (!Object.values(TipoMovimientoCC).includes(this.tipo)) {
      throw new Error('El tipo de movimiento no es válido');
    }

    if (this.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (!this.descripcion || this.descripcion.trim().length === 0) {
      throw new Error('La descripción es obligatoria');
    }
  }

  public esDebito(): boolean {
    // Los débitos aumentan la deuda (facturas, remitos, notas de débito, gastos)
    return [
      TipoMovimientoCC.FACTURA,
      TipoMovimientoCC.REMITO,
      TipoMovimientoCC.NOTA_DEBITO,
      TipoMovimientoCC.GASTO,
    ].includes(this.tipo);
  }

  public esCredito(): boolean {
    // Los créditos disminuyen la deuda (pagos, notas de crédito)
    return [
      TipoMovimientoCC.PAGO_PARCIAL,
      TipoMovimientoCC.PAGO_COMPLETO,
      TipoMovimientoCC.NOTA_CREDITO,
    ].includes(this.tipo);
  }

  public calcularSaldoActual(saldoAnterior: number): number {
    if (this.esDebito()) {
      return saldoAnterior + this.monto;
    } else {
      return saldoAnterior - this.monto;
    }
  }

  static crear(params: {
    proveedorId: string;
    tipo: TipoMovimientoCC;
    fecha: Date;
    monto: number;
    descripcion: string;
    documentoId?: string;
    documentoNumero?: string;
    saldoAnterior?: number;
    observaciones?: string;
  }): MovimientoCuentaCorriente {
    const saldoAnterior = params.saldoAnterior || 0;
    const movimiento = new MovimientoCuentaCorriente(
      undefined,
      params.proveedorId,
      params.tipo,
      params.fecha,
      params.monto,
      params.descripcion,
      params.documentoId,
      params.documentoNumero,
      saldoAnterior,
      0, // Se calculará después
      params.observaciones,
    );

    // Calcular saldo actual
    const saldoActual = movimiento.calcularSaldoActual(saldoAnterior);
    (movimiento as any).saldoActual = saldoActual;

    return movimiento;
  }
}


