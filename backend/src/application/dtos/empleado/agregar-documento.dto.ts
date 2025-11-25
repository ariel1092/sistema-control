import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';

export class AgregarDocumentoDto {
  @ApiProperty({ description: 'Tipo de documento', enum: ['DNI', 'CONTRATO'] })
  @IsEnum(['DNI', 'CONTRATO'])
  @IsNotEmpty()
  tipo: 'DNI' | 'CONTRATO';

  @ApiProperty({ description: 'Nombre del archivo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'URL o path del archivo' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Fecha de subida del documento', example: '2024-11-15' })
  @IsDateString()
  @IsNotEmpty()
  fechaSubida: string;
}


