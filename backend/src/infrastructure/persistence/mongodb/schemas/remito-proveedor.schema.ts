import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RemitoProveedorDocument = RemitoProveedorMongo & Document;

@Schema({ collection: 'remitos_proveedores', timestamps: true })
export class RemitoProveedorMongo {
  @Prop({ required: true, unique: true, index: true })
  numero: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Proveedor', index: true })
  proveedorId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ type: Types.ObjectId, ref: 'OrdenCompra', index: true })
  ordenCompraId?: Types.ObjectId;

  @Prop({ required: true, default: false, index: true })
  facturado: boolean;

  @Prop({ type: Types.ObjectId, ref: 'FacturaProveedor' })
  facturaId?: Types.ObjectId;

  @Prop()
  observaciones?: string;
}

export const RemitoProveedorSchema = SchemaFactory.createForClass(RemitoProveedorMongo);

// Índices adicionales
RemitoProveedorSchema.index({ proveedorId: 1, fecha: -1 });
RemitoProveedorSchema.index({ facturado: 1, fecha: -1 });


