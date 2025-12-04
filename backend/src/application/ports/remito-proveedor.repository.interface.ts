import { RemitoProveedor } from '../../domain/entities/remito-proveedor.entity';

export interface IRemitoProveedorRepository {
  save(remito: RemitoProveedor): Promise<RemitoProveedor>;
  findById(id: string): Promise<RemitoProveedor | null>;
  findByProveedor(proveedorId: string): Promise<RemitoProveedor[]>;
  findByOrdenCompra(ordenCompraId: string): Promise<RemitoProveedor | null>;
  findSinFacturar(proveedorId?: string): Promise<RemitoProveedor[]>;
  findAll(): Promise<RemitoProveedor[]>;
}





