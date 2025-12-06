import { ApiProperty } from '@nestjs/swagger';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

export class BalanceSocioDto {
  @ApiProperty({ enum: CuentaBancaria, description: 'Cuenta bancaria del socio' })
  cuentaBancaria: CuentaBancaria;

  @ApiProperty({ description: 'Total de retiros realizados' })
  totalRetiros: number;

  @ApiProperty({ description: 'Total de transferencias recibidas en su cuenta' })
  totalTransferenciasRecibidas: number;

  @ApiProperty({ description: 'Total de gastos con MercadoPago (50% del total)' })
  totalGastosMercadoPago: number;
}

export class ReporteSociosDto {
  @ApiProperty({ description: 'Fecha de inicio del reporte' })
  fechaInicio: Date;

  @ApiProperty({ description: 'Fecha de fin del reporte' })
  fechaFin: Date;

  @ApiProperty({ type: [BalanceSocioDto], description: 'Balance de cada socio' })
  balances: BalanceSocioDto[];

  @ApiProperty({ description: 'Total de retiros combinados' })
  totalRetirosCombinados: number;

  @ApiProperty({ description: 'Total de transferencias combinadas' })
  totalTransferenciasCombinadas: number;

  @ApiProperty({ description: 'Total de gastos con MercadoPago combinados' })
  totalGastosMercadoPagoCombinados: number;

  @ApiProperty({ description: 'Historial de retiros' })
  historialRetiros: {
    id: string;
    fecha: Date;
    cuentaBancaria: CuentaBancaria;
    monto: number;
    descripcion: string;
  }[];

  @ApiProperty({ description: 'Comparativa de retiros, transferencias y gastos MercadoPago entre socios' })
  comparativa: {
    socio: CuentaBancaria;
    retiros: number;
    transferencias: number;
    gastosMercadoPago: number;
  }[];
}

