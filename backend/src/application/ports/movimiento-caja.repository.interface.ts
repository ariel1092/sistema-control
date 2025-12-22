import { MovimientoCaja } from '../../domain/entities/movimiento-caja.entity';

export interface IMovimientoCajaRepository {
  save(movimiento: MovimientoCaja, options?: { session?: any }): Promise<MovimientoCaja>;
  saveMany(movimientos: MovimientoCaja[], options?: { session?: any }): Promise<MovimientoCaja[]>;
  findByCierreCajaId(cierreCajaId: string): Promise<MovimientoCaja[]>;
  findByVentaId(ventaId: string): Promise<MovimientoCaja[]>;
  findById(id: string): Promise<MovimientoCaja | null>;
}

