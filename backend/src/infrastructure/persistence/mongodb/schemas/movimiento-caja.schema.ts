import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrigenMovimientoCaja } from '../../../../domain/entities/movimiento-caja.entity';

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

  // Metadata para ventas/pagos (futuro: conciliación y auditoría contable)
  @Prop({ required: true, enum: Object.values(OrigenMovimientoCaja), default: OrigenMovimientoCaja.MANUAL, index: true })
  origen: string;

  @Prop({ required: false, index: true })
  metodoPago?: string;

  @Prop({ required: false })
  referencia?: string;

  @Prop({ required: false, index: true })
  cuentaBancaria?: string;

  @Prop({ required: false })
  recargo?: number;

  @Prop({ required: false, index: true })
  ventaId?: string;

  @Prop({ required: false })
  ventaNumero?: string;

  @Prop({ required: false, index: true })
  comprobanteFiscalId?: string;
}

export const MovimientoCajaSchema = SchemaFactory.createForClass(MovimientoCajaMongo);

// Índices para búsquedas y anti-duplicado por venta
MovimientoCajaSchema.index({ cierreCajaId: 1, createdAt: -1 });
MovimientoCajaSchema.index({ ventaId: 1, origen: 1 });
MovimientoCajaSchema.index(
  { ventaId: 1, metodoPago: 1, origen: 1 },
  { unique: true, partialFilterExpression: { origen: 'VENTA' } },
);
MovimientoCajaSchema.index(
  { ventaId: 1, metodoPago: 1, origen: 1 },
  { unique: true, partialFilterExpression: { origen: 'REVERSO_VENTA' } },
);

