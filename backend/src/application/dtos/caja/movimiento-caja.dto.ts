import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';

export class CrearMovimientoCajaDto {
  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoCaja })
  @IsEnum(TipoMovimientoCaja)
  tipo: TipoMovimientoCaja;

  @ApiProperty({ description: 'Monto del movimiento', example: 500.0 })
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiProperty({ description: 'Motivo o descripción del movimiento' })
  @IsString()
  @MinLength(3)
  motivo: string;
}

