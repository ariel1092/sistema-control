import { ApiProperty } from '@nestjs/swagger';

export class FacturaPendienteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiProperty()
  total: number;

  @ApiProperty()
  montoPagado: number;

  @ApiProperty()
  saldoPendiente: number;

  @ApiProperty()
  diasHastaVencimiento: number;

  @ApiProperty()
  estaVencida: boolean;

  @ApiProperty()
  estaPorVencer: boolean;
}

export class RemitoSinFacturarDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  total: number;
}

export class OrdenCompraPendienteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ required: false })
  fechaEstimadaEntrega?: Date;

  @ApiProperty()
  total: number;

  @ApiProperty()
  estado: string;
}

export class MovimientoCuentaCorrienteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  saldoAnterior: number;

  @ApiProperty()
  saldoActual: number;
}

export class CuentaCorrienteProveedorDto {
  @ApiProperty()
  proveedorId: string;

  @ApiProperty()
  deudaTotal: number;

  @ApiProperty({ type: [FacturaPendienteDto] })
  facturasPendientes: FacturaPendienteDto[];

  @ApiProperty({ type: [RemitoSinFacturarDto] })
  remitosSinFacturar: RemitoSinFacturarDto[];

  @ApiProperty({ type: [OrdenCompraPendienteDto] })
  ordenesCompraPendientes: OrdenCompraPendienteDto[];

  @ApiProperty({ type: [MovimientoCuentaCorrienteDto] })
  movimientos: MovimientoCuentaCorrienteDto[];
}





