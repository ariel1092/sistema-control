import { ComprobanteFiscalDomainException } from '../exceptions/comprobante-fiscal.exception';
import { EstadoComprobanteFiscal } from '../enums/estado-comprobante-fiscal.enum';
import { LetraComprobante } from '../enums/letra-comprobante.enum';
import { TipoComprobanteFiscal } from '../enums/tipo-comprobante-fiscal.enum';
import { ItemFiscal } from '../value-objects/item-fiscal.vo';
import { ReceptorFiscal, ReceptorFiscalSnapshot, TipoDocumentoFiscal } from '../value-objects/receptor-fiscal.vo';
import { TotalesFiscales } from '../value-objects/totales-fiscales.vo';

export type EmisorFiscalSnapshot = Readonly<{
  razonSocial: string;
  cuit: string;
  domicilioFiscal: string;
  condicionIva?: string;
  ingresosBrutos?: string;
  inicioActividades?: string; // ISO date string (sin validación AFIP)
}>;

export class ComprobanteFiscal {
  private constructor(
    public readonly id: string | undefined,
    public readonly ventaId: string,
    public readonly tipo: TipoComprobanteFiscal,
    public readonly letra: LetraComprobante,
    public readonly puntoVenta: number,
    public readonly numero: number, // secuencial interno (AFIP-ready a futuro)
    public readonly fechaEmision: Date,
    public readonly estado: EstadoComprobanteFiscal,
    public readonly emisor: EmisorFiscalSnapshot,
    public readonly receptor: ReceptorFiscalSnapshot,
    public readonly items: ReadonlyArray<ReturnType<ItemFiscal['toSnapshot']>>,
    public readonly totales: ReturnType<TotalesFiscales['toSnapshot']>,
    public readonly autorizadoAt?: Date,
    public readonly anuladoAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();

    // Regla: inmutable una vez AUTORIZADO (aplicamos deepFreeze en runtime)
    if (this.estado === EstadoComprobanteFiscal.AUTORIZADO) {
      deepFreeze(this);
    }
  }

  /**
   * Rehidrata un comprobante desde persistencia.
   * No altera la estructura del dominio; solo permite reconstrucción manteniendo invariantes.
   */
  static rehidratar(params: {
    id: string;
    ventaId: string;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    puntoVenta: number;
    numero: number;
    fechaEmision: Date;
    estado: EstadoComprobanteFiscal;
    emisor: EmisorFiscalSnapshot;
    receptor: ReceptorFiscalSnapshot;
    items: ReadonlyArray<ReturnType<ItemFiscal['toSnapshot']>>;
    totales: ReturnType<TotalesFiscales['toSnapshot']>;
    autorizadoAt?: Date;
    anuladoAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): ComprobanteFiscal {
    return new ComprobanteFiscal(
      params.id,
      params.ventaId,
      params.tipo,
      params.letra,
      params.puntoVenta,
      params.numero,
      params.fechaEmision,
      params.estado,
      { ...params.emisor },
      { ...params.receptor },
      [...params.items],
      { ...params.totales },
      params.autorizadoAt,
      params.anuladoAt,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  static crearBorrador(params: {
    ventaId: string;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
    puntoVenta: number;
    numero: number;
    fechaEmision?: Date;
    emisor: EmisorFiscalSnapshot;
    receptor: ReceptorFiscal | ReceptorFiscalSnapshot;
    items: ItemFiscal[];
    totales?: TotalesFiscales;
  }): ComprobanteFiscal {
    const receptorSnapshot =
      params.receptor instanceof ReceptorFiscal ? params.receptor.toSnapshot() : params.receptor;

    const itemsSnapshots = params.items.map((it) => it.toSnapshot());
    const totales = (params.totales ?? TotalesFiscales.desdeItems({ items: params.items })).toSnapshot();

    return new ComprobanteFiscal(
      undefined,
      params.ventaId,
      params.tipo,
      params.letra,
      params.puntoVenta,
      params.numero,
      params.fechaEmision ?? new Date(),
      EstadoComprobanteFiscal.BORRADOR,
      { ...params.emisor },
      { ...receptorSnapshot },
      itemsSnapshots,
      totales,
      undefined,
      undefined,
    );
  }

  /**
   * PENDIENTE_AFIP: estado interno del sistema, listo para intentar autorización externa (AFIP) en el futuro.
   * No agrega campos de AFIP: solo “cierra” el borrador y lo deja en cola.
   */
  emitir(): ComprobanteFiscal {
    this.assertNotAutorizado();
    if (this.estado !== EstadoComprobanteFiscal.BORRADOR) {
      throw new ComprobanteFiscalDomainException('Solo se puede emitir un comprobante en estado BORRADOR');
    }
    return this.clone({
      estado: EstadoComprobanteFiscal.PENDIENTE_AFIP,
      updatedAt: new Date(),
    });
  }

  /**
   * AUTORIZADO: una vez aquí, la entidad queda inmutable.
   * Sin referencias a AFIP; solo timestamp de autorización.
   */
  autorizar(when: Date = new Date()): ComprobanteFiscal {
    this.assertNotAutorizado();
    if (this.estado !== EstadoComprobanteFiscal.PENDIENTE_AFIP) {
      throw new ComprobanteFiscalDomainException('Solo se puede autorizar un comprobante en estado PENDIENTE_AFIP');
    }
    return this.clone({
      estado: EstadoComprobanteFiscal.AUTORIZADO,
      autorizadoAt: when,
      updatedAt: new Date(),
    });
  }

  anular(when: Date = new Date()): ComprobanteFiscal {
    this.assertNotAutorizado();
    if (this.estado === EstadoComprobanteFiscal.ANULADO) {
      throw new ComprobanteFiscalDomainException('El comprobante fiscal ya está anulado');
    }
    // En esta arquitectura, no anulamos un AUTORIZADO (se debería emitir NC/ND en el futuro).
    if (this.estado === EstadoComprobanteFiscal.AUTORIZADO) {
      throw new ComprobanteFiscalDomainException('Un comprobante AUTORIZADO no se anula: debe emitirse Nota de Crédito/Débito');
    }
    return this.clone({
      estado: EstadoComprobanteFiscal.ANULADO,
      anuladoAt: when,
      updatedAt: new Date(),
    });
  }

  // --------- Helpers ---------

  private clone(patch: Partial<{
    estado: EstadoComprobanteFiscal;
    autorizadoAt?: Date;
    anuladoAt?: Date;
    updatedAt: Date;
  }>): ComprobanteFiscal {
    return new ComprobanteFiscal(
      this.id,
      this.ventaId,
      this.tipo,
      this.letra,
      this.puntoVenta,
      this.numero,
      this.fechaEmision,
      patch.estado ?? this.estado,
      { ...this.emisor },
      { ...this.receptor },
      [...this.items],
      { ...this.totales },
      patch.autorizadoAt ?? this.autorizadoAt,
      patch.anuladoAt ?? this.anuladoAt,
      this.createdAt,
      patch.updatedAt ?? this.updatedAt,
    );
  }

  private assertNotAutorizado(): void {
    if (this.estado === EstadoComprobanteFiscal.AUTORIZADO) {
      throw new ComprobanteFiscalDomainException('El comprobante fiscal está AUTORIZADO y no puede modificarse');
    }
  }

  private validate(): void {
    if (!this.ventaId || this.ventaId.trim().length === 0) {
      throw new ComprobanteFiscalDomainException('El ventaId es obligatorio');
    }
    if (!Object.values(TipoComprobanteFiscal).includes(this.tipo)) {
      throw new ComprobanteFiscalDomainException('El tipo de comprobante fiscal no es válido');
    }
    if (!Object.values(LetraComprobante).includes(this.letra)) {
      throw new ComprobanteFiscalDomainException('La letra del comprobante fiscal no es válida');
    }
    if (!Object.values(EstadoComprobanteFiscal).includes(this.estado)) {
      throw new ComprobanteFiscalDomainException('El estado del comprobante fiscal no es válido');
    }

    if (!Number.isInteger(this.puntoVenta) || this.puntoVenta <= 0) {
      throw new ComprobanteFiscalDomainException('El punto de venta debe ser un entero mayor a 0');
    }
    if (!Number.isInteger(this.numero) || this.numero <= 0) {
      throw new ComprobanteFiscalDomainException('El número del comprobante debe ser un entero mayor a 0');
    }

    if (!(this.fechaEmision instanceof Date) || Number.isNaN(this.fechaEmision.getTime())) {
      throw new ComprobanteFiscalDomainException('La fecha de emisión es inválida');
    }

    // Snapshot emisor (sin AFIP, pero campos mínimos para factura profesional)
    if (!this.emisor?.razonSocial || this.emisor.razonSocial.trim().length === 0) {
      throw new ComprobanteFiscalDomainException('El emisor debe tener razón social');
    }
    if (!this.emisor?.cuit || !/^\d{11}$/.test(this.emisor.cuit)) {
      throw new ComprobanteFiscalDomainException('El emisor debe tener CUIT válido (11 dígitos)');
    }
    if (!this.emisor?.domicilioFiscal || this.emisor.domicilioFiscal.trim().length === 0) {
      throw new ComprobanteFiscalDomainException('El emisor debe tener domicilio fiscal');
    }

    // Receptor snapshot básico
    const receptorVo = ReceptorFiscal.crear({
      nombreRazonSocial: this.receptor?.nombreRazonSocial,
      tipoDocumento: this.receptor?.tipoDocumento as any,
      numeroDocumento: this.receptor?.numeroDocumento,
      domicilio: this.receptor?.domicilio,
    });

    // Validaciones mínimas por letra (AFIP-ready, sin reglas completas)
    if (this.letra === LetraComprobante.A) {
      if (receptorVo.tipoDocumento !== TipoDocumentoFiscal.CUIT) {
        throw new ComprobanteFiscalDomainException('Para comprobante letra A el receptor debe identificarse con CUIT');
      }
    }

    // Items / totales
    if (!this.items || this.items.length === 0) {
      throw new ComprobanteFiscalDomainException('El comprobante fiscal debe tener al menos un ítem');
    }
    // Revalidar items creando VOs (asegura consistencia)
    const itemsVo = this.items.map((i) => ItemFiscal.crear(i as any));
    const totalesCalc = TotalesFiscales.desdeItems({ items: itemsVo }).toSnapshot();

    if (Math.abs(totalesCalc.total - redondear2(this.totales.total)) > 0.01) {
      throw new ComprobanteFiscalDomainException(
        `Los totales no coinciden (esperado ${totalesCalc.total}, recibido ${this.totales.total})`,
      );
    }

    // Estado vs timestamps
    if (this.estado === EstadoComprobanteFiscal.AUTORIZADO && !this.autorizadoAt) {
      throw new ComprobanteFiscalDomainException('Un comprobante AUTORIZADO debe tener autorizadoAt');
    }
    if (this.estado !== EstadoComprobanteFiscal.AUTORIZADO && this.autorizadoAt) {
      throw new ComprobanteFiscalDomainException('Solo un comprobante AUTORIZADO puede tener autorizadoAt');
    }
  }
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyObj: any = obj;
  for (const key of Object.getOwnPropertyNames(anyObj)) {
    const value = anyObj[key];
    if (value && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}


