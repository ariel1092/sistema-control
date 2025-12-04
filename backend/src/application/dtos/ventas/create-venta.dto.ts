import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../../../domain/enums/tipo-comprobante.enum';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ItemVentaDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  productoId: string;

  @ApiProperty({ description: 'Cantidad del producto', minimum: 1 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario (opcional, usa precio del producto si no se especifica)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUnitario?: number;

  @ApiProperty({
    description: 'Descuento por item en porcentaje (0-100)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoItem?: number;
}

export class MetodoPagoDto {
  @ApiProperty({
    description: 'Tipo de método de pago',
    enum: TipoMetodoPago,
  })
  @IsEnum(TipoMetodoPago)
  tipo: TipoMetodoPago;

  @ApiProperty({ description: 'Monto del pago', minimum: 0 })
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiProperty({
    description: 'Referencia (requerida para tarjeta y transferencia)',
    required: false,
  })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiProperty({
    description: 'Cuenta bancaria (requerida para transferencia)',
    enum: CuentaBancaria,
    required: false,
  })
  @IsOptional()
  @IsEnum(CuentaBancaria)
  cuentaBancaria?: CuentaBancaria;

  @ApiProperty({
    description: 'Recargo aplicado (para crédito, ej: 5 o 10)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recargo?: number;
}

export class CreateVentaDto {
  @ApiProperty({
    description: 'Items de la venta (opcional para ventas simples sin productos)',
    type: [ItemVentaDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items?: ItemVentaDto[];

  @ApiProperty({
    description: 'Métodos de pago',
    type: [MetodoPagoDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MetodoPagoDto)
  metodosPago: MetodoPagoDto[];

  @ApiProperty({ description: 'Nombre del cliente', required: false })
  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @ApiProperty({ description: 'DNI del cliente', required: false })
  @IsOptional()
  @IsString()
  clienteDNI?: string;

  @ApiProperty({
    description: 'Descuento general en porcentaje (0-100)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoGeneral?: number;

  @ApiProperty({ description: 'Observaciones de la venta', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    description: 'Tipo de comprobante',
    enum: TipoComprobante,
    required: false,
    default: TipoComprobante.FACTURA,
  })
  @IsOptional()
  @IsEnum(TipoComprobante)
  tipoComprobante?: TipoComprobante;

  @ApiProperty({
    description: 'Si es cuenta corriente (fiado)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esCuentaCorriente?: boolean;

  @ApiProperty({
    description: 'Recargo por crédito (5 o 10 por defecto)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recargoCredito?: number;

  @ApiProperty({
    description: 'ID del vendedor que realiza la venta',
    required: false,
  })
  @IsOptional()
  @IsString()
  vendedorId?: string;
}

