import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidenteUptimeDocument = IncidenteUptimeMongo & Document;

@Schema({ collection: 'incidentes_uptime', timestamps: true })
export class IncidenteUptimeMongo {
  @Prop({ required: true, index: true })
  startDateTime: Date;

  @Prop({ required: false, index: true })
  endDateTime?: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: false })
  duration?: string;

  @Prop({ required: false })
  durationSeconds?: number;

  @Prop({ required: true, index: true })
  monitorUrl: string;

  @Prop({ required: true, index: true })
  monitorName: string;

  @Prop({ required: true, default: 'ABIERTO', index: true })
  estado: string;
}

export const IncidenteUptimeSchema = SchemaFactory.createForClass(IncidenteUptimeMongo);

// Índices adicionales
IncidenteUptimeSchema.index({ startDateTime: -1 });
IncidenteUptimeSchema.index({ estado: 1, startDateTime: -1 });
IncidenteUptimeSchema.index({ monitorName: 1, startDateTime: -1 });

