import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MovimientoCajaDocument = MovimientoCajaMongo & Document;

@Schema({ collection: 'movimientos_caja', timestamps: true })
export class MovimientoCajaMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'CierreCaja', index: true })
  cierreCajaId: Types.ObjectId;

  @Prop({ required: true, enum: ['INGRESO', 'SALIDA'] })
  tipo: string;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true })
  motivo: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario', index: true })
  usuarioId: Types.ObjectId;
}

export const MovimientoCajaSchema = SchemaFactory.createForClass(MovimientoCajaMongo);

