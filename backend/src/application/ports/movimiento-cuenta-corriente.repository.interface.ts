import { MovimientoCuentaCorriente } from '../../domain/entities/movimiento-cuenta-corriente.entity';
import { TipoMovimientoCC } from '../../domain/enums/tipo-movimiento-cc.enum';

export interface IMovimientoCuentaCorrienteRepository {
  save(movimiento: MovimientoCuentaCorriente): Promise<MovimientoCuentaCorriente>;
  findById(id: string): Promise<MovimientoCuentaCorriente | null>;
  findByProveedor(proveedorId: string): Promise<MovimientoCuentaCorriente[]>;
  getUltimoSaldo(proveedorId: string): Promise<number>;
  getDeudaTotal(proveedorId: string): Promise<number>;
  findAll(): Promise<MovimientoCuentaCorriente[]>;
}


