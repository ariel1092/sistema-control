import { Injectable, Inject } from '@nestjs/common';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { Venta } from '../../../domain/entities/venta.entity';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';

@Injectable()
export class GetVentasRecientesUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
  ) {}

  async execute(fecha?: Date, tipoMetodoPago?: TipoMetodoPago): Promise<Venta[]> {
    const fechaBusqueda = fecha || new Date();
    
    // Normalizar fecha al inicio del día en UTC para que coincida con cómo se guardan las ventas
    const año = fechaBusqueda.getUTCFullYear();
    const mes = fechaBusqueda.getUTCMonth();
    const dia = fechaBusqueda.getUTCDate();
    const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999));

    const ventas = await this.ventaRepository.findByRangoFechas(
      fechaInicio,
      fechaFin,
    );

    // Filtrar solo ventas completadas
    let ventasFiltradas = ventas.filter(
      (v) => v.estado === EstadoVenta.COMPLETADA,
    );

    // Filtrar por tipo de método de pago si se especifica
    if (tipoMetodoPago) {
      ventasFiltradas = ventasFiltradas.filter((v) =>
        v.metodosPago.some((mp) => mp.tipo === tipoMetodoPago),
      );
    }

    // Ordenar por fecha más reciente primero
    return ventasFiltradas.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

