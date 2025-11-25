import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EstadoOrdenCompra } from '../../../../domain/enums/estado-orden-compra.enum';

export type OrdenCompraDocument = OrdenCompraMongo & Document;

@Schema({ collection: 'ordenes_compra', timestamps: true })
export class OrdenCompraMongo {
  @Prop({ required: true, unique: true, index: true })
  numero: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Proveedor', index: true })
  proveedorId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ type: Date })
  fechaEstimadaEntrega?: Date;

  @Prop({ required: true, enum: Object.values(EstadoOrdenCompra), default: EstadoOrdenCompra.PENDIENTE, index: true })
  estado: string;

  @Prop()
  observaciones?: string;

  @Prop({ type: Types.ObjectId, ref: 'RemitoProveedor' })
  remitoId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FacturaProveedor' })
  facturaId?: Types.ObjectId;
}

export const OrdenCompraSchema = SchemaFactory.createForClass(OrdenCompraMongo);

// Índices adicionales
OrdenCompraSchema.index({ proveedorId: 1, fecha: -1 });
OrdenCompraSchema.index({ estado: 1, fecha: -1 });


