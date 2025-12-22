import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PrecioProveedorProductoDocument = PrecioProveedorProductoMongo & Document;

export enum FuentePrecioProveedorProducto {
  MANUAL = 'MANUAL',
  FACTURA_PROVEEDOR = 'FACTURA_PROVEEDOR',
  ORDEN_COMPRA = 'ORDEN_COMPRA',
}

export enum MonedaPrecio {
  ARS = 'ARS',
  USD = 'USD',
}

@Schema({ collection: 'precio_proveedor_producto', timestamps: true })
export class PrecioProveedorProductoMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Producto', index: true })
  productoId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Proveedor', index: true })
  proveedorId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  precioUnitario: number;

  @Prop({ required: true, default: MonedaPrecio.ARS, enum: Object.values(MonedaPrecio) })
  moneda: string;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  descuentoPct: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  ivaPct: number;

  @Prop({ required: true, type: Date, default: () => new Date() })
  fecha: Date;

  @Prop({ required: true, enum: Object.values(FuentePrecioProveedorProducto) })
  fuente: string;

  @Prop({ required: false })
  referenciaTipo?: string; // ej: 'FACTURA_PROVEEDOR' | 'ORDEN_COMPRA' | 'REMOTO' | etc

  @Prop({ required: false })
  referenciaId?: string; // id externo o interno del documento

  @Prop({ required: false })
  codigoProducto?: string;

  @Prop({ required: false })
  nombreProducto?: string;

  @Prop({ required: true, default: true })
  activo: boolean;

  @Prop({ required: false })
  observaciones?: string;
}

export const PrecioProveedorProductoSchema = SchemaFactory.createForClass(PrecioProveedorProductoMongo);

// Índices obligatorios
PrecioProveedorProductoSchema.index({ productoId: 1, proveedorId: 1, fecha: -1 });
PrecioProveedorProductoSchema.index({ activo: 1, productoId: 1, proveedorId: 1 });

// Índice unique parcial: solo cuando referenciaId existe
PrecioProveedorProductoSchema.index(
  { productoId: 1, proveedorId: 1, fuente: 1, referenciaId: 1 },
  { unique: true, partialFilterExpression: { referenciaId: { $exists: true, $ne: null } } },
);


