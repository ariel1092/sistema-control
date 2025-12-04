import { Proveedor } from '../../domain/entities/proveedor.entity';

export interface IProveedorRepository {
  save(proveedor: Proveedor): Promise<Proveedor>;
  findById(id: string): Promise<Proveedor | null>;
  findAll(activo?: boolean): Promise<Proveedor[]>;
  findByCategoria(categoria: string): Promise<Proveedor[]>;
  delete(id: string): Promise<void>;
}





