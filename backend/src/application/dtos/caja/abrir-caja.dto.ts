import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class AbrirCajaDto {
  @ApiProperty({ description: 'Monto inicial en efectivo', example: 1000.0 })
  @IsNumber()
  @IsPositive()
  @Min(0)
  montoInicial: number;
}

