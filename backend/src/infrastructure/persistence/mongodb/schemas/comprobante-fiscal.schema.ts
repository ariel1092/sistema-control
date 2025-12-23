import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EstadoComprobanteFiscal } from '../../../../domain/enums/estado-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../../domain/enums/letra-comprobante.enum';
import { TipoComprobanteFiscal } from '../../../../domain/enums/tipo-comprobante-fiscal.enum';

export type ComprobanteFiscalDocument = ComprobanteFiscalMongo & Document;

@Schema({ collection: 'comprobantes_fiscales', timestamps: true })
export class ComprobanteFiscalMongo {
  @Prop({ required: true, index: true })
  ventaId: string;

  @Prop({ required: true, enum: Object.values(TipoComprobanteFiscal), index: true })
  tipo: TipoComprobanteFiscal;

  @Prop({ required: true, enum: Object.values(LetraComprobante), index: true })
  letra: LetraComprobante;

  @Prop({ required: true, index: true, min: 1 })
  puntoVenta: number;

  @Prop({ required: true, index: true, min: 1 })
  numero: number;

  @Prop({ required: true, type: Date, index: true })
  fechaEmision: Date;

  @Prop({ required: true, enum: Object.values(EstadoComprobanteFiscal), index: true })
  estado: EstadoComprobanteFiscal;

  @Prop({ required: true, type: Object })
  emisor: {
    razonSocial: string;
    cuit: string;
    domicilioFiscal: string;
    condicionIva?: string;
    ingresosBrutos?: string;
    inicioActividades?: string;
  };

  @Prop({ required: true, type: Object })
  receptor: {
    nombreRazonSocial: string;
    tipoDocumento: string;
    numeroDocumento?: string;
    domicilio?: string;
  };

  @Prop({
    required: true,
    type: [
      {
        productoId: { type: String, required: false },
        codigo: { type: String, required: false },
        descripcion: { type: String, required: true },
        unidad: { type: String, required: false },
        cantidad: { type: Number, required: true },
        precioUnitario: { type: Number, required: true },
        descuentoPorcentaje: { type: Number, required: false, default: 0 },
        alicuotaIva: { type: Number, required: false, default: 21 },
      },
    ],
  })
  items: Array<{
    productoId?: string;
    codigo?: string;
    descripcion: string;
    unidad?: string;
    cantidad: number;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    alicuotaIva?: number;
  }>;

  @Prop({ required: true, type: Object })
  totales: {
    netoGravado: number;
    ivaTotal: number;
    exento: number;
    noGravado: number;
    otrosTributos: number;
    total: number;
  };

  @Prop({ required: false, type: Date, index: true })
  autorizadoAt?: Date;

  @Prop({ required: false, type: Date, index: true })
  anuladoAt?: Date;
}

export const ComprobanteFiscalSchema = SchemaFactory.createForClass(ComprobanteFiscalMongo);

// Índices requeridos
ComprobanteFiscalSchema.index({ ventaId: 1 });
ComprobanteFiscalSchema.index({ puntoVenta: 1, tipo: 1, letra: 1, numero: 1 }, { unique: true });
ComprobanteFiscalSchema.index({ tipo: 1, letra: 1, puntoVenta: 1, numero: 1 });
ComprobanteFiscalSchema.index({ createdAt: -1 });






