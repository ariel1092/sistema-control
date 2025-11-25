import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PuestoEmpleado } from '../../../../domain/entities/empleado.entity';

export type EmpleadoDocument = EmpleadoMongo & Document;

@Schema({ timestamps: true })
export class PagoEmpleadoMongo {
  @Prop({ required: true })
  mes: string;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: true })
  fechaPago: Date;

  @Prop()
  observaciones?: string;
}

@Schema({ timestamps: true })
export class AdelantoEmpleadoMongo {
  @Prop({ required: true })
  fecha: Date;

  @Prop({ required: true })
  monto: number;

  @Prop()
  observaciones?: string;

  @Prop({ required: true })
  mesAplicado: string;
}

@Schema({ timestamps: true })
export class AsistenciaEmpleadoMongo {
  @Prop({ required: true })
  fecha: Date;

  @Prop({ required: true, default: true })
  presente: boolean;

  @Prop()
  observaciones?: string;
}

@Schema({ timestamps: true })
export class DocumentoEmpleadoMongo {
  @Prop({ required: true, enum: ['DNI', 'CONTRATO'] })
  tipo: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fechaSubida: Date;
}

@Schema({ timestamps: true })
export class EmpleadoMongo {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, unique: true, index: true })
  dni: string;

  @Prop()
  telefono?: string;

  @Prop()
  direccion?: string;

  @Prop({ required: true, enum: Object.values(PuestoEmpleado) })
  puesto: PuestoEmpleado;

  @Prop({ required: true })
  fechaIngreso: Date;

  @Prop({ required: true })
  sueldoMensual: number;

  @Prop({ type: [PagoEmpleadoMongo], default: [] })
  pagos: PagoEmpleadoMongo[];

  @Prop({ type: [AdelantoEmpleadoMongo], default: [] })
  adelantos: AdelantoEmpleadoMongo[];

  @Prop({ type: [AsistenciaEmpleadoMongo], default: [] })
  asistencias: AsistenciaEmpleadoMongo[];

  @Prop({ type: [DocumentoEmpleadoMongo], default: [] })
  documentos: DocumentoEmpleadoMongo[];

  @Prop({ default: true })
  activo: boolean;
}

export const EmpleadoSchema = SchemaFactory.createForClass(EmpleadoMongo);
export const PagoEmpleadoSchema = SchemaFactory.createForClass(PagoEmpleadoMongo);
export const AdelantoEmpleadoSchema = SchemaFactory.createForClass(AdelantoEmpleadoMongo);
export const AsistenciaEmpleadoSchema = SchemaFactory.createForClass(AsistenciaEmpleadoMongo);
export const DocumentoEmpleadoSchema = SchemaFactory.createForClass(DocumentoEmpleadoMongo);

