import { MovimientoCaja } from '../../domain/entities/movimiento-caja.entity';

export interface IMovimientoCajaRepository {
  save(movimiento: MovimientoCaja): Promise<MovimientoCaja>;
  findByCierreCajaId(cierreCajaId: string): Promise<MovimientoCaja[]>;
  findById(id: string): Promise<MovimientoCaja | null>;
}

