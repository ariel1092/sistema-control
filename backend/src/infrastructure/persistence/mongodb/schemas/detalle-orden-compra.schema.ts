import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DetalleOrdenCompraDocument = DetalleOrdenCompraMongo & Document;

@Schema({ collection: 'detalle_ordenes_compra', timestamps: true })
export class DetalleOrdenCompraMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'OrdenCompra', index: true })
  ordenCompraId: Types.ObjectId;

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
  cantidadRecibida: number;

  @Prop()
  observaciones?: string;
}

export const DetalleOrdenCompraSchema = SchemaFactory.createForClass(DetalleOrdenCompraMongo);





