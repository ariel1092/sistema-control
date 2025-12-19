import { MovimientoCuentaCorrienteCliente } from '../../domain/entities/movimiento-cuenta-corriente-cliente.entity';

export interface IMovimientoCuentaCorrienteClienteRepository {
  save(movimiento: MovimientoCuentaCorrienteCliente, options?: { session?: any }): Promise<MovimientoCuentaCorrienteCliente>;
  findById(id: string): Promise<MovimientoCuentaCorrienteCliente | null>;
  findByCliente(clienteId: string): Promise<MovimientoCuentaCorrienteCliente[]>;
  findByDocumentoId(documentoId: string): Promise<MovimientoCuentaCorrienteCliente[]>;
  getUltimoSaldo(clienteId: string): Promise<number>;
  findAll(): Promise<MovimientoCuentaCorrienteCliente[]>;
}


