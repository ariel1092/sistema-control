import { TipoMetodoPago } from '../enums/tipo-metodo-pago.enum';
import { CuentaBancaria } from '../enums/cuenta-bancaria.enum';
import { VentaDomainException } from '../exceptions/venta.exception';

export class MetodoPago {
  constructor(
    public readonly tipo: TipoMetodoPago,
    public readonly monto: number,
    public readonly referencia?: string,
    public readonly cuentaBancaria?: CuentaBancaria, // Para transferencias
    public readonly recargo?: number, // Recargo aplicado (para crédito)
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.monto <= 0) {
      throw new VentaDomainException(
        'El monto del método de pago debe ser mayor a 0',
      );
    }

    if (
      (this.tipo === TipoMetodoPago.TARJETA ||
        this.tipo === TipoMetodoPago.TRANSFERENCIA) &&
      !this.referencia
    ) {
      throw new VentaDomainException(
        `El método de pago ${this.tipo} requiere número de referencia`,
      );
    }

    if (
      this.tipo === TipoMetodoPago.TRANSFERENCIA &&
      !this.cuentaBancaria
    ) {
      throw new VentaDomainException(
        'El método de pago TRANSFERENCIA requiere especificar la cuenta bancaria',
      );
    }
  }

  static efectivo(monto: number): MetodoPago {
    return new MetodoPago(TipoMetodoPago.EFECTIVO, monto);
  }

  static tarjeta(monto: number, referencia: string): MetodoPago {
    return new MetodoPago(TipoMetodoPago.TARJETA, monto, referencia);
  }

  static transferencia(
    monto: number,
    referencia: string,
    cuentaBancaria: CuentaBancaria,
  ): MetodoPago {
    return new MetodoPago(
      TipoMetodoPago.TRANSFERENCIA,
      monto,
      referencia,
      cuentaBancaria,
    );
  }

  static debito(monto: number, recargo?: number): MetodoPago {
    // Débito puede tener recargo del 5% en casos específicos
    return new MetodoPago(TipoMetodoPago.DEBITO, monto, undefined, undefined, recargo);
  }

  static credito(monto: number, recargo: number = 10): MetodoPago {
    // Crédito siempre lleva 10% por defecto
    return new MetodoPago(TipoMetodoPago.CREDITO, monto, undefined, undefined, recargo);
  }

  static cuentaCorriente(monto: number): MetodoPago {
    return new MetodoPago(TipoMetodoPago.CUENTA_CORRIENTE, monto);
  }

  toPlainObject(): {
    tipo: TipoMetodoPago;
    monto: number;
    referencia?: string;
    cuentaBancaria?: CuentaBancaria;
    recargo?: number;
  } {
    return {
      tipo: this.tipo,
      monto: this.monto,
      referencia: this.referencia,
      cuentaBancaria: this.cuentaBancaria,
      recargo: this.recargo,
    };
  }
}

