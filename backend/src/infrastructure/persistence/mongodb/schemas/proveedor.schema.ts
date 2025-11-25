import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CategoriaProveedor } from '../../../../domain/enums/categoria-proveedor.enum';
import { FormaPagoProveedor } from '../../../../domain/enums/forma-pago-proveedor.enum';

export type ProveedorDocument = ProveedorMongo & Document;

@Schema({ collection: 'proveedores', timestamps: true })
export class ProveedorMongo {
  @Prop({ required: true, index: true })
  nombre: string;

  @Prop()
  razonSocial?: string;

  @Prop({ index: true })
  cuit?: string;

  @Prop()
  domicilio?: string;

  @Prop()
  telefono?: string;

  @Prop()
  email?: string;

  @Prop({ required: true, enum: Object.values(CategoriaProveedor), index: true })
  categoria: string;

  @Prop({ type: [String], default: [] })
  productosProvee: string[];

  @Prop({ default: '' })
  condicionesCompra: string;

  @Prop({ required: true, enum: Object.values(FormaPagoProveedor), default: FormaPagoProveedor.CUENTA_CORRIENTE })
  formaPagoHabitual: string;

  @Prop()
  vendedorAsignado?: string;

  @Prop({ required: true, default: true, index: true })
  activo: boolean;

  @Prop()
  observaciones?: string;
}

export const ProveedorSchema = SchemaFactory.createForClass(ProveedorMongo);

// Índices adicionales
ProveedorSchema.index({ nombre: 'text', razonSocial: 'text', cuit: 'text' });


