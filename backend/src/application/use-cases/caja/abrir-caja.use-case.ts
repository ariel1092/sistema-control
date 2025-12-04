import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { GetVentasDiaUseCase } from '../ventas/get-ventas-dia.use-case';
import { AbrirCajaDto } from '../../dtos/caja/abrir-caja.dto';

@Injectable()
export class AbrirCajaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    private readonly getVentasDiaUseCase: GetVentasDiaUseCase,
  ) {}

  async execute(dto: AbrirCajaDto, usuarioId: string): Promise<CierreCaja> {
    const fechaHoy = new Date();
    
    // Normalizar fecha al inicio del día
    const año = fechaHoy.getUTCFullYear();
    const mes = fechaHoy.getUTCMonth();
    const dia = fechaHoy.getUTCDate();
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));

    // Verificar si ya existe una caja abierta
    const cajaAbierta = await this.cajaRepository.findCajaAbierta(fechaInicio);
    if (cajaAbierta) {
      throw new ConflictException('Ya existe una caja abierta para hoy');
    }

    // Obtener resumen de ventas del día (puede estar vacío si es inicio del día)
    let resumenVentas;
    try {
      resumenVentas = await this.getVentasDiaUseCase.execute(fechaInicio);
    } catch (error) {
      // Si no hay ventas aún, crear resumen vacío
      resumenVentas = {
        cantidadVentas: 0,
        totalEfectivo: 0,
        totalOtros: 0,
        totalGeneral: 0,
      };
    }

    // Crear nueva caja
    const caja = CierreCaja.crear({
      fecha: fechaInicio,
      usuarioId,
      totalEfectivo: resumenVentas.totalEfectivo || 0,
      totalTarjeta: resumenVentas.totalOtros || 0,
      totalTransferencia: 0,
      cantidadVentas: resumenVentas.cantidadVentas || 0,
      estado: 'ABIERTO',
    });

    // Si hay monto inicial, agregarlo como movimiento manual de ingreso
    // Por ahora, simplemente lo sumamos al total de efectivo
    if (dto.montoInicial > 0) {
      caja.totalEfectivo = dto.montoInicial;
      caja.actualizarTotales({ totalEfectivo: dto.montoInicial });
    }

    return await this.cajaRepository.save(caja);
  }
}

