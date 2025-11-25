import { ApiProperty } from '@nestjs/swagger';

export class ReporteFinancieroDto {
  @ApiProperty({ description: 'Fecha de inicio del reporte' })
  fechaInicio: Date;

  @ApiProperty({ description: 'Fecha de fin del reporte' })
  fechaFin: Date;

  @ApiProperty({ description: 'Total de ingresos (ventas)' })
  totalIngresos: number;

  @ApiProperty({ description: 'Total de gastos' })
  totalGastos: number;

  @ApiProperty({ description: 'Total de retiros de socios' })
  totalRetiros: number;

  @ApiProperty({ description: 'Balance general (ingresos - gastos - retiros)' })
  balanceGeneral: number;

  @ApiProperty({ description: 'Ganancia neta (ingresos - gastos)' })
  gananciaNeta: number;

  @ApiProperty({ description: 'Margen de ganancia (%)' })
  margenGanancia: number;

  @ApiProperty({ description: 'Porcentaje de gastos sobre ingresos' })
  porcentajeGastos: number;

  @ApiProperty({ description: 'Proyección de ingresos (promedio diario * días restantes del mes)' })
  proyeccionIngresos?: number;

  @ApiProperty({ description: 'Tendencia de ingresos (últimos 7 días)' })
  tendenciaIngresos: { fecha: Date; monto: number }[];

  @ApiProperty({ description: 'Tendencia de gastos (últimos 7 días)' })
  tendenciaGastos: { fecha: Date; monto: number }[];

  @ApiProperty({ description: 'Desglose diario del balance' })
  desgloseDiario: {
    fecha: Date;
    ingresos: number;
    gastos: number;
    retiros: number;
    balance: number;
  }[];
}


