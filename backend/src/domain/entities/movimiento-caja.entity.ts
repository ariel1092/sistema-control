export enum TipoMovimientoCaja {
  INGRESO = 'INGRESO',
  SALIDA = 'SALIDA',
}

export class MovimientoCaja {
  constructor(
    public readonly id: string | undefined,
    public readonly cierreCajaId: string,
    public readonly tipo: TipoMovimientoCaja,
    public readonly monto: number,
    public readonly motivo: string,
    public readonly usuarioId: string,
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
  }

  static crear(params: {
    cierreCajaId: string;
    tipo: TipoMovimientoCaja;
    monto: number;
    motivo: string;
    usuarioId: string;
  }): MovimientoCaja {
    return new MovimientoCaja(
      undefined,
      params.cierreCajaId,
      params.tipo,
      params.monto,
      params.motivo,
      params.usuarioId,
    );
  }
}

