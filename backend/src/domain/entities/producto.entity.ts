import { ProductoDomainException } from '../exceptions/producto.exception';

export class Producto {
  constructor(
    public readonly id: string | undefined,
    public readonly codigo: string,
    public readonly nombre: string,
    public readonly categoria: string,
    public precioVenta: number,
    public stockActual: number,
    public stockMinimo: number,
    public readonly unidadMedida: string,
    public activo: boolean = true,
    public readonly descripcion?: string,
    public readonly marca?: string,
    public precioCosto?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.codigo || this.codigo.trim() === '') {
      throw new ProductoDomainException('El código del producto es obligatorio');
    }

    if (!this.nombre || this.nombre.trim() === '') {
      throw new ProductoDomainException('El nombre del producto es obligatorio');
    }

    if (!this.categoria || this.categoria.trim() === '') {
      throw new ProductoDomainException(
        'La categoría del producto es obligatoria',
      );
    }

    if (this.precioVenta < 0) {
      throw new ProductoDomainException(
        'El precio de venta no puede ser negativo',
      );
    }

    if (this.stockActual < 0) {
      throw new ProductoDomainException('El stock actual no puede ser negativo');
    }

    if (this.stockMinimo < 0) {
      throw new ProductoDomainException(
        'El stock mínimo no puede ser negativo',
      );
    }

    if (!this.unidadMedida || this.unidadMedida.trim() === '') {
      throw new ProductoDomainException(
        'La unidad de medida es obligatoria',
      );
    }
  }

  public descontar(cantidad: number): void {
    if (cantidad <= 0) {
      throw new ProductoDomainException(
        'La cantidad a descontar debe ser mayor a 0',
      );
    }

    if (this.stockActual < cantidad) {
      throw new ProductoDomainException(
        `Stock insuficiente. Disponible: ${this.stockActual}, Solicitado: ${cantidad}`,
      );
    }

    this.stockActual -= cantidad;
  }

  public reponer(cantidad: number): void {
    if (cantidad <= 0) {
      throw new ProductoDomainException(
        'La cantidad a reponer debe ser mayor a 0',
      );
    }

    this.stockActual += cantidad;
  }

  public actualizarPrecio(nuevoPrecio: number): void {
    if (nuevoPrecio < 0) {
      throw new ProductoDomainException(
        'El precio de venta no puede ser negativo',
      );
    }

    this.precioVenta = nuevoPrecio;
  }

  public marcarActivo(activo: boolean): void {
    this.activo = activo;
  }

  public tieneStockSuficiente(cantidad: number): boolean {
    return this.activo && this.stockActual >= cantidad;
  }

  public estaPorDebajoDelMinimo(): boolean {
    return this.stockActual <= this.stockMinimo;
  }

  static crear(params: {
    codigo: string;
    nombre: string;
    categoria: string;
    precioVenta: number;
    stockActual: number;
    stockMinimo: number;
    unidadMedida: string;
    descripcion?: string;
    marca?: string;
    precioCosto?: number;
    activo?: boolean;
  }): Producto {
    return new Producto(
      undefined,
      params.codigo,
      params.nombre,
      params.categoria,
      params.precioVenta,
      params.stockActual,
      params.stockMinimo,
      params.unidadMedida,
      params.activo !== undefined ? params.activo : true,
      params.descripcion,
      params.marca,
      params.precioCosto,
    );
  }
}

