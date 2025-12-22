import { FuentePrecioProveedorProducto, MonedaPrecio } from '../../domain/entities/precio-proveedor-producto.entity';

export interface PrecioProveedorProductoVigenteItem {
  id: string;
  productoId: string;
  proveedorId: string;
  proveedorNombre: string;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
  moneda: MonedaPrecio;
  fecha: Date;
  fuente: FuentePrecioProveedorProducto;
}

export interface PrecioProveedorProductoHistoricoItem {
  id: string;
  productoId: string;
  proveedorId: string;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
  moneda: MonedaPrecio;
  fecha: Date;
  fuente: FuentePrecioProveedorProducto;
  activo: boolean;
  referenciaTipo?: string;
  referenciaId?: string;
  codigoProducto?: string;
  nombreProducto?: string;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPrecioProveedorProductoRepository {
  findVigentesByProducto(productoId: string): Promise<PrecioProveedorProductoVigenteItem[]>;
  findHistorico(productoId: string, proveedorId: string): Promise<PrecioProveedorProductoHistoricoItem[]>;
}


