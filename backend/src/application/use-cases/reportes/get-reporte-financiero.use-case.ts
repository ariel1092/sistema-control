import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { ReporteFinancieroDto } from '../../dtos/reportes/reporte-financiero.dto';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';

@Injectable()
export class GetReporteFinancieroUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date): Promise<ReporteFinancieroDto> {
    const fechaInicioReporte = fechaInicio || new Date();
    const fechaFinReporte = fechaFin || new Date();

    // Normalizar fechas
    const inicio = new Date(fechaInicioReporte);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFinReporte);
    fin.setHours(23, 59, 59, 999);

    // OPTIMIZACIÓN: Hacer todas las consultas en paralelo
    const [ventas, gastos, retiros] = await Promise.all([
      this.ventaRepository.findByRangoFechas(inicio, fin),
      this.gastoRepository.findAll(inicio, fin),
      this.retiroRepository.findAll(undefined, inicio, fin),
    ]);

    // 1. Calcular ingresos (ventas completadas)
    const ventasCompletadas = ventas.filter((v) => v.estado === EstadoVenta.COMPLETADA);
    const totalIngresos = ventasCompletadas.reduce((sum, v) => sum + v.calcularTotal(), 0);

    // 2. Calcular gastos
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    // 3. Calcular retiros
    const totalRetiros = retiros.reduce((sum, r) => sum + r.monto, 0);

    // 4. Calcular balance y ganancia
    const gananciaNeta = totalIngresos - totalGastos;
    const balanceGeneral = totalIngresos - totalGastos - totalRetiros;
    const margenGanancia = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;
    const porcentajeGastos = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

    // 5. Calcular tendencias (últimos 7 días) - OPTIMIZADO: usar datos ya cargados si están en el rango
    const fechaInicioTendencia = subDays(new Date(), 6);
    fechaInicioTendencia.setHours(0, 0, 0, 0);
    const fechaFinTendencia = new Date();
    fechaFinTendencia.setHours(23, 59, 59, 999);

    // Solo hacer consulta adicional si el rango de tendencia no está incluido en el rango principal
    let ventasTendencia = ventasCompletadas;
    let gastosTendencia = gastos;
    
    if (fechaInicioTendencia < inicio || fechaFinTendencia > fin) {
      const [ventasTend, gastosTend] = await Promise.all([
        this.ventaRepository.findByRangoFechas(fechaInicioTendencia, fechaFinTendencia),
        this.gastoRepository.findAll(fechaInicioTendencia, fechaFinTendencia),
      ]);
      ventasTendencia = ventasTend.filter((v) => v.estado === EstadoVenta.COMPLETADA);
      gastosTendencia = gastosTend;
    }

    const diasTendencia = eachDayOfInterval({
      start: fechaInicioTendencia,
      end: fechaFinTendencia,
    });

    // OPTIMIZACIÓN: Crear mapas para búsqueda O(1) en lugar de filtrar en cada iteración
    const ventasPorDia = new Map<string, typeof ventasTendencia>();
    ventasTendencia.forEach((v) => {
      const fechaKey = format(new Date(v.fecha), 'yyyy-MM-dd');
      if (!ventasPorDia.has(fechaKey)) {
        ventasPorDia.set(fechaKey, []);
      }
      ventasPorDia.get(fechaKey)!.push(v);
    });

    const gastosPorDia = new Map<string, typeof gastosTendencia>();
    gastosTendencia.forEach((g) => {
      const fechaKey = format(new Date(g.fecha), 'yyyy-MM-dd');
      if (!gastosPorDia.has(fechaKey)) {
        gastosPorDia.set(fechaKey, []);
      }
      gastosPorDia.get(fechaKey)!.push(g);
    });

    const tendenciaIngresos = diasTendencia.map((dia) => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      const ventasDia = ventasPorDia.get(fechaKey) || [];
      return {
        fecha: dia,
        monto: ventasDia.reduce((sum, v) => sum + v.calcularTotal(), 0),
      };
    });

    const tendenciaGastos = diasTendencia.map((dia) => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      const gastosDia = gastosPorDia.get(fechaKey) || [];
      return {
        fecha: dia,
        monto: gastosDia.reduce((sum, g) => sum + g.monto, 0),
      };
    });

    // 6. Calcular proyección de ingresos (si es el mes actual)
    const hoy = new Date();
    const inicioMes = startOfMonth(hoy);
    const finMes = endOfMonth(hoy);
    let proyeccionIngresos: number | undefined;

    if (inicio <= inicioMes && fin >= inicioMes) {
      const diasTranscurridos = Math.floor((hoy.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const diasTotales = getDaysInMonth(hoy);
      const diasRestantes = diasTotales - diasTranscurridos;

      if (diasTranscurridos > 0) {
        const promedioDiario = totalIngresos / diasTranscurridos;
        proyeccionIngresos = promedioDiario * diasRestantes;
      }
    }

    // 7. Desglose diario - OPTIMIZADO: usar datos ya cargados en lugar de consultas individuales
    // Limitar desglose a máximo 90 días para evitar sobrecarga
    const diasDiferencia = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diasReporte = diasDiferencia <= 90 
      ? eachDayOfInterval({ start: inicio, end: fin })
      : []; // Si es más de 90 días, no calcular desglose diario
    
    // Crear mapas para búsqueda rápida
    const ventasPorDiaReporte = new Map<string, typeof ventasCompletadas>();
    ventasCompletadas.forEach((v) => {
      const fechaKey = format(new Date(v.fecha), 'yyyy-MM-dd');
      if (!ventasPorDiaReporte.has(fechaKey)) {
        ventasPorDiaReporte.set(fechaKey, []);
      }
      ventasPorDiaReporte.get(fechaKey)!.push(v);
    });

    const gastosPorDiaReporte = new Map<string, typeof gastos>();
    gastos.forEach((g) => {
      const fechaKey = format(new Date(g.fecha), 'yyyy-MM-dd');
      if (!gastosPorDiaReporte.has(fechaKey)) {
        gastosPorDiaReporte.set(fechaKey, []);
      }
      gastosPorDiaReporte.get(fechaKey)!.push(g);
    });

    const retirosPorDiaReporte = new Map<string, typeof retiros>();
    retiros.forEach((r) => {
      const fechaKey = format(new Date(r.fecha), 'yyyy-MM-dd');
      if (!retirosPorDiaReporte.has(fechaKey)) {
        retirosPorDiaReporte.set(fechaKey, []);
      }
      retirosPorDiaReporte.get(fechaKey)!.push(r);
    });

    // OPTIMIZACIÓN: Calcular desglose en memoria usando los mapas (O(n) en lugar de O(n*m))
    const desgloseDiario = diasReporte.map((dia) => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      const ventasDia = ventasPorDiaReporte.get(fechaKey) || [];
      const gastosDia = gastosPorDiaReporte.get(fechaKey) || [];
      const retirosDia = retirosPorDiaReporte.get(fechaKey) || [];

      const ingresosDia = ventasDia.reduce((sum, v) => sum + v.calcularTotal(), 0);
      const gastosDiaTotal = gastosDia.reduce((sum, g) => sum + g.monto, 0);
      const retirosDiaTotal = retirosDia.reduce((sum, r) => sum + r.monto, 0);

      return {
        fecha: dia,
        ingresos: ingresosDia,
        gastos: gastosDiaTotal,
        retiros: retirosDiaTotal,
        balance: ingresosDia - gastosDiaTotal - retirosDiaTotal,
      };
    });

    return {
      fechaInicio: inicio,
      fechaFin: fin,
      totalIngresos,
      totalGastos,
      totalRetiros,
      balanceGeneral,
      gananciaNeta,
      margenGanancia,
      porcentajeGastos,
      proyeccionIngresos,
      tendenciaIngresos,
      tendenciaGastos,
      desgloseDiario,
    };
  }
}
