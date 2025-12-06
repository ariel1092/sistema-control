import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FacturaClienteDocument = FacturaClienteMongo & Document;

@Schema({ collection: 'facturas_clientes', timestamps: true })
export class FacturaClienteMongo {
  @Prop({ required: true, unique: true, index: true })
  numero: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Cliente', index: true })
  clienteId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true, type: Date })
  fechaVencimiento: Date;

  @Prop({ required: true })
  montoTotal: number;

  @Prop({ required: true, default: 0 })
  montoPagado: number;

  @Prop({ required: true, default: false, index: true })
  pagada: boolean;

  @Prop({ type: Date })
  fechaPago?: Date;

  @Prop()
  descripcion?: string;

  @Prop()
  observaciones?: string;

  @Prop({ type: Types.ObjectId, ref: 'Venta' })
  ventaId?: Types.ObjectId;
}

export const FacturaClienteSchema = SchemaFactory.createForClass(FacturaClienteMongo);

// Índices adicionales
FacturaClienteSchema.index({ clienteId: 1, fecha: -1 });
FacturaClienteSchema.index({ pagada: 1, fechaVencimiento: 1 });
FacturaClienteSchema.index({ fechaVencimiento: 1 });


