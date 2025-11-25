import { ApiProperty } from '@nestjs/swagger';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';

export class BalanceSocioDto {
  @ApiProperty({ enum: CuentaBancaria, description: 'Cuenta bancaria del socio' })
  cuentaBancaria: CuentaBancaria;

  @ApiProperty({ description: 'Total de ingresos (50% del total de ventas del negocio)' })
  totalIngresos: number;

  @ApiProperty({ description: 'Total de retiros realizados' })
  totalRetiros: number;

  @ApiProperty({ description: 'Balance disponible (ingresos - retiros)' })
  balanceDisponible: number;

  @ApiProperty({ description: 'Ganancia estimada (50% del total de ventas)' })
  gananciaEstimada: number;

  @ApiProperty({ description: 'Porcentaje de retiros sobre ingresos' })
  porcentajeRetiros: number;

  @ApiProperty({ description: 'Total de transferencias recibidas en su cuenta (solo para información, no es ganancia individual)' })
  totalTransferenciasRecibidas?: number;
}

export class ReporteSociosDto {
  @ApiProperty({ description: 'Fecha de inicio del reporte' })
  fechaInicio: Date;

  @ApiProperty({ description: 'Fecha de fin del reporte' })
  fechaFin: Date;

  @ApiProperty({ type: [BalanceSocioDto], description: 'Balance de cada socio' })
  balances: BalanceSocioDto[];

  @ApiProperty({ description: 'Total de ingresos combinados' })
  totalIngresosCombinados: number;

  @ApiProperty({ description: 'Total de retiros combinados' })
  totalRetirosCombinados: number;

  @ApiProperty({ description: 'Balance total combinado' })
  balanceTotalCombinado: number;

  @ApiProperty({ description: 'Historial de retiros' })
  historialRetiros: {
    id: string;
    fecha: Date;
    cuentaBancaria: CuentaBancaria;
    monto: number;
    descripcion: string;
  }[];

  @ApiProperty({ description: 'Comparativa de rendimiento entre socios' })
  comparativa: {
    socio: CuentaBancaria;
    ingresos: number;
    retiros: number;
    balance: number;
    porcentajeIngresos: number;
  }[];
}

