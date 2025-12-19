import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TipoEventoVenta } from '../../../../domain/enums/tipo-evento-venta.enum';

export type MovimientoVentaDocument = MovimientoVentaMongo & Document;

@Schema({ collection: 'movimientos_venta', timestamps: true })
export class MovimientoVentaMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Venta', index: true })
  ventaId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TipoEventoVenta), index: true })
  tipoEvento: string;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: false, index: true })
  usuarioId?: Types.ObjectId;

  @Prop({ required: false })
  observaciones?: string;
}

export const MovimientoVentaSchema = SchemaFactory.createForClass(MovimientoVentaMongo);

MovimientoVentaSchema.index({ ventaId: 1, fecha: -1 });
MovimientoVentaSchema.index({ ventaId: 1, tipoEvento: 1, fecha: -1 });


