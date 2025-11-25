import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VentaDocument = VentaMongo & Document;

@Schema({ collection: 'ventas', timestamps: true })
export class VentaMongo {
  @Prop({ required: true, unique: true, index: true })
  numero: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario', index: true })
  vendedorId: Types.ObjectId;

  @Prop({ required: false })
  clienteNombre?: string;

  @Prop({ required: false })
  clienteDNI?: string;

  @Prop({ required: true, type: Date, index: true })
  fecha: Date;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true, default: 0 })
  descuentoGeneral: number;

  @Prop({ required: true })
  total: number;

  @Prop({
    required: true,
    type: [
      {
        tipo: { type: String, enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CUENTA_CORRIENTE'] },
        monto: { type: Number, required: true },
        referencia: { type: String, required: false },
        cuentaBancaria: { type: String, enum: ['ABDUL', 'OSVALDO'], required: false },
        recargo: { type: Number, required: false },
      },
    ],
  })
  metodosPago: Array<{
    tipo: string;
    monto: number;
    referencia?: string;
    cuentaBancaria?: string;
    recargo?: number;
  }>;

  @Prop({
    required: true,
    enum: ['BORRADOR', 'COMPLETADA', 'CANCELADA'],
    default: 'COMPLETADA',
    index: true,
  })
  estado: string;

  @Prop({ required: false })
  observaciones?: string;

  @Prop({ required: false, type: Types.ObjectId, ref: 'Usuario' })
  canceladoPor?: Types.ObjectId;

  @Prop({ required: false })
  canceladoEn?: Date;

  @Prop({
    required: false,
    enum: ['PRESUPUESTO', 'REMITO', 'FACTURA'],
    default: 'FACTURA',
    index: true,
  })
  tipoComprobante?: string;

  @Prop({ required: false, default: false })
  esCuentaCorriente?: boolean;

  @Prop({ required: false, default: 0 })
  recargoCredito?: number;
}

export const VentaSchema = SchemaFactory.createForClass(VentaMongo);

// Índices adicionales para optimizar consultas
VentaSchema.index({ vendedorId: 1, fecha: -1 });
VentaSchema.index({ estado: 1, fecha: -1 });
VentaSchema.index({ fecha: -1, estado: 1 }); // Para reportes por rango de fechas
VentaSchema.index({ createdAt: -1 }); // Para ordenamiento rápido

