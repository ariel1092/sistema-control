import { Producto } from '../../domain/entities/producto.entity';

export interface IProductoRepository {
  save(producto: Producto): Promise<Producto>;
  findById(id: string): Promise<Producto | null>;
  findByCodigo(codigo: string): Promise<Producto | null>;
  search(termino: string): Promise<Producto[]>;
  findByCategoria(categoria: string): Promise<Producto[]>;
  findAll(activos?: boolean): Promise<Producto[]>;
  update(producto: Producto): Promise<Producto>;
  delete(id: string): Promise<void>;
  findByIds(ids: string[]): Promise<Producto[]>;
}












