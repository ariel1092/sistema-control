import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CierreCajaDocument = CierreCajaMongo & Document;

function normalizarInicioDiaUTC(value: Date): Date {
  if (!value) return value as any;
  const d = new Date(value);
  // Día de negocio: usar calendario local (no UTC) para evitar corrimiento del día.
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

@Schema({ collection: 'cierre_cajas', timestamps: true })
export class CierreCajaMongo {
  // Normalizar SIEMPRE a inicio de día UTC para que el índice de unicidad sea correcto.
  @Prop({ required: true, type: Date, index: true, set: normalizarInicioDiaUTC })
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

// P0: Constraint DB — una sola caja ABIERTA por día (fecha normalizada a inicio UTC)
// Permite múltiples cierres históricos CERRADOS; bloquea duplicados solo cuando estado === 'ABIERTO'.
CierreCajaSchema.index(
  { fecha: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'ABIERTO' } },
);












