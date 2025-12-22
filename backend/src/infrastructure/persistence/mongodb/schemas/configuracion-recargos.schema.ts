import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConfiguracionRecargosDocument = ConfiguracionRecargosMongo & Document;

@Schema({ collection: 'configuracion_recargos', timestamps: true })
export class ConfiguracionRecargosMongo {
  /**
   * Singleton lógico.
   * Usamos una clave fija para garantizar un único documento, sin depender de "findOne()" accidental.
   */
  @Prop({ required: true, unique: true, default: 'RECARGOS', index: true })
  key: string;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  recargoDebitoPct: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  recargoCreditoPct: number;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', index: true })
  updatedBy?: Types.ObjectId;
}

export const ConfiguracionRecargosSchema = SchemaFactory.createForClass(ConfiguracionRecargosMongo);

// Índice único del singleton
ConfiguracionRecargosSchema.index({ key: 1 }, { unique: true });



