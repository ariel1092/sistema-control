import { TipoComprobanteFiscal } from '../enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../enums/letra-comprobante.enum';

export class NumeradorFiscal {
  private constructor(
    public readonly id: string | undefined,
    public readonly puntoVenta: number,
    public readonly tipo: TipoComprobanteFiscal,
    public readonly letra: LetraComprobante,
    public readonly ultimoNumero: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static crearInicial(params: {
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    ultimoNumero?: number; // default 0
  }): NumeradorFiscal {
    return new NumeradorFiscal(
      undefined,
      params.puntoVenta,
      params.tipo,
      params.letra,
      params.ultimoNumero ?? 0,
    );
  }

  static rehidratar(params: {
    id: string;
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    ultimoNumero: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): NumeradorFiscal {
    return new NumeradorFiscal(
      params.id,
      params.puntoVenta,
      params.tipo,
      params.letra,
      params.ultimoNumero,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  /**
   * Devuelve el próximo número secuencial (ultimoNumero + 1).
   * Nota: la persistencia/concurrencia se garantiza en el repositorio con operación atómica.
   */
  public calcularSiguiente(): number {
    return this.ultimoNumero + 1;
  }

  private validate(): void {
    if (!Number.isInteger(this.puntoVenta) || this.puntoVenta <= 0) {
      throw new Error('El punto de venta debe ser un entero mayor a 0');
    }
    if (!Object.values(TipoComprobanteFiscal).includes(this.tipo)) {
      throw new Error('El tipo de comprobante fiscal no es válido');
    }
    if (!Object.values(LetraComprobante).includes(this.letra)) {
      throw new Error('La letra del comprobante no es válida');
    }
    if (!Number.isInteger(this.ultimoNumero) || this.ultimoNumero < 0) {
      throw new Error('El último número debe ser un entero mayor o igual a 0');
    }
  }
}





