import { FacturaCliente } from '../../domain/entities/factura-cliente.entity';

export interface IFacturaClienteRepository {
  save(factura: FacturaCliente): Promise<FacturaCliente>;
  findById(id: string): Promise<FacturaCliente | null>;
  findByCliente(clienteId: string): Promise<FacturaCliente[]>;
  findPendientes(clienteId?: string): Promise<FacturaCliente[]>;
  findPorVencer(dias: number, clienteId?: string): Promise<FacturaCliente[]>;
  findVencidas(clienteId?: string): Promise<FacturaCliente[]>;
  findAll(): Promise<FacturaCliente[]>;
}


