import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';
import { ReporteGastosAvanzadoDto } from '../../dtos/reportes/reporte-gastos-avanzado.dto';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { format, subMonths, startOfMonth, endOfMonth, subDays, eachDayOfInterval, getDaysInMonth } from 'date-fns';

@Injectable()
export class GetReporteGastosAvanzadoUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date): Promise<ReporteGastosAvanzadoDto> {
    const fechaInicioReporte = fechaInicio || new Date();
    const fechaFinReporte = fechaFin || new Date();

    // Normalizar fechas
    const inicio = new Date(fechaInicioReporte);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFinReporte);
    fin.setHours(23, 59, 59, 999);

    // 1. Calcular totales
    const gastos = await this.gastoRepository.findAll(inicio, fin);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    const ventas = await this.ventaRepository.findByRangoFechas(inicio, fin);
    const ventasCompletadas = ventas.filter((v) => v.estado === EstadoVenta.COMPLETADA);
    const totalIngresos = ventasCompletadas.reduce((sum, v) => sum + v.calcularTotal(), 0);

    const porcentajeGastos = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

    // 2. Gastos por categoría
    const gastosPorCategoriaData = await this.gastoRepository.getTotalPorCategoria(inicio, fin);
    const gastosPorCategoria = gastosPorCategoriaData.map((item) => ({
      categoria: item.categoria as any,
      total: item.total,
      porcentaje: totalGastos > 0 ? (item.total / totalGastos) * 100 : 0,
    }));

    // 3. Gastos por proveedor (empleado que registró)
    const gastosPorProveedorMap = new Map<string, { total: number; cantidad: number }>();
    gastos.forEach((gasto) => {
      const proveedor = gasto.empleadoNombre || 'Sin proveedor';
      const actual = gastosPorProveedorMap.get(proveedor) || { total: 0, cantidad: 0 };
      gastosPorProveedorMap.set(proveedor, {
        total: actual.total + gasto.monto,
        cantidad: actual.cantidad + 1,
      });
    });

    const gastosPorProveedor = Array.from(gastosPorProveedorMap.entries())
      .map(([proveedor, datos]) => ({
        proveedor,
        total: datos.total,
        cantidad: datos.cantidad,
      }))
      .sort((a, b) => b.total - a.total);

    // 4. Comparativa mensual (últimos 3 meses) - OPTIMIZADO: consultas en paralelo
    const mesesParaComparar = [];
    for (let i = 2; i >= 0; i--) {
      const mesFecha = subMonths(new Date(), i);
      mesesParaComparar.push({
        mesFecha,
        inicioMes: startOfMonth(mesFecha),
        finMes: endOfMonth(mesFecha),
      });
    }

    // Hacer todas las consultas en paralelo
    const consultasMensuales = await Promise.all(
      mesesParaComparar.map(async ({ inicioMes, finMes }) => {
        const [gastosMes, ventasMes] = await Promise.all([
          this.gastoRepository.findAll(inicioMes, finMes),
          this.ventaRepository.findByRangoFechas(inicioMes, finMes),
        ]);
        const ventasCompletadasMes = ventasMes.filter((v) => v.estado === EstadoVenta.COMPLETADA);
        return { gastosMes, ventasCompletadasMes };
      }),
    );

    const comparativaMensual = mesesParaComparar.map(({ mesFecha }, index) => {
      const { gastosMes, ventasCompletadasMes } = consultasMensuales[index];
      const totalGastosMes = gastosMes.reduce((sum, g) => sum + g.monto, 0);
      const totalIngresosMes = ventasCompletadasMes.reduce((sum, v) => sum + v.calcularTotal(), 0);
      const porcentajeMes = totalIngresosMes > 0 ? (totalGastosMes / totalIngresosMes) * 100 : 0;

      return {
        mes: format(mesFecha, 'MMM yyyy'),
        totalGastos: totalGastosMes,
        totalIngresos: totalIngresosMes,
        porcentaje: porcentajeMes,
      };
    });

    // 5. Proyección de gastos (si es el mes actual)
    const hoy = new Date();
    const inicioMes = startOfMonth(hoy);
    const finMes = endOfMonth(hoy);
    let proyeccionGastos: number | undefined;

    if (inicio <= inicioMes && fin >= inicioMes) {
      const diasTranscurridos = Math.floor((hoy.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const diasTotales = getDaysInMonth(hoy);
      const diasRestantes = diasTotales - diasTranscurridos;

      if (diasTranscurridos > 0) {
        const promedioDiario = totalGastos / diasTranscurridos;
        proyeccionGastos = promedioDiario * diasRestantes;
      }
    }

    // 6. Tendencia de gastos (últimos 7 días) - OPTIMIZADO: usar datos ya cargados si están en el rango
    const fechaInicioTendencia = subDays(new Date(), 6);
    fechaInicioTendencia.setHours(0, 0, 0, 0);
    const fechaFinTendencia = new Date();
    fechaFinTendencia.setHours(23, 59, 59, 999);

    let gastosTendencia = gastos;
    if (fechaInicioTendencia < inicio || fechaFinTendencia > fin) {
      gastosTendencia = await this.gastoRepository.findAll(fechaInicioTendencia, fechaFinTendencia);
    }

    const diasTendencia = eachDayOfInterval({
      start: fechaInicioTendencia,
      end: fechaFinTendencia,
    });

    // OPTIMIZACIÓN: Crear mapa para búsqueda O(1)
    const gastosPorDiaTendencia = new Map<string, typeof gastosTendencia>();
    gastosTendencia.forEach((g) => {
      const fechaKey = format(new Date(g.fecha), 'yyyy-MM-dd');
      if (!gastosPorDiaTendencia.has(fechaKey)) {
        gastosPorDiaTendencia.set(fechaKey, []);
      }
      gastosPorDiaTendencia.get(fechaKey)!.push(g);
    });

    const tendenciaGastos = diasTendencia.map((dia) => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      const gastosDia = gastosPorDiaTendencia.get(fechaKey) || [];
      return {
        fecha: dia,
        monto: gastosDia.reduce((sum, g) => sum + g.monto, 0),
      };
    });

    // 7. Gastos más altos del período
    const gastosMasAltos = gastos
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10)
      .map((g) => ({
        id: g.id!,
        fecha: g.fecha,
        categoria: g.categoria,
        monto: g.monto,
        descripcion: g.descripcion,
        proveedor: g.empleadoNombre,
      }));

    return {
      fechaInicio: inicio,
      fechaFin: fin,
      totalGastos,
      totalIngresos,
      porcentajeGastos,
      gastosPorCategoria,
      gastosPorProveedor,
      comparativaMensual,
      proyeccionGastos,
      tendenciaGastos,
      gastosMasAltos,
    };
  }
}

