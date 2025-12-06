import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class RegistrarPagoClienteDto {
  @IsString()
  @IsNotEmpty()
  facturaId: string;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}


