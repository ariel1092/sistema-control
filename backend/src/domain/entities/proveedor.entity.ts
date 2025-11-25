import { CategoriaProveedor } from '../enums/categoria-proveedor.enum';
import { FormaPagoProveedor } from '../enums/forma-pago-proveedor.enum';

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
    public readonly productosProvee: string[] = [], // Lista de productos o familias
    public readonly condicionesCompra: string = '', // Ej: "30/60 días"
    public readonly formaPagoHabitual: FormaPagoProveedor = FormaPagoProveedor.CUENTA_CORRIENTE,
    public readonly vendedorAsignado?: string,
    public readonly activo: boolean = true,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('El nombre del proveedor es obligatorio');
    }

    if (this.cuit && !this.isValidCUIT(this.cuit)) {
      throw new Error('El CUIT no es válido');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('El email no es válido');
    }
  }

  private isValidCUIT(cuit: string): boolean {
    // Validación básica de CUIT (formato XX-XXXXXXXX-X)
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public calcularDeudaTotal(): number {
    // Este método se calculará desde los movimientos de cuenta corriente
    return 0;
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
    formaPagoHabitual?: FormaPagoProveedor;
    vendedorAsignado?: string;
    activo?: boolean;
    observaciones?: string;
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
    formaPagoHabitual?: FormaPagoProveedor;
    vendedorAsignado?: string;
    activo?: boolean;
    observaciones?: string;
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
      params.formaPagoHabitual || FormaPagoProveedor.CUENTA_CORRIENTE,
      params.vendedorAsignado,
      params.activo !== undefined ? params.activo : true,
      params.observaciones,
    );
  }
}


