import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, IsDateString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DetalleOrdenCompraDto {
  @ApiProperty()
  @IsString()
  productoId: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateOrdenCompraDto {
  @ApiProperty()
  @IsString()
  proveedorId: string;

  @ApiProperty({ description: 'Fecha de la orden en formato YYYY-MM-DD' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Fecha estimada de entrega en formato YYYY-MM-DD', required: false })
  @IsOptional()
  @IsDateString()
  fechaEstimadaEntrega?: string;

  @ApiProperty({ type: [DetalleOrdenCompraDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleOrdenCompraDto)
  detalles: DetalleOrdenCompraDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}





