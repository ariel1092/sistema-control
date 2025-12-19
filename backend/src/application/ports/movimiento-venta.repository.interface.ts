import { MovimientoVenta } from '../../domain/entities/movimiento-venta.entity';
import { TipoEventoVenta } from '../../domain/enums/tipo-evento-venta.enum';

export interface IMovimientoVentaRepository {
  save(movimiento: MovimientoVenta, options?: { session?: any }): Promise<MovimientoVenta>;
  findById(id: string): Promise<MovimientoVenta | null>;
  findByVenta(ventaId: string): Promise<MovimientoVenta[]>;
  findByTipoEvento(tipoEvento: TipoEventoVenta): Promise<MovimientoVenta[]>;
}


