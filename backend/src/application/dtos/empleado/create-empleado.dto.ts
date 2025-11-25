import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { PuestoEmpleado } from '../../../domain/entities/empleado.entity';

export class CreateEmpleadoDto {
  @ApiProperty({ description: 'Nombre completo del empleado' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'DNI del empleado' })
  @IsString()
  @IsNotEmpty()
  dni: string;

  @ApiProperty({ description: 'Teléfono del empleado', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ description: 'Dirección del empleado', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'Puesto del empleado', enum: PuestoEmpleado })
  @IsEnum(PuestoEmpleado)
  @IsNotEmpty()
  puesto: PuestoEmpleado;

  @ApiProperty({ description: 'Fecha de ingreso del empleado', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  fechaIngreso: string;

  @ApiProperty({ description: 'Sueldo mensual del empleado' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  sueldoMensual: number;
}


