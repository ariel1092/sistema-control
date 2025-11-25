import { ApiProperty } from '@nestjs/swagger';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

export class RetiroSocioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ enum: CuentaBancaria })
  cuentaBancaria: CuentaBancaria;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  descripcion: string;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}


