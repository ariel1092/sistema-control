import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CierreCajaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  totalEfectivo: number;

  @ApiProperty()
  totalTarjeta: number;

  @ApiProperty()
  totalTransferencia: number;

  @ApiProperty()
  totalGeneral: number;

  @ApiProperty()
  totalAbdul: number;

  @ApiProperty()
  totalOsvaldo: number;

  @ApiProperty()
  cantidadVentas: number;

  @ApiProperty({ enum: ['ABIERTO', 'CERRADO'] })
  estado: 'ABIERTO' | 'CERRADO';

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AbrirCajaDto {
  @ApiProperty({ description: 'Monto inicial en efectivo', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoInicial?: number;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CerrarCajaDto {
  @ApiProperty({ description: 'Fecha del cierre', required: false })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}


