import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DetalleRemitoDocument = DetalleRemitoMongo & Document;

@Schema({ collection: 'detalle_remitos', timestamps: true })
export class DetalleRemitoMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'RemitoProveedor', index: true })
  remitoId: Types.ObjectId;

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

  @Prop()
  observaciones?: string;
}

export const DetalleRemitoSchema = SchemaFactory.createForClass(DetalleRemitoMongo);


