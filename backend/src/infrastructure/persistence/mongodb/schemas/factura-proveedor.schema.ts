import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FacturaProveedorDocument = FacturaProveedorMongo & Document;

@Schema({ collection: 'facturas_proveedores', timestamps: true })
export class FacturaProveedorMongo {
  @Prop({ required: true, unique: true, index: true })
  numero: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Proveedor', index: true })
  proveedorId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true, type: Date })
  fechaVencimiento: Date;

  @Prop({ type: Types.ObjectId, ref: 'RemitoProveedor' })
  remitoId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrdenCompra' })
  ordenCompraId?: Types.ObjectId;

  @Prop({ required: true, default: false, index: true })
  pagada: boolean;

  @Prop({ required: true, default: 0 })
  montoPagado: number;

  @Prop({ type: Date })
  fechaPago?: Date;

  @Prop()
  observaciones?: string;
}

export const FacturaProveedorSchema = SchemaFactory.createForClass(FacturaProveedorMongo);

// Índices adicionales
FacturaProveedorSchema.index({ proveedorId: 1, fecha: -1 });
FacturaProveedorSchema.index({ pagada: 1, fechaVencimiento: 1 });
FacturaProveedorSchema.index({ fechaVencimiento: 1 });





