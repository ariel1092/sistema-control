import { ApiProperty } from '@nestjs/swagger';

export class ClienteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ required: false })
  razonSocial?: string;

  @ApiProperty({ required: false })
  dni?: string;

  @ApiProperty({ required: false })
  telefono?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  direccion?: string;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  tieneCuentaCorriente: boolean;

  @ApiProperty()
  saldoCuentaCorriente: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}











