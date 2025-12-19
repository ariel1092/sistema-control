import { Cliente } from '../../domain/entities/cliente.entity';

export interface IClienteRepository {
  save(cliente: Cliente, options?: { session?: any }): Promise<Cliente>;
  findById(id: string): Promise<Cliente | null>;
  findByDNI(dni: string): Promise<Cliente | null>;
  findAll(): Promise<Cliente[]>;
  search(termino: string): Promise<Cliente[]>;
  update(cliente: Cliente): Promise<Cliente>;
  delete(id: string): Promise<void>;
}











