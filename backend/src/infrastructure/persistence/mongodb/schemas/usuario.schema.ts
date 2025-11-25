import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = UsuarioMongo & Document;

@Schema({ collection: 'usuarios', timestamps: true })
export class UsuarioMongo {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    required: true,
    enum: ['ADMIN', 'VENDEDOR', 'SUPERVISOR'],
    index: true,
  })
  rol: string;

  @Prop({ required: true, default: true, index: true })
  activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(UsuarioMongo);





