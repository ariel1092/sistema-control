import { ComprobanteFiscalDomainException } from '../exceptions/comprobante-fiscal.exception';

export type ItemFiscalSnapshot = Readonly<{
  productoId?: string;
  codigo?: string;
  descripcion: string;
  unidad?: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje?: number; // 0..100
  alicuotaIva?: number; // ej: 0, 10.5, 21, 27
}>;

export class ItemFiscal {
  private constructor(private readonly snapshot: ItemFiscalSnapshot) {
    this.validate(snapshot);
  }

  static crear(params: ItemFiscalSnapshot): ItemFiscal {
    return new ItemFiscal({
      ...params,
      descuentoPorcentaje: params.descuentoPorcentaje ?? 0,
      alicuotaIva: params.alicuotaIva ?? 21,
    });
  }

  toSnapshot(): ItemFiscalSnapshot {
    return { ...this.snapshot };
  }

  get descripcion(): string {
    return this.snapshot.descripcion;
  }
  get cantidad(): number {
    return this.snapshot.cantidad;
  }
  get precioUnitario(): number {
    return this.snapshot.precioUnitario;
  }
  get descuentoPorcentaje(): number {
    return this.snapshot.descuentoPorcentaje ?? 0;
  }
  get alicuotaIva(): number {
    return this.snapshot.alicuotaIva ?? 21;
  }

  /**
   * Neto gravado (sin IVA) del ítem luego de descuento.
   * Nota: esto asume que `precioUnitario` es neto (sin IVA).
   * Si en tu dominio operativo `precioUnitario` es final con IVA, este VO se deberá ajustar al integrar AFIP.
   */
  calcularNeto(): number {
    const bruto = this.cantidad * this.precioUnitario;
    const desc = bruto * (this.descuentoPorcentaje / 100);
    return redondear2(bruto - desc);
  }

  calcularIva(): number {
    const neto = this.calcularNeto();
    return redondear2(neto * (this.alicuotaIva / 100));
  }

  calcularTotalConIva(): number {
    return redondear2(this.calcularNeto() + this.calcularIva());
  }

  private validate(s: ItemFiscalSnapshot): void {
    if (!s.descripcion || s.descripcion.trim().length === 0) {
      throw new ComprobanteFiscalDomainException('La descripción del ítem fiscal es obligatoria');
    }
    if (typeof s.cantidad !== 'number' || s.cantidad <= 0) {
      throw new ComprobanteFiscalDomainException('La cantidad del ítem fiscal debe ser mayor a 0');
    }
    if (typeof s.precioUnitario !== 'number' || s.precioUnitario < 0) {
      throw new ComprobanteFiscalDomainException('El precio unitario del ítem fiscal no puede ser negativo');
    }
    const d = s.descuentoPorcentaje ?? 0;
    if (d < 0 || d > 100) {
      throw new ComprobanteFiscalDomainException('El descuento del ítem fiscal debe estar entre 0 y 100');
    }
    const a = s.alicuotaIva ?? 21;
    if (a < 0 || a > 100) {
      throw new ComprobanteFiscalDomainException('La alícuota de IVA del ítem fiscal es inválida');
    }
  }
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}






