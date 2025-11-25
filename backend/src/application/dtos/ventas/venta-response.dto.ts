import { ApiProperty } from '@nestjs/swagger';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';

export class DetalleVentaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productoId: string;

  @ApiProperty()
  codigoProducto: string;

  @ApiProperty()
  nombreProducto: string;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  precioUnitario: number;

  @ApiProperty()
  descuentoItem: number;

  @ApiProperty()
  subtotal: number;
}

export class MetodoPagoResponseDto {
  @ApiProperty({ enum: TipoMetodoPago })
  tipo: TipoMetodoPago;

  @ApiProperty()
  monto: number;

  @ApiProperty({ required: false })
  referencia?: string;
}

export class VentaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: string;

  @ApiProperty()
  vendedorId: string;

  @ApiProperty({ required: false })
  clienteNombre?: string;

  @ApiProperty({ required: false })
  clienteDNI?: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ type: [DetalleVentaResponseDto] })
  detalles: DetalleVentaResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  descuentoGeneral: number;

  @ApiProperty()
  descuento: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [MetodoPagoResponseDto] })
  metodosPago: MetodoPagoResponseDto[];

  @ApiProperty({ enum: EstadoVenta })
  estado: EstadoVenta;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty({ required: false })
  canceladoPor?: string;

  @ApiProperty({ required: false })
  canceladoEn?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}





