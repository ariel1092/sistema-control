import { ApiProperty } from '@nestjs/swagger';
import { CategoriaGasto } from '../../../domain/entities/gasto-diario.entity';

export class ReporteGastosAvanzadoDto {
  @ApiProperty({ description: 'Fecha de inicio del reporte' })
  fechaInicio: Date;

  @ApiProperty({ description: 'Fecha de fin del reporte' })
  fechaFin: Date;

  @ApiProperty({ description: 'Total de gastos' })
  totalGastos: number;

  @ApiProperty({ description: 'Total de ingresos (ventas)' })
  totalIngresos: number;

  @ApiProperty({ description: 'Porcentaje de gastos sobre ingresos' })
  porcentajeGastos: number;

  @ApiProperty({ description: 'Gastos por categoría' })
  gastosPorCategoria: {
    categoria: CategoriaGasto;
    total: number;
    porcentaje: number;
  }[];

  @ApiProperty({ description: 'Gastos por proveedor (empleado que registró)' })
  gastosPorProveedor: {
    proveedor: string;
    total: number;
    cantidad: number;
  }[];

  @ApiProperty({ description: 'Comparativa mensual (últimos 3 meses)' })
  comparativaMensual: {
    mes: string;
    totalGastos: number;
    totalIngresos: number;
    porcentaje: number;
  }[];

  @ApiProperty({ description: 'Proyección de gastos (promedio diario * días restantes)' })
  proyeccionGastos?: number;

  @ApiProperty({ description: 'Tendencia de gastos (últimos 7 días)' })
  tendenciaGastos: { fecha: Date; monto: number }[];

  @ApiProperty({ description: 'Gastos más altos del período' })
  gastosMasAltos: {
    id: string;
    fecha: Date;
    categoria: CategoriaGasto;
    monto: number;
    descripcion: string;
    proveedor: string;
  }[];
}








