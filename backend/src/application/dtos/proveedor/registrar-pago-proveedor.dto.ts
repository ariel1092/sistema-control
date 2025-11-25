import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class RegistrarPagoProveedorDto {
  @ApiProperty()
  @IsString()
  facturaId: string;

  @ApiProperty({ description: 'Monto del pago', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}


