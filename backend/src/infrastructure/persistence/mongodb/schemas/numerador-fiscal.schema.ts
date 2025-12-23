import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TipoComprobanteFiscal } from '../../../../domain/enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../../domain/enums/letra-comprobante.enum';

export type NumeradorFiscalDocument = NumeradorFiscalMongo & Document;

@Schema({ collection: 'numeradores_fiscales', timestamps: true })
export class NumeradorFiscalMongo {
  @Prop({ required: true, index: true, min: 1 })
  puntoVenta: number;

  @Prop({ required: true, enum: Object.values(TipoComprobanteFiscal), index: true })
  tipo: TipoComprobanteFiscal;

  @Prop({ required: true, enum: Object.values(LetraComprobante), index: true })
  letra: LetraComprobante;

  @Prop({ required: true, default: 0, min: 0 })
  ultimoNumero: number;
}

export const NumeradorFiscalSchema = SchemaFactory.createForClass(NumeradorFiscalMongo);

// Un numerador por combinación (ptoVta, tipo, letra)
NumeradorFiscalSchema.index(
  { puntoVenta: 1, tipo: 1, letra: 1 },
  { unique: true },
);






