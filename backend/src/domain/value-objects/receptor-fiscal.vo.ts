import { ComprobanteFiscalDomainException } from '../exceptions/comprobante-fiscal.exception';

export enum TipoDocumentoFiscal {
  DNI = 'DNI',
  CUIT = 'CUIT',
  CUIL = 'CUIL',
  PASAPORTE = 'PASAPORTE',
  OTRO = 'OTRO',
  SIN_IDENTIFICAR = 'SIN_IDENTIFICAR', // consumidor final sin datos
}

export type ReceptorFiscalSnapshot = Readonly<{
  nombreRazonSocial: string;
  tipoDocumento: TipoDocumentoFiscal;
  numeroDocumento?: string;
  domicilio?: string;
}>;

export class ReceptorFiscal {
  private constructor(private readonly snapshot: ReceptorFiscalSnapshot) {
    this.validate(snapshot);
  }

  static consumidorFinal(nombre: string = 'CONSUMIDOR FINAL'): ReceptorFiscal {
    return new ReceptorFiscal({
      nombreRazonSocial: nombre,
      tipoDocumento: TipoDocumentoFiscal.SIN_IDENTIFICAR,
      numeroDocumento: undefined,
      domicilio: undefined,
    });
  }

  static crear(params: {
    nombreRazonSocial: string;
    tipoDocumento: TipoDocumentoFiscal;
    numeroDocumento?: string;
    domicilio?: string;
  }): ReceptorFiscal {
    return new ReceptorFiscal({
      nombreRazonSocial: params.nombreRazonSocial,
      tipoDocumento: params.tipoDocumento,
      numeroDocumento: params.numeroDocumento,
      domicilio: params.domicilio,
    });
  }

  toSnapshot(): ReceptorFiscalSnapshot {
    return { ...this.snapshot };
  }

  get nombreRazonSocial(): string {
    return this.snapshot.nombreRazonSocial;
  }

  get tipoDocumento(): TipoDocumentoFiscal {
    return this.snapshot.tipoDocumento;
  }

  get numeroDocumento(): string | undefined {
    return this.snapshot.numeroDocumento;
  }

  get domicilio(): string | undefined {
    return this.snapshot.domicilio;
  }

  private validate(s: ReceptorFiscalSnapshot): void {
    if (!s.nombreRazonSocial || s.nombreRazonSocial.trim().length === 0) {
      throw new ComprobanteFiscalDomainException('El nombre/razón social del receptor es obligatorio');
    }

    if (!Object.values(TipoDocumentoFiscal).includes(s.tipoDocumento)) {
      throw new ComprobanteFiscalDomainException('El tipo de documento del receptor no es válido');
    }

    if (s.tipoDocumento !== TipoDocumentoFiscal.SIN_IDENTIFICAR) {
      if (!s.numeroDocumento || s.numeroDocumento.trim().length === 0) {
        throw new ComprobanteFiscalDomainException('El número de documento del receptor es obligatorio');
      }
      // Validación básica: números y letras permitidos (sin AFIP)
      if (!/^[0-9A-Za-z\-\.]{6,20}$/.test(s.numeroDocumento.trim())) {
        throw new ComprobanteFiscalDomainException('El número de documento del receptor tiene un formato inválido');
      }
    }
  }
}





