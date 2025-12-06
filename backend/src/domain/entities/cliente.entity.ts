export class Cliente {
  constructor(
    public readonly id: string | undefined,
    public readonly nombre: string,
    public readonly razonSocial?: string,
    public readonly dni?: string,
    public readonly telefono?: string,
    public readonly email?: string,
    public readonly direccion?: string,
    public readonly observaciones?: string,
    public readonly tieneCuentaCorriente: boolean = false,
    public saldoCuentaCorriente: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('El nombre del cliente es obligatorio');
    }

    if (this.saldoCuentaCorriente < 0) {
      throw new Error('El saldo de cuenta corriente no puede ser negativo');
    }
  }

  public actualizarSaldo(monto: number): void {
    this.saldoCuentaCorriente += monto;
    if (this.saldoCuentaCorriente < 0) {
      this.saldoCuentaCorriente = 0;
    }
  }

  public actualizarDatos(params: {
    nombre?: string;
    razonSocial?: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    observaciones?: string;
    tieneCuentaCorriente?: boolean;
  }): void {
    if (params.nombre !== undefined) {
      (this as any).nombre = params.nombre;
    }
    if (params.razonSocial !== undefined) {
      (this as any).razonSocial = params.razonSocial;
    }
    if (params.dni !== undefined) {
      (this as any).dni = params.dni;
    }
    if (params.telefono !== undefined) {
      (this as any).telefono = params.telefono;
    }
    if (params.email !== undefined) {
      (this as any).email = params.email;
    }
    if (params.direccion !== undefined) {
      (this as any).direccion = params.direccion;
    }
    if (params.observaciones !== undefined) {
      (this as any).observaciones = params.observaciones;
    }
    if (params.tieneCuentaCorriente !== undefined) {
      (this as any).tieneCuentaCorriente = params.tieneCuentaCorriente;
    }
    this.validate();
  }

  static crear(params: {
    nombre: string;
    razonSocial?: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    observaciones?: string;
    tieneCuentaCorriente?: boolean;
    saldoCuentaCorriente?: number;
  }): Cliente {
    return new Cliente(
      undefined,
      params.nombre,
      params.razonSocial,
      params.dni,
      params.telefono,
      params.email,
      params.direccion,
      params.observaciones,
      params.tieneCuentaCorriente || false,
      params.saldoCuentaCorriente || 0,
    );
  }
}











