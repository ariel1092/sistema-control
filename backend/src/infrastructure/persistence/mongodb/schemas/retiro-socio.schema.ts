import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CuentaBancaria } from '../../../../domain/enums/cuenta-bancaria.enum';

export type RetiroSocioDocument = RetiroSocioMongo & Document;

@Schema({ collection: 'retiros-socios', timestamps: true })
export class RetiroSocioMongo {
  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true, enum: Object.values(CuentaBancaria), index: true })
  cuentaBancaria: string;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true })
  descripcion: string;

  @Prop()
  observaciones?: string;
}

export const RetiroSocioSchema = SchemaFactory.createForClass(RetiroSocioMongo);

// Índices adicionales para optimizar consultas
RetiroSocioSchema.index({ fecha: -1, cuentaBancaria: 1 }); // Para reportes por fecha y cuenta
RetiroSocioSchema.index({ createdAt: -1 }); // Para ordenamiento rápido

