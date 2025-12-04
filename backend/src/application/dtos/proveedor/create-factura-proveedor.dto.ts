import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DetalleFacturaProveedorDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productoId?: string;

  @ApiProperty()
  @IsString()
  codigoProducto: string;

  @ApiProperty()
  @IsString()
  nombreProducto: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  descuento?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  iva?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateFacturaProveedorDto {
  @ApiProperty()
  @IsString()
  proveedorId: string;

  @ApiProperty()
  @IsString()
  numero: string;

  @ApiProperty({ description: 'Fecha de la factura en formato YYYY-MM-DD' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Fecha de vencimiento en formato YYYY-MM-DD' })
  @IsDateString()
  fechaVencimiento: string;

  @ApiProperty({ type: [DetalleFacturaProveedorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleFacturaProveedorDto)
  detalles: DetalleFacturaProveedorDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remitoId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ordenCompraId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}





