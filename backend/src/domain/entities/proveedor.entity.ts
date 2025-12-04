export enum CategoriaProveedor {
  FERRETERIA = 'FERRETERIA',
  PLOMERIA = 'PLOMERIA',
  ELECTRICIDAD = 'ELECTRICIDAD',
  CONSTRUCCION = 'CONSTRUCCION',
  PINTURAS = 'PINTURAS',
  HERRAMIENTAS = 'HERRAMIENTAS',
  SEGURIDAD = 'SEGURIDAD',
  JARDINERIA = 'JARDINERIA',
  OTROS = 'OTROS',
}

export enum FormaPagoHabitual {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  MERCADOPAGO = 'MERCADOPAGO',
  CUENTA_CORRIENTE = 'CUENTA_CORRIENTE',
  CHEQUE = 'CHEQUE',
}

export class Proveedor {
  constructor(
    public readonly id: string | undefined,
    public readonly nombre: string,
    public readonly razonSocial?: string,
    public readonly cuit?: string,
    public readonly domicilio?: string,
    public readonly telefono?: string,
    public readonly email?: string,
    public readonly categoria: CategoriaProveedor = CategoriaProveedor.OTROS,
    public readonly productosProvee: string[] = [],
    public readonly condicionesCompra: string = '',
    public readonly formaPagoHabitual: FormaPagoHabitual = FormaPagoHabitual.EFECTIVO,
    public readonly vendedorAsignado?: string,
    public readonly activo: boolean = true,
    public readonly observaciones?: string,
    public readonly plazoCuentaCorriente?: string,
    public readonly descuento?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('El nombre del proveedor es obligatorio');
    }
  }

  public actualizarDatos(params: {
    nombre?: string;
    razonSocial?: string;
    cuit?: string;
    domicilio?: string;
    telefono?: string;
    email?: string;
    categoria?: CategoriaProveedor;
    productosProvee?: string[];
    condicionesCompra?: string;
    formaPagoHabitual?: FormaPagoHabitual;
    vendedorAsignado?: string;
    activo?: boolean;
    observaciones?: string;
    plazoCuentaCorriente?: string;
    descuento?: number;
  }): void {
    if (params.nombre !== undefined) {
      (this as any).nombre = params.nombre;
    }
    if (params.razonSocial !== undefined) {
      (this as any).razonSocial = params.razonSocial;
    }
    if (params.cuit !== undefined) {
      (this as any).cuit = params.cuit;
    }
    if (params.domicilio !== undefined) {
      (this as any).domicilio = params.domicilio;
    }
    if (params.telefono !== undefined) {
      (this as any).telefono = params.telefono;
    }
    if (params.email !== undefined) {
      (this as any).email = params.email;
    }
    if (params.categoria !== undefined) {
      (this as any).categoria = params.categoria;
    }
    if (params.productosProvee !== undefined) {
      (this as any).productosProvee = params.productosProvee;
    }
    if (params.condicionesCompra !== undefined) {
      (this as any).condicionesCompra = params.condicionesCompra;
    }
    if (params.formaPagoHabitual !== undefined) {
      (this as any).formaPagoHabitual = params.formaPagoHabitual;
    }
    if (params.vendedorAsignado !== undefined) {
      (this as any).vendedorAsignado = params.vendedorAsignado;
    }
    if (params.activo !== undefined) {
      (this as any).activo = params.activo;
    }
    if (params.observaciones !== undefined) {
      (this as any).observaciones = params.observaciones;
    }
    if (params.plazoCuentaCorriente !== undefined) {
      (this as any).plazoCuentaCorriente = params.plazoCuentaCorriente;
    }
    if (params.descuento !== undefined) {
      (this as any).descuento = params.descuento;
    }
    this.validate();
  }

  static crear(params: {
    nombre: string;
    razonSocial?: string;
    cuit?: string;
    domicilio?: string;
    telefono?: string;
    email?: string;
    categoria?: CategoriaProveedor;
    productosProvee?: string[];
    condicionesCompra?: string;
    formaPagoHabitual?: FormaPagoHabitual;
    vendedorAsignado?: string;
    activo?: boolean;
    observaciones?: string;
    plazoCuentaCorriente?: string;
    descuento?: number;
  }): Proveedor {
    return new Proveedor(
      undefined,
      params.nombre,
      params.razonSocial,
      params.cuit,
      params.domicilio,
      params.telefono,
      params.email,
      params.categoria || CategoriaProveedor.OTROS,
      params.productosProvee || [],
      params.condicionesCompra || '',
      params.formaPagoHabitual || FormaPagoHabitual.EFECTIVO,
      params.vendedorAsignado,
      params.activo !== undefined ? params.activo : true,
      params.observaciones,
      params.plazoCuentaCorriente,
      params.descuento,
    );
  }
}
