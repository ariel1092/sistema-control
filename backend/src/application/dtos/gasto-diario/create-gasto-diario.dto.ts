import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { CategoriaGasto, MetodoPagoGasto } from '../../../domain/entities/gasto-diario.entity';

export class CreateGastoDiarioDto {
  @ApiProperty({ description: 'Fecha del gasto', example: '2025-11-24' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ enum: CategoriaGasto, description: 'Categoría del gasto' })
  @IsEnum(CategoriaGasto)
  categoria: CategoriaGasto;

  @ApiProperty({ description: 'Monto del gasto', example: 2500 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ description: 'Descripción del gasto', example: 'Flete de materiales' })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Nombre del empleado que registró el gasto', required: false })
  @IsOptional()
  @IsString()
  empleadoNombre?: string;

  @ApiProperty({ enum: MetodoPagoGasto, description: 'Método de pago', required: false, default: MetodoPagoGasto.EFECTIVO })
  @IsOptional()
  @IsEnum(MetodoPagoGasto)
  metodoPago?: MetodoPagoGasto;

  @ApiProperty({ description: 'Observaciones adicionales', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}


