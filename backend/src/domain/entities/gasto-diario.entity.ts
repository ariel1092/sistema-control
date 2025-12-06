export enum CategoriaGasto {
  FLETE = 'FLETE',
  SNACK = 'SNACK',
  MANTENIMIENTO = 'MANTENIMIENTO',
  LIMPIEZA = 'LIMPIEZA',
  OTROS = 'OTROS',
}

export enum MetodoPagoGasto {
  EFECTIVO = 'EFECTIVO',
  CAJA = 'CAJA',
  MERCADOPAGO = 'MERCADOPAGO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

export class GastoDiario {
  constructor(
    public readonly id: string | undefined,
    public readonly fecha: Date,
    public readonly categoria: CategoriaGasto,
    public readonly monto: number,
    public readonly descripcion: string,
    public readonly empleadoNombre?: string,
    public readonly metodoPago: MetodoPagoGasto = MetodoPagoGasto.EFECTIVO,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.monto <= 0) {
      throw new Error('El monto del gasto debe ser mayor a cero');
    }
    if (!this.descripcion || this.descripcion.trim().length === 0) {
      throw new Error('La descripción del gasto es obligatoria');
    }
    if (!Object.values(CategoriaGasto).includes(this.categoria)) {
      throw new Error('La categoría del gasto no es válida');
    }
    if (!Object.values(MetodoPagoGasto).includes(this.metodoPago)) {
      throw new Error('El método de pago del gasto no es válido');
    }
  }

  static crear(params: {
    fecha: Date;
    categoria: CategoriaGasto;
    monto: number;
    descripcion: string;
    empleadoNombre?: string;
    metodoPago?: MetodoPagoGasto;
    observaciones?: string;
  }): GastoDiario {
    return new GastoDiario(
      undefined,
      params.fecha,
      params.categoria,
      params.monto,
      params.descripcion,
      params.empleadoNombre,
      params.metodoPago || MetodoPagoGasto.EFECTIVO,
      params.observaciones,
    );
  }
}









