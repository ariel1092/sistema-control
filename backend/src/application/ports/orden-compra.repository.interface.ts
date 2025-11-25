import { OrdenCompra } from '../../domain/entities/orden-compra.entity';
import { EstadoOrdenCompra } from '../../domain/enums/estado-orden-compra.enum';

export interface IOrdenCompraRepository {
  save(ordenCompra: OrdenCompra): Promise<OrdenCompra>;
  findById(id: string): Promise<OrdenCompra | null>;
  findByProveedor(proveedorId: string): Promise<OrdenCompra[]>;
  findByEstado(estado: EstadoOrdenCompra): Promise<OrdenCompra[]>;
  findAll(): Promise<OrdenCompra[]>;
}


