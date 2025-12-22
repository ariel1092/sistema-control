import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProveedorDocument = ProveedorMongo & Document;

@Schema({ collection: 'proveedores', timestamps: true })
export class ProveedorMongo {
  @Prop({ required: true, index: true })
  nombre: string;

  @Prop({ required: false })
  razonSocial?: string;

  @Prop({ required: false, index: true })
  cuit?: string;

  @Prop({ required: false })
  domicilio?: string;

  @Prop({ required: false })
  telefono?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: true, default: 'OTROS' })
  categoria: string;

  @Prop({ required: false, type: [String], default: [] })
  productosProvee?: string[];

  @Prop({ required: false, default: '' })
  condicionesCompra?: string;

  @Prop({ required: true, default: 'EFECTIVO' })
  formaPagoHabitual: string;

  @Prop({ required: false })
  vendedorAsignado?: string;

  @Prop({ required: true, default: true })
  activo: boolean;

  @Prop({ required: false })
  observaciones?: string;

  @Prop({ required: false })
  plazoCuentaCorriente?: string;

  @Prop({ required: false })
  descuento?: number;

  @Prop({ required: true, default: 100 })
  margenGanancia: number;
}

export const ProveedorSchema = SchemaFactory.createForClass(ProveedorMongo);

// Índices adicionales
ProveedorSchema.index({ nombre: 'text', razonSocial: 'text', cuit: 'text' });
