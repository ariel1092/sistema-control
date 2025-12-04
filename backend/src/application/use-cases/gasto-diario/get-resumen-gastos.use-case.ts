import { Injectable, Inject } from '@nestjs/common';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';

@Injectable()
export class GetResumenGastosUseCase {
  constructor(
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
  ) {}

  async execute(fechaInicio: Date, fechaFin: Date) {
    const total = await this.gastoRepository.getTotalPorPeriodo(fechaInicio, fechaFin);
    const porCategoria = await this.gastoRepository.getTotalPorCategoria(fechaInicio, fechaFin);
    const gastos = await this.gastoRepository.findAll(fechaInicio, fechaFin);

    // Calcular gasto más alto
    const gastoMasAlto = gastos.length > 0
      ? gastos.reduce((max, gasto) => (gasto.monto > max.monto ? gasto : max), gastos[0])
      : null;

    // Calcular total de snacks del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);
    const snacksHoy = await this.gastoRepository.findAll(
      hoy,
      finHoy,
      'SNACK',
    );
    const totalSnacksHoy = snacksHoy.reduce((sum, gasto) => sum + gasto.monto, 0);

    return {
      total,
      totalHoy: await this.gastoRepository.getTotalPorPeriodo(hoy, finHoy),
      totalMes: total,
      gastoMasAlto: gastoMasAlto
        ? {
            monto: gastoMasAlto.monto,
            descripcion: gastoMasAlto.descripcion,
            categoria: gastoMasAlto.categoria,
          }
        : null,
      snacksHoy: totalSnacksHoy,
      porCategoria,
    };
  }
}








