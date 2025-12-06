import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class RegistrarPagoDirectoClienteDto {
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


