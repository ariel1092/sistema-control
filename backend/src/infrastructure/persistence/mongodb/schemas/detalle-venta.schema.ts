import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DetalleVentaDocument = DetalleVentaMongo & Document;

@Schema({ collection: 'detalle_ventas', timestamps: true })
export class DetalleVentaMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Venta', index: true })
  ventaId: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, ref: 'Producto', index: true })
  productoId?: Types.ObjectId;

  @Prop({ required: true })
  codigoProducto: string;

  @Prop({ required: true })
  nombreProducto: string;

  @Prop({ required: true })
  cantidad: number;

  @Prop({ required: true })
  precioUnitario: number;

  @Prop({ required: true, default: 0 })
  descuentoItem: number;

  @Prop({ required: true })
  subtotal: number;
}

export const DetalleVentaSchema = SchemaFactory.createForClass(DetalleVentaMongo);

// Índices
DetalleVentaSchema.index({ ventaId: 1 });
DetalleVentaSchema.index({ productoId: 1 });




