import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ description: 'Código único del producto' })
  @IsString()
  codigo: string;

  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Categoría del producto' })
  @IsString()
  categoria: string;

  @ApiProperty({ description: 'ID del proveedor', required: false })
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @ApiProperty({ description: 'Precio de venta', minimum: 0 })
  @IsNumber()
  @Min(0)
  precioVenta: number;

  @ApiProperty({ description: 'Stock actual', minimum: 0 })
  @IsNumber()
  @Min(0)
  stockActual: number;

  @ApiProperty({ description: 'Stock mínimo', minimum: 0 })
  @IsNumber()
  @Min(0)
  stockMinimo: number;

  @ApiProperty({ description: 'Unidad de medida (ej: UN, KG, M, L)' })
  @IsString()
  unidadMedida: string;

  @ApiProperty({ description: 'Descripción del producto', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'Marca del producto', required: false })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ description: 'Precio de costo', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCosto?: number;

  @ApiProperty({
    description: 'Si el producto está activo',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ description: 'Descuento aplicado', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @ApiProperty({ description: 'IVA aplicado (ej: 21)', required: false, default: 21 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  iva?: number;

  @ApiProperty({ description: 'Código de barras', required: false })
  @IsOptional()
  @IsString()
  codigoBarras?: string;
}











