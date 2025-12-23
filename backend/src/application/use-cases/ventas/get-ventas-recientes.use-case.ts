import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { Venta } from '../../../domain/entities/venta.entity';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { measureLogic } from '../../../infrastructure/performance/performance.storage';

@Injectable()
export class GetVentasRecientesUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(fecha?: Date, tipoMetodoPago?: TipoMetodoPago): Promise<Venta[]> {
    return measureLogic(async () => {
      const fechaBusqueda = fecha || new Date();
      
      // Normalizar fecha al inicio del día en UTC para que coincida con cómo se guardan las ventas
      const año = fechaBusqueda.getUTCFullYear();
      const mes = fechaBusqueda.getUTCMonth();
      const dia = fechaBusqueda.getUTCDate();
      const fechaInicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
      const fechaFin = new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999));

      // Generar clave de caché única por fecha y tipo de pago
      const fechaKey = `${año}-${mes + 1}-${dia}`;
      const cacheKey = `ventas:${fechaKey}:${tipoMetodoPago || 'all'}`;
      
      // Intentar obtener del caché (solo para fechas pasadas, no para hoy)
      const esHoy = fechaBusqueda.toDateString() === new Date().toDateString();
      if (!esHoy) {
        const cached = await this.cacheManager.get<Venta[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const ventas = await this.ventaRepository.findByRangoFechas(
        fechaInicio,
        fechaFin,
      );

      // Filtrar solo ventas completadas y deduplicar por id (defensivo)
      const ventasCompletadas = ventas.filter(
        (v) => v.estado === EstadoVenta.COMPLETADA,
      );

      const ventasMap = new Map<string, Venta>();
      ventasCompletadas.forEach((v) => {
        if (v?.id && !ventasMap.has(v.id)) {
          ventasMap.set(v.id, v);
        }
      });

      let ventasFiltradas = Array.from(ventasMap.values());

      // Filtrar por tipo de método de pago si se especifica
      if (tipoMetodoPago) {
        ventasFiltradas = ventasFiltradas.filter((v) =>
          v.metodosPago.some((mp) => mp.tipo === tipoMetodoPago),
        );
      }

      // Ordenar por fecha más reciente primero
      const resultado = ventasFiltradas.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      // Guardar en caché solo si no es hoy (las ventas de hoy cambian constantemente)
      // TTL de 5 minutos para fechas pasadas
      if (!esHoy) {
        await this.cacheManager.set(cacheKey, resultado, 300);
      }

      return resultado;
    });
  }
}

