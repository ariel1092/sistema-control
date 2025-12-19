import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { TipoMovimientoStock } from '../../domain/enums/tipo-movimiento-stock.enum';

export interface IMovimientoStockRepository {
  save(movimiento: MovimientoStock, options?: { session?: any }): Promise<MovimientoStock>;
  findById(id: string): Promise<MovimientoStock | null>;
  findByProductoId(productoId: string): Promise<MovimientoStock[]>;
  findByVentaId(ventaId: string): Promise<MovimientoStock[]>;
  findByTipo(tipo: TipoMovimientoStock, fechaInicio?: Date, fechaFin?: Date): Promise<MovimientoStock[]>;
  findAll(fechaInicio?: Date, fechaFin?: Date): Promise<MovimientoStock[]>;
  hasMovimientos(productoId: string): Promise<boolean>;
}
