import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class RegistrarAdelantoDto {
  @ApiProperty({ description: 'Fecha del adelanto', example: '2024-11-15' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ description: 'Monto del adelanto' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monto: number;

  @ApiProperty({ description: 'Mes al que se aplica el adelanto en formato YYYY-MM', example: '2024-11' })
  @IsString()
  @IsNotEmpty()
  mesAplicado: string;

  @ApiProperty({ description: 'Observaciones del adelanto', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}









