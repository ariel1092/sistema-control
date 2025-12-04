import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CerrarCajaDto {
  @ApiProperty({ description: 'Monto final contado en efectivo', example: 5000.0 })
  @IsNumber()
  @Min(0)
  montoFinal: number;

  @ApiProperty({ description: 'Observaciones del cierre', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

