import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

export class CreateRetiroSocioDto {
  @ApiProperty({ description: 'Fecha del retiro', example: '2025-11-24' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Hora del retiro', example: '14:30', required: false })
  @IsOptional()
  @IsString()
  hora?: string;

  @ApiProperty({ enum: CuentaBancaria, description: 'Cuenta bancaria del socio' })
  @IsEnum(CuentaBancaria)
  cuentaBancaria: CuentaBancaria;

  @ApiProperty({ description: 'Monto del retiro', example: 50000 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ description: 'Descripción del retiro', example: 'Retiro semanal' })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Observaciones adicionales', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}








