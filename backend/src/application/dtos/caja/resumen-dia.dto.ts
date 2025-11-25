import { ApiProperty } from '@nestjs/swagger';
import { VentaResponseDto } from '../ventas/venta-response.dto';

export class ResumenDiaDto {
  @ApiProperty()
  fecha: Date;

  @ApiProperty({ type: [VentaResponseDto] })
  ventas: VentaResponseDto[];

  @ApiProperty()
  cantidadVentas: number;

  @ApiProperty()
  totalEfectivo: number;

  @ApiProperty({ description: 'Tarjetas + Transferencias + Débito + Crédito' })
  totalOtros: number;

  @ApiProperty()
  totalAbdul: number;

  @ApiProperty()
  totalOsvaldo: number;

  @ApiProperty()
  totalGeneral: number;
}

