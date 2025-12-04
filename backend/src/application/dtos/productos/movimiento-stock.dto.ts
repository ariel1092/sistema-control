import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { TipoMovimientoStock } from '../../../domain/enums/tipo-movimiento-stock.enum';

export class IngresarStockDto {
  @ApiProperty({ description: 'Cantidad a ingresar', minimum: 1 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'Descripción del motivo del ingreso' })
  @IsString()
  descripcion: string;
}

export class DescontarStockDto {
  @ApiProperty({ description: 'Cantidad a descontar', minimum: 1 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'Motivo de la salida' })
  @IsString()
  motivo: string;
}

export class AjusteInventarioDto {
  @ApiProperty({ description: 'Cantidad del ajuste (positivo para sumar, negativo para restar)' })
  @IsNumber()
  cantidad: number;

  @ApiProperty({ description: 'Motivo del ajuste' })
  @IsString()
  motivo: string;
}

export class MovimientoStockResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  productoId: string;
  @ApiProperty({ enum: TipoMovimientoStock })
  tipo: TipoMovimientoStock;
  @ApiProperty()
  cantidad: number;
  @ApiProperty()
  descripcion: string;
  @ApiProperty()
  usuarioId: string;
  @ApiProperty({ required: false })
  ventaId?: string;
  @ApiProperty()
  createdAt: Date;
}

