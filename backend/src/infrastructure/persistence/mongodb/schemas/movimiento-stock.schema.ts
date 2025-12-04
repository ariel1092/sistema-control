import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TipoMovimientoStock } from '../../../../domain/enums/tipo-movimiento-stock.enum';

export type MovimientoStockDocument = MovimientoStockMongo & Document;

@Schema({ collection: 'movimientos_stock', timestamps: true })
export class MovimientoStockMongo {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ProductoMongo' })
  productoId: Types.ObjectId;

  @Prop({ required: true, enum: TipoMovimientoStock })
  tipo: TipoMovimientoStock;

  @Prop({ required: true })
  cantidad: number;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario', index: true })
  usuarioId: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, ref: 'VentaMongo', index: true })
  ventaId?: Types.ObjectId;
}

export const MovimientoStockSchema = SchemaFactory.createForClass(MovimientoStockMongo);

// Índices adicionales
MovimientoStockSchema.index({ productoId: 1, createdAt: -1 });
MovimientoStockSchema.index({ tipo: 1, createdAt: -1 });
MovimientoStockSchema.index({ usuarioId: 1, createdAt: -1 });
