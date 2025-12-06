import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateFacturaClienteDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsNotEmpty()
  clienteId: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsDateString()
  @IsNotEmpty()
  fechaVencimiento: string;

  @IsNumber()
  @IsNotEmpty()
  montoTotal: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  ventaId?: string;
}


