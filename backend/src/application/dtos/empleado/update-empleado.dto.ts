import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PuestoEmpleado } from '../../../domain/entities/empleado.entity';

export class UpdateEmpleadoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ enum: PuestoEmpleado, required: false })
  @IsEnum(PuestoEmpleado)
  @IsOptional()
  puesto?: PuestoEmpleado;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sueldoMensual?: number;
}









