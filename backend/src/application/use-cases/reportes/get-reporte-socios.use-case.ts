import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { ReporteSociosDto, BalanceSocioDto } from '../../dtos/reportes/reporte-socios.dto';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';

@Injectable()
export class GetReporteSociosUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date): Promise<ReporteSociosDto> {
    const fechaInicioReporte = fechaInicio || new Date();
    const fechaFinReporte = fechaFin || new Date();

    // Normalizar fechas
    const inicio = new Date(fechaInicioReporte);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFinReporte);
    fin.setHours(23, 59, 59, 999);

    // Obtener todas las ventas del período
    const ventas = await this.ventaRepository.findByRangoFechas(inicio, fin);
    const ventasCompletadas = ventas.filter((v) => v.estado === EstadoVenta.COMPLETADA);

    // Obtener todos los retiros del período
    const retiros = await this.retiroRepository.findAll(undefined, inicio, fin);

    // Calcular total de todas las ventas (ingresos del negocio)
    const totalVentas = ventasCompletadas.reduce((sum, v) => sum + v.calcularTotal(), 0);
    
    // Calcular balance para cada socio
    const balances: BalanceSocioDto[] = [];

    for (const cuenta of [CuentaBancaria.ABDUL, CuentaBancaria.OSVALDO]) {
      // IMPORTANTE: Los ingresos de cada socio son el 50% del total de ventas
      // Las transferencias a sus cuentas son solo métodos de pago, no ganancias individuales
      const totalIngresos = totalVentas * 0.5; // 50% del total de ventas

      // Calcular retiros
      const retirosSocio = retiros.filter((r) => r.cuentaBancaria === cuenta);
      const totalRetiros = retirosSocio.reduce((sum, r) => sum + r.monto, 0);

      // Calcular transferencias recibidas (solo para información, no para ganancia)
      const transferencias = ventasCompletadas
        .flatMap((v) => v.metodosPago)
        .filter(
          (mp) =>
            mp.tipo === TipoMetodoPago.TRANSFERENCIA && mp.cuentaBancaria === cuenta,
        );
      const totalTransferenciasRecibidas = transferencias.reduce((sum, mp) => sum + mp.monto, 0);

      // Calcular balance (ganancia - retiros)
      const balanceDisponible = totalIngresos - totalRetiros;
      const porcentajeRetiros = totalIngresos > 0 ? (totalRetiros / totalIngresos) * 100 : 0;

      balances.push({
        cuentaBancaria: cuenta,
        totalIngresos, // 50% del total de ventas
        totalRetiros,
        balanceDisponible,
        gananciaEstimada: totalIngresos, // La ganancia es el 50% del total
        porcentajeRetiros,
        // Agregar transferencias recibidas como información adicional
        totalTransferenciasRecibidas,
      });
    }

    // Calcular totales combinados
    // Cada socio tiene el 50% del total, entonces el total combinado es el 100% de las ventas
    const totalIngresosCombinados = totalVentas; // Suma de ambos socios (50% + 50% = 100%)
    const totalRetirosCombinados = balances.reduce((sum, b) => sum + b.totalRetiros, 0);
    const balanceTotalCombinado = totalIngresosCombinados - totalRetirosCombinados;

    // Historial de retiros ordenado por fecha
    const historialRetiros = retiros
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map((r) => ({
        id: r.id!,
        fecha: r.fecha,
        cuentaBancaria: r.cuentaBancaria,
        monto: r.monto,
        descripcion: r.descripcion,
      }));

    // Comparativa de rendimiento
    const comparativa = balances.map((b) => ({
      socio: b.cuentaBancaria,
      ingresos: b.totalIngresos,
      retiros: b.totalRetiros,
      balance: b.balanceDisponible,
      porcentajeIngresos:
        totalIngresosCombinados > 0
          ? (b.totalIngresos / totalIngresosCombinados) * 100
          : 0,
    }));

    return {
      fechaInicio: inicio,
      fechaFin: fin,
      balances,
      totalIngresosCombinados,
      totalRetirosCombinados,
      balanceTotalCombinado,
      historialRetiros,
      comparativa,
    };
  }
}

