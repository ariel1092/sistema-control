import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class RegistrarPagoDto {
  @ApiProperty({ description: 'Mes del pago en formato YYYY-MM', example: '2024-11' })
  @IsString()
  @IsNotEmpty()
  mes: string;

  @ApiProperty({ description: 'Monto del pago' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monto: number;

  @ApiProperty({ description: 'Fecha del pago', example: '2024-11-15' })
  @IsDateString()
  @IsNotEmpty()
  fechaPago: string;

  @ApiProperty({ description: 'Observaciones del pago', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}


