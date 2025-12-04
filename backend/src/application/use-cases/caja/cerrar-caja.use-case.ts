import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICajaRepository } from '../../ports/caja.repository.interface';
import { CierreCaja } from '../../../domain/entities/cierre-caja.entity';
import { GetVentasDiaUseCase } from '../ventas/get-ventas-dia.use-case';
import { CerrarCajaDto } from '../../dtos/caja/cerrar-caja.dto';
import { IMovimientoCajaRepository } from '../../ports/movimiento-caja.repository.interface';
import { TipoMovimientoCaja } from '../../../domain/entities/movimiento-caja.entity';

@Injectable()
export class CerrarCajaUseCase {
  constructor(
    @Inject('ICajaRepository')
    private readonly cajaRepository: ICajaRepository,
    private readonly getVentasDiaUseCase: GetVentasDiaUseCase,
    @Inject('IMovimientoCajaRepository')
    private readonly movimientoCajaRepository: IMovimientoCajaRepository,
  ) {}

  async execute(dto: CerrarCajaDto, usuarioId: string): Promise<CierreCaja> {
    const fechaHoy = new Date();
    
    // Normalizar fecha al inicio del día
    const año = fechaHoy.getUTCFullYear();
    const mes = fechaHoy.getUTCMonth();
    const dia = fechaHoy.getUTCDate();
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));

    // Buscar caja abierta
    const caja = await this.cajaRepository.findCajaAbierta(fechaInicio);
    if (!caja) {
      throw new NotFoundException('No hay una caja abierta para cerrar');
    }

    if (caja.estaCerrada()) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // Obtener resumen actualizado de ventas del día
    const resumenVentas = await this.getVentasDiaUseCase.execute(fechaInicio);

    // Obtener movimientos manuales del día
    const movimientos = await this.movimientoCajaRepository.findByCierreCajaId(caja.id!);
    
    // Calcular total de efectivo esperado
    let totalEfectivoEsperado = resumenVentas.totalEfectivo || 0;
    
    // Sumar/restar movimientos manuales
    for (const movimiento of movimientos) {
      if (movimiento.tipo === TipoMovimientoCaja.INGRESO) {
        totalEfectivoEsperado += movimiento.monto;
      } else {
        totalEfectivoEsperado -= movimiento.monto;
      }
    }

    // Actualizar totales desde ventas
    caja.actualizarTotales({
      totalEfectivo: resumenVentas.totalEfectivo || 0,
      totalTarjeta: resumenVentas.totalOtros || 0,
      totalTransferencia: 0,
      cantidadVentas: resumenVentas.cantidadVentas || 0,
    });

    // Cerrar la caja
    caja.cerrar(dto.observaciones);

    // Guardar
    return await this.cajaRepository.update(caja);
  }
}

