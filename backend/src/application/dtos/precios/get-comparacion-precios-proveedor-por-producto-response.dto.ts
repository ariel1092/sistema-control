import { FuentePrecioProveedorProducto } from '../../../domain/entities/precio-proveedor-producto.entity';

export interface GetComparacionPreciosProveedorPorProductoItemDto {
  proveedorId: string;
  proveedorNombre: string;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
  precioNeto: number;
  precioFinal: number;
  fecha: Date;
  fuente: FuentePrecioProveedorProducto;
}

export interface GetComparacionPreciosProveedorPorProductoResponseDto {
  productoId: string;
  items: GetComparacionPreciosProveedorPorProductoItemDto[];
}


