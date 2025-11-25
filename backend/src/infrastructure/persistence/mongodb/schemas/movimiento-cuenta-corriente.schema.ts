import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TipoMovimientoCC } from '../../../../domain/enums/tipo-movimiento-cc.enum';

export type MovimientoCuentaCorrienteDocument = MovimientoCuentaCorrienteMongo & Document;

@Schema({ collection: 'movimientos_cuenta_corriente', timestamps: true })
export class MovimientoCuentaCorrienteMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Proveedor', index: true })
  proveedorId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TipoMovimientoCC), index: true })
  tipo: string;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true })
  descripcion: string;

  @Prop()
  documentoId?: string;

  @Prop()
  documentoNumero?: string;

  @Prop({ required: true, default: 0 })
  saldoAnterior: number;

  @Prop({ required: true, default: 0 })
  saldoActual: number;

  @Prop()
  observaciones?: string;
}

export const MovimientoCuentaCorrienteSchema = SchemaFactory.createForClass(MovimientoCuentaCorrienteMongo);

// Índices adicionales
MovimientoCuentaCorrienteSchema.index({ proveedorId: 1, fecha: -1 });
MovimientoCuentaCorrienteSchema.index({ tipo: 1, fecha: -1 });


