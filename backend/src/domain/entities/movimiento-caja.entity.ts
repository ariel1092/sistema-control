export enum TipoMovimientoCaja {
  INGRESO = 'INGRESO',
  SALIDA = 'SALIDA',
}

export enum OrigenMovimientoCaja {
  MANUAL = 'MANUAL',
  VENTA = 'VENTA',
  REVERSO_VENTA = 'REVERSO_VENTA',
}

export class MovimientoCaja {
  constructor(
    public readonly id: string | undefined,
    public readonly cierreCajaId: string,
    public readonly tipo: TipoMovimientoCaja,
    public readonly monto: number,
    public readonly motivo: string,
    public readonly usuarioId: string,
    public readonly origen: OrigenMovimientoCaja = OrigenMovimientoCaja.MANUAL,
    public readonly metodoPago?: string,
    public readonly referencia?: string,
    public readonly cuentaBancaria?: string,
    public readonly recargo?: number,
    public readonly ventaId?: string,
    public readonly ventaNumero?: string,
    public readonly comprobanteFiscalId?: string,
    public readonly createdAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.cierreCajaId) {
      throw new Error('El ID de cierre de caja es obligatorio');
    }

    if (!this.tipo) {
      throw new Error('El tipo de movimiento es obligatorio');
    }

    if (this.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (!this.motivo || this.motivo.trim().length === 0) {
      throw new Error('El motivo es obligatorio');
    }

    if (!this.usuarioId) {
      throw new Error('El usuario es obligatorio');
    }

    if (!Object.values(OrigenMovimientoCaja).includes(this.origen)) {
      throw new Error('El origen del movimiento no es válido');
    }

    if (this.origen !== OrigenMovimientoCaja.MANUAL) {
      if (!this.ventaId) {
        throw new Error('Un movimiento de caja por venta requiere ventaId');
      }
      if (!this.metodoPago) {
        throw new Error('Un movimiento de caja por venta requiere metodoPago');
      }
      if (this.metodoPago === 'CUENTA_CORRIENTE') {
        throw new Error('CUENTA_CORRIENTE no debe generar movimiento de caja');
      }
    }
  }

  static crear(params: {
    cierreCajaId: string;
    tipo: TipoMovimientoCaja;
    monto: number;
    motivo: string;
    usuarioId: string;
    origen?: OrigenMovimientoCaja;
    metodoPago?: string;
    referencia?: string;
    cuentaBancaria?: string;
    recargo?: number;
    ventaId?: string;
    ventaNumero?: string;
    comprobanteFiscalId?: string;
  }): MovimientoCaja {
    return new MovimientoCaja(
      undefined,
      params.cierreCajaId,
      params.tipo,
      params.monto,
      params.motivo,
      params.usuarioId,
      params.origen ?? OrigenMovimientoCaja.MANUAL,
      params.metodoPago,
      params.referencia,
      params.cuentaBancaria,
      params.recargo,
      params.ventaId,
      params.ventaNumero,
      params.comprobanteFiscalId,
    );
  }
}

