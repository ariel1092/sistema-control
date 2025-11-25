import { Injectable, Inject } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { GetVentasDiaUseCase } from '../ventas/get-ventas-dia.use-case';
import { CierreCajaResponseDto } from '../../dtos/caja/cierre-caja.dto';
import { Types } from 'mongoose';

@Injectable()
export class GetResumenDiaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    private readonly getVentasDiaUseCase: GetVentasDiaUseCase,
  ) {}

  async execute(fecha?: Date): Promise<CierreCajaResponseDto> {
    const fechaBusqueda = fecha || new Date();
    
    // Normalizar fecha al inicio del día en UTC para que coincida con las ventas
    const año = fechaBusqueda.getUTCFullYear();
    const mes = fechaBusqueda.getUTCMonth();
    const dia = fechaBusqueda.getUTCDate();
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));

    console.log(`[GetResumenDia] Fecha recibida: ${fechaBusqueda.toISOString()}`);
    console.log(`[GetResumenDia] Fecha normalizada (UTC inicio día): ${fechaInicio.toISOString()}`);

    // Obtener resumen de ventas del día PRIMERO (siempre desde las ventas reales)
    const resumenVentas = await this.getVentasDiaUseCase.execute(fechaInicio);
    
    console.log(`[GetResumenDia] Resumen obtenido:`, {
      cantidadVentas: resumenVentas.cantidadVentas,
      totalGeneral: resumenVentas.totalGeneral,
      totalEfectivo: resumenVentas.totalEfectivo,
      totalOtros: resumenVentas.totalOtros,
    });

    // Buscar cierre de caja existente
    let cierreCaja = await this.cajaRepository.findByFecha(fechaInicio);

    if (!cierreCaja) {
      // Crear nuevo cierre de caja
      // Mapear desde ResumenDiaDto (totalOtros) a CierreCaja (totalTarjeta + totalTransferencia)
      // Por ahora, asignamos totalOtros a totalTarjeta para mantener compatibilidad
      const totalOtros = resumenVentas.totalOtros || 0;
      
      // Generar un ObjectId válido para el usuario temporal del sistema
      // TODO: Reemplazar con usuario autenticado cuando auth esté implementado
      const systemUserId = new Types.ObjectId().toString();
      
      cierreCaja = CierreCaja.crear({
        fecha: fechaInicio,
        usuarioId: systemUserId,
        totalEfectivo: resumenVentas.totalEfectivo,
        totalTarjeta: totalOtros, // Incluye tarjetas, transferencias, débito y crédito
        totalTransferencia: 0, // Mantener por compatibilidad
        cantidadVentas: resumenVentas.cantidadVentas,
        estado: 'ABIERTO',
      });

      cierreCaja = await this.cajaRepository.save(cierreCaja);
    } else {
      // Actualizar cierre de caja existente
      const totalOtros = resumenVentas.totalOtros || 0;
      
      cierreCaja.actualizarTotales({
        totalEfectivo: resumenVentas.totalEfectivo,
        totalTarjeta: totalOtros, // Incluye tarjetas, transferencias, débito y crédito
        totalTransferencia: 0, // Mantener por compatibilidad
        cantidadVentas: resumenVentas.cantidadVentas,
      });

      cierreCaja = await this.cajaRepository.update(cierreCaja);
    }

    return await this.mapCierreCajaToResponse(cierreCaja, resumenVentas);
  }

  private async mapCierreCajaToResponse(
    cierreCaja: CierreCaja,
    resumenVentas: any,
  ): Promise<CierreCajaResponseDto> {
    // IMPORTANTE: Usar totalGeneral calculado desde las ventas reales del día
    // en lugar del valor almacenado en CierreCaja, que puede estar incorrecto
    const totalGeneralCorrecto = resumenVentas.totalGeneral || 0;
    
    // Mapear desde CierreCaja (que tiene totalTarjeta) a CierreCajaResponseDto
    // Mantener compatibilidad con el formato antiguo para el endpoint de caja
    return {
      id: cierreCaja.id!,
      fecha: cierreCaja.fecha,
      usuarioId: cierreCaja.usuarioId,
      totalEfectivo: resumenVentas.totalEfectivo || 0, // Usar valor de ventas reales
      totalTarjeta: resumenVentas.totalOtros || 0, // Usar valor de ventas reales
      totalTransferencia: cierreCaja.totalTransferencia,
      totalGeneral: totalGeneralCorrecto, // Usar totalGeneral calculado desde ventas
      totalAbdul: resumenVentas.totalAbdul || 0,
      totalOsvaldo: resumenVentas.totalOsvaldo || 0,
      cantidadVentas: resumenVentas.cantidadVentas || 0, // Usar cantidad real de ventas
      estado: cierreCaja.estado,
      observaciones: cierreCaja.observaciones,
      createdAt: cierreCaja.createdAt,
      updatedAt: cierreCaja.updatedAt,
    };
  }
}

