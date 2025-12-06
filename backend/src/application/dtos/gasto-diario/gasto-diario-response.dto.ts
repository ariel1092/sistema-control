import { ApiProperty } from '@nestjs/swagger';
import { CategoriaGasto, MetodoPagoGasto } from '../../../domain/entities/gasto-diario.entity';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

export class GastoDiarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ enum: CategoriaGasto })
  categoria: CategoriaGasto;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  descripcion: string;

  @ApiProperty({ required: false })
  empleadoNombre?: string;

  @ApiProperty({ enum: MetodoPagoGasto })
  metodoPago: MetodoPagoGasto;

  @ApiProperty({ enum: CuentaBancaria, required: false })
  cuentaBancaria?: CuentaBancaria;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}









