import { ComprobanteFiscalDomainException } from '../exceptions/comprobante-fiscal.exception';
import { ItemFiscal } from './item-fiscal.vo';

export type TotalesFiscalesSnapshot = Readonly<{
  netoGravado: number;
  ivaTotal: number;
  exento: number;
  noGravado: number;
  otrosTributos: number;
  total: number;
}>;

export class TotalesFiscales {
  private constructor(private readonly snapshot: TotalesFiscalesSnapshot) {
    this.validate(snapshot);
  }

  static crear(params: TotalesFiscalesSnapshot): TotalesFiscales {
    return new TotalesFiscales({ ...params });
  }

  static desdeItems(params: {
    items: ItemFiscal[];
    exento?: number;
    noGravado?: number;
    otrosTributos?: number;
  }): TotalesFiscales {
    const netoGravado = redondear2(params.items.reduce((acc, it) => acc + it.calcularNeto(), 0));
    const ivaTotal = redondear2(params.items.reduce((acc, it) => acc + it.calcularIva(), 0));
    const exento = redondear2(params.exento ?? 0);
    const noGravado = redondear2(params.noGravado ?? 0);
    const otrosTributos = redondear2(params.otrosTributos ?? 0);
    const total = redondear2(netoGravado + ivaTotal + exento + noGravado + otrosTributos);

    return new TotalesFiscales({
      netoGravado,
      ivaTotal,
      exento,
      noGravado,
      otrosTributos,
      total,
    });
  }

  toSnapshot(): TotalesFiscalesSnapshot {
    return { ...this.snapshot };
  }

  get netoGravado(): number {
    return this.snapshot.netoGravado;
  }
  get ivaTotal(): number {
    return this.snapshot.ivaTotal;
  }
  get exento(): number {
    return this.snapshot.exento;
  }
  get noGravado(): number {
    return this.snapshot.noGravado;
  }
  get otrosTributos(): number {
    return this.snapshot.otrosTributos;
  }
  get total(): number {
    return this.snapshot.total;
  }

  private validate(s: TotalesFiscalesSnapshot): void {
    const campos = ['netoGravado', 'ivaTotal', 'exento', 'noGravado', 'otrosTributos', 'total'] as const;
    for (const c of campos) {
      const v = s[c];
      if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) {
        throw new ComprobanteFiscalDomainException(`El total fiscal "${c}" no es un número válido`);
      }
      if (v < 0) {
        throw new ComprobanteFiscalDomainException(`El total fiscal "${c}" no puede ser negativo`);
      }
    }

    const totalCalc = redondear2(s.netoGravado + s.ivaTotal + s.exento + s.noGravado + s.otrosTributos);
    if (Math.abs(totalCalc - redondear2(s.total)) > 0.01) {
      throw new ComprobanteFiscalDomainException(
        `El total fiscal (${s.total}) no coincide con la suma de componentes (${totalCalc})`,
      );
    }
  }
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}






