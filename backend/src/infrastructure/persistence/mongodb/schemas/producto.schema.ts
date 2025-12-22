import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductoDocument = ProductoMongo & Document;

@Schema({ collection: 'productos', timestamps: true })
export class ProductoMongo {
  @Prop({ required: true, unique: true, index: true })
  codigo: string;

  @Prop({ required: true, index: true })
  nombre: string;

  @Prop({ required: false })
  descripcion?: string;

  @Prop({ required: true, index: true })
  categoria: string;

  @Prop({ type: Types.ObjectId, ref: 'Proveedor', required: false, index: true })
  proveedorId?: Types.ObjectId;

  @Prop({ required: false })
  marca?: string;

  @Prop({ required: true })
  precioVenta: number;

  @Prop({ required: false })
  precioCosto?: number;

  @Prop({ required: true })
  stockActual: number;

  @Prop({ required: true })
  stockMinimo: number;

  @Prop({ required: true })
  unidadMedida: string;

  @Prop({ required: true, default: true, index: true })
  activo: boolean;

  @Prop({ required: true, default: 0 })
  descuento: number;

  @Prop({ required: true, default: 21 })
  iva: number;

  @Prop({ required: false, index: true })
  codigoBarras?: string;
}

export const ProductoSchema = SchemaFactory.createForClass(ProductoMongo);

// Índices adicionales
ProductoSchema.index({ nombre: 'text', descripcion: 'text' });
ProductoSchema.index({ activo: 1, categoria: 1 });











