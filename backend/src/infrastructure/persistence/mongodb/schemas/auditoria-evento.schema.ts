import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TipoEventoAuditoria } from '../../../../domain/enums/tipo-evento-auditoria.enum';

export type AuditoriaEventoDocument = AuditoriaEventoMongo & Document;

@Schema({ collection: 'auditoria_eventos', timestamps: true })
export class AuditoriaEventoMongo {
  @Prop({ required: true, index: true })
  entidad: string;

  @Prop({ required: true, index: true })
  entidadId: string;

  @Prop({ required: true, enum: Object.values(TipoEventoAuditoria), index: true })
  evento: string;

  @Prop({ required: true, type: Object })
  snapshot: any;

  @Prop({ required: true, type: Object })
  metadatos: {
    usuarioId: string;
    ip?: string;
    userAgent?: string;
    razon?: string;
  };

  @Prop({ required: false, index: true })
  hashIntegridad: string;

  @Prop({ default: Date.now, index: true })
  createdAt: Date;
}

export const AuditoriaEventoSchema = SchemaFactory.createForClass(AuditoriaEventoMongo);

// Índices compuestos
AuditoriaEventoSchema.index({ entidad: 1, entidadId: 1, createdAt: -1 });
AuditoriaEventoSchema.index({ 'metadatos.usuarioId': 1, createdAt: -1 });






