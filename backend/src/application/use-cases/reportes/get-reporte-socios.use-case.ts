import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';
import { ReporteSociosDto, BalanceSocioDto } from '../../dtos/reportes/reporte-socios.dto';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { MetodoPagoGasto } from '../../../domain/entities/gasto-diario.entity';

@Injectable()
export class GetReporteSociosUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date): Promise<ReporteSociosDto> {
    const fechaInicioReporte = fechaInicio || new Date();
    const fechaFinReporte = fechaFin || new Date();

    // Normalizar fechas
    const inicio = new Date(fechaInicioReporte);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFinReporte);
    fin.setHours(23, 59, 59, 999);

    // Obtener todas las ventas del período (solo para calcular transferencias)
    const ventas = await this.ventaRepository.findByRangoFechas(inicio, fin);
    const ventasCompletadas = ventas.filter((v) => v.estado === EstadoVenta.COMPLETADA);

    // Obtener todos los retiros del período
    const retiros = await this.retiroRepository.findAll(undefined, inicio, fin);

    // Obtener todos los gastos del período (para calcular gastos con MercadoPago)
    const gastos = await this.gastoRepository.findAll(inicio, fin);
    
    // Calcular balance para cada socio (retiros, transferencias y gastos MercadoPago)
    const balances: BalanceSocioDto[] = [];

    for (const cuenta of [CuentaBancaria.ABDUL, CuentaBancaria.OSVALDO]) {
      // Calcular retiros del socio
      const retirosSocio = retiros.filter((r) => r.cuentaBancaria === cuenta);
      const totalRetiros = retirosSocio.reduce((sum, r) => sum + r.monto, 0);

      // Calcular transferencias recibidas en su cuenta
      const transferencias = ventasCompletadas
        .flatMap((v) => v.metodosPago)
        .filter(
          (mp) =>
            mp.tipo === TipoMetodoPago.TRANSFERENCIA && mp.cuentaBancaria === cuenta,
        );
      const totalTransferenciasRecibidas = transferencias.reduce((sum, mp) => sum + mp.monto, 0);

      // Calcular gastos con MercadoPago individuales (asignados a cada socio según su cuenta bancaria)
      const gastosMercadoPago = gastos.filter(
        (g) => g.metodoPago === MetodoPagoGasto.MERCADOPAGO && g.cuentaBancaria === cuenta
      );
      const gastosMercadoPagoSocio = gastosMercadoPago.reduce((sum, g) => sum + g.monto, 0);

      balances.push({
        cuentaBancaria: cuenta,
        totalRetiros,
        totalTransferenciasRecibidas,
        totalGastosMercadoPago: gastosMercadoPagoSocio,
      });
    }

    // Calcular totales combinados
    const totalRetirosCombinados = balances.reduce((sum, b) => sum + b.totalRetiros, 0);
    const totalTransferenciasCombinadas = balances.reduce((sum, b) => sum + (b.totalTransferenciasRecibidas || 0), 0);
    const totalGastosMercadoPagoCombinados = gastos
      .filter((g) => g.metodoPago === MetodoPagoGasto.MERCADOPAGO)
      .reduce((sum, g) => sum + g.monto, 0);

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

    // Comparativa de retiros, transferencias y gastos MercadoPago
    const comparativa = balances.map((b) => ({
      socio: b.cuentaBancaria,
      retiros: b.totalRetiros,
      transferencias: b.totalTransferenciasRecibidas || 0,
      gastosMercadoPago: b.totalGastosMercadoPago || 0,
    }));

    return {
      fechaInicio: inicio,
      fechaFin: fin,
      balances,
      totalRetirosCombinados,
      totalTransferenciasCombinadas,
      totalGastosMercadoPagoCombinados,
      historialRetiros,
      comparativa,
    };
  }
}

