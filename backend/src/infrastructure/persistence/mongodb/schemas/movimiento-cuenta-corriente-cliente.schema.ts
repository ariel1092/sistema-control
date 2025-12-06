import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TipoMovimientoCC } from '../../../../domain/enums/tipo-movimiento-cc.enum';

export type MovimientoCuentaCorrienteClienteDocument = MovimientoCuentaCorrienteClienteMongo & Document;

@Schema({ collection: 'movimientos_cuenta_corriente_clientes', timestamps: true })
export class MovimientoCuentaCorrienteClienteMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Cliente', index: true })
  clienteId: Types.ObjectId;

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

  @Prop({ type: Types.ObjectId, ref: 'Usuario', index: true })
  usuarioId?: Types.ObjectId;
}

export const MovimientoCuentaCorrienteClienteSchema = SchemaFactory.createForClass(MovimientoCuentaCorrienteClienteMongo);

// Índices adicionales
MovimientoCuentaCorrienteClienteSchema.index({ clienteId: 1, fecha: -1 });
MovimientoCuentaCorrienteClienteSchema.index({ tipo: 1, fecha: -1 });
MovimientoCuentaCorrienteClienteSchema.index({ documentoId: 1 });


