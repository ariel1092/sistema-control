import { CuentaBancaria } from '../enums/cuenta-bancaria.enum';

export class RetiroSocio {
  constructor(
    public readonly id: string | undefined,
    public readonly fecha: Date,
    public readonly cuentaBancaria: CuentaBancaria,
    public readonly monto: number,
    public readonly descripcion: string,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.monto <= 0) {
      throw new Error('El monto del retiro debe ser mayor a cero');
    }
    if (!this.descripcion || this.descripcion.trim().length === 0) {
      throw new Error('La descripción del retiro es obligatoria');
    }
    if (!Object.values(CuentaBancaria).includes(this.cuentaBancaria)) {
      throw new Error('La cuenta bancaria no es válida');
    }
  }

  static crear(params: {
    fecha: Date;
    cuentaBancaria: CuentaBancaria;
    monto: number;
    descripcion: string;
    observaciones?: string;
  }): RetiroSocio {
    return new RetiroSocio(
      undefined,
      params.fecha,
      params.cuentaBancaria,
      params.monto,
      params.descripcion,
      params.observaciones,
    );
  }
}


