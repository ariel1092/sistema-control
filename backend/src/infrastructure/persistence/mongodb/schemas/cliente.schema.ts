import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClienteDocument = ClienteMongo & Document;

@Schema({ collection: 'clientes', timestamps: true })
export class ClienteMongo {
  @Prop({ required: true, index: true })
  nombre: string;

  @Prop({ required: false })
  razonSocial?: string;

  @Prop({ required: false, index: true })
  dni?: string;

  @Prop({ required: false })
  telefono?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  direccion?: string;

  @Prop({ required: false })
  observaciones?: string;

  @Prop({ required: true, default: false })
  tieneCuentaCorriente: boolean;

  @Prop({ required: true, default: 0 })
  saldoCuentaCorriente: number;
}

export const ClienteSchema = SchemaFactory.createForClass(ClienteMongo);

// Índices adicionales
ClienteSchema.index({ nombre: 'text', razonSocial: 'text', dni: 'text' });




