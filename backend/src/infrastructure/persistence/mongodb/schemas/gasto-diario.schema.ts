import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CategoriaGasto, MetodoPagoGasto } from '../../../../domain/entities/gasto-diario.entity';

export type GastoDiarioDocument = GastoDiarioMongo & Document;

@Schema({ collection: 'gastos-diarios', timestamps: true })
export class GastoDiarioMongo {
  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true, enum: Object.values(CategoriaGasto), index: true })
  categoria: string;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true })
  descripcion: string;

  @Prop()
  empleadoNombre?: string;

  @Prop({ required: true, enum: Object.values(MetodoPagoGasto), default: MetodoPagoGasto.EFECTIVO })
  metodoPago: string;

  @Prop()
  observaciones?: string;
}

export const GastoDiarioSchema = SchemaFactory.createForClass(GastoDiarioMongo);

// Índices adicionales para optimizar consultas
GastoDiarioSchema.index({ fecha: -1, categoria: 1 }); // Para reportes por fecha y categoría
GastoDiarioSchema.index({ createdAt: -1 }); // Para ordenamiento rápido

