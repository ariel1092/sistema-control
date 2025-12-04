import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsBoolean, IsOptional, IsString } from 'class-validator';

export class RegistrarAsistenciaDto {
  @ApiProperty({ description: 'Fecha de la asistencia', example: '2024-11-15' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ description: 'Si el empleado estuvo presente' })
  @IsBoolean()
  @IsNotEmpty()
  presente: boolean;

  @ApiProperty({ description: 'Observaciones de la asistencia', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}








