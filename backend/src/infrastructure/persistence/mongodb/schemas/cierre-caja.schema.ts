import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CierreCajaDocument = CierreCajaMongo & Document;

@Schema({ collection: 'cierre_cajas', timestamps: true })
export class CierreCajaMongo {
  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario', index: true })
  usuarioId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  totalEfectivo: number;

  @Prop({ required: true, default: 0 })
  totalTarjeta: number;

  @Prop({ required: true, default: 0 })
  totalTransferencia: number;

  @Prop({ required: true, default: 0 })
  totalGeneral: number;

  @Prop({ required: true, default: 0 })
  cantidadVentas: number;

  @Prop({
    required: true,
    enum: ['ABIERTO', 'CERRADO'],
    default: 'ABIERTO',
    index: true,
  })
  estado: string;

  @Prop({ required: false })
  observaciones?: string;
}

export const CierreCajaSchema = SchemaFactory.createForClass(CierreCajaMongo);

// Índices adicionales
CierreCajaSchema.index({ usuarioId: 1, fecha: -1 });
CierreCajaSchema.index({ fecha: -1, estado: 1 });





