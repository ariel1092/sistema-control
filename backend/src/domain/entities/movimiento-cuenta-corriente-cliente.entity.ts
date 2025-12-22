import { TipoMovimientoCC } from '../enums/tipo-movimiento-cc.enum';

export class MovimientoCuentaCorrienteCliente {
  constructor(
    public readonly id: string | undefined,
    public readonly clienteId: string,
    public readonly tipo: TipoMovimientoCC,
    public readonly fecha: Date,
    public readonly monto: number,
    public readonly descripcion: string,
    public readonly documentoId?: string, // ID del documento relacionado (factura, venta, etc.)
    public readonly documentoNumero?: string, // Número del documento relacionado
    public readonly saldoAnterior: number = 0,
    public readonly saldoActual: number = 0,
    public readonly observaciones?: string,
    public readonly usuarioId?: string, // Usuario que realizó el movimiento (para auditoría)
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.clienteId) {
      throw new Error('El cliente es obligatorio');
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
    // Los débitos aumentan la deuda del cliente (facturas, ventas a cuenta corriente, cargos)
    const tipo = String(this.tipo).trim().toUpperCase();
    return [
      'FACTURA',
      'NOTA_DEBITO',
      'VENTA',
      'CARGO',
      'REMITO',
    ].includes(tipo);
  }

  public esCredito(): boolean {
    // Los créditos disminuyen la deuda (pagos, reversos)
    const tipo = String(this.tipo).trim().toUpperCase();
    return [
      'PAGO_PARCIAL',
      'PAGO_COMPLETO',
      'NOTA_CREDITO',
      'REVERSO',
      'PAGO',
    ].includes(tipo);
  }

  public calcularSaldoActual(saldoAnterior: number): number {
    if (this.esDebito()) {
      return saldoAnterior + this.monto;
    } else {
      return saldoAnterior - this.monto;
    }
  }

  static crear(params: {
    clienteId: string;
    tipo: TipoMovimientoCC;
    fecha: Date;
    monto: number;
    descripcion: string;
    documentoId?: string;
    documentoNumero?: string;
    saldoAnterior?: number;
    observaciones?: string;
    usuarioId?: string;
  }): MovimientoCuentaCorrienteCliente {
    const saldoAnterior = params.saldoAnterior || 0;
    const movimiento = new MovimientoCuentaCorrienteCliente(
      undefined,
      params.clienteId,
      params.tipo,
      params.fecha,
      params.monto,
      params.descripcion,
      params.documentoId,
      params.documentoNumero,
      saldoAnterior,
      0, // Se calculará después
      params.observaciones,
      params.usuarioId,
    );

    // Calcular saldo actual
    const saldoActual = movimiento.calcularSaldoActual(saldoAnterior);
    (movimiento as any).saldoActual = saldoActual;

    return movimiento;
  }
}


