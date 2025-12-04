import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DetalleFacturaProveedorDocument = DetalleFacturaProveedorMongo & Document;

@Schema({ collection: 'detalle_facturas_proveedores', timestamps: true })
export class DetalleFacturaProveedorMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'FacturaProveedor', index: true })
  facturaId: Types.ObjectId;

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
  descuento: number;

  @Prop({ required: true, default: 0 })
  iva: number;

  @Prop()
  observaciones?: string;
}

export const DetalleFacturaProveedorSchema = SchemaFactory.createForClass(DetalleFacturaProveedorMongo);





