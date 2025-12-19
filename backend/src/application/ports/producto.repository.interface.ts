import { Producto } from '../../domain/entities/producto.entity';

export interface IProductoRepository {
  save(producto: Producto, options?: { session?: any }): Promise<Producto>;
  findById(id: string): Promise<Producto | null>;
  findByCodigo(codigo: string): Promise<Producto | null>;
  search(termino: string, limit?: number, skip?: number): Promise<{ data: Producto[], total: number }>;
  findByCategoria(categoria: string): Promise<Producto[]>;
  findAll(activos?: boolean, limit?: number, skip?: number): Promise<{ data: Producto[], total: number }>;
  update(producto: Producto): Promise<Producto>;
  delete(id: string): Promise<void>;
  findByIds(ids: string[]): Promise<Producto[]>;
}












