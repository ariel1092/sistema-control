import { Producto } from '../../domain/entities/producto.entity';

export interface IProductoRepository {
  save(producto: Producto, options?: { session?: any }): Promise<Producto>;
  findById(id: string, options?: { session?: any }): Promise<Producto | null>;
  findByCodigo(codigo: string): Promise<Producto | null>;
  search(termino: string, limit?: number, skip?: number): Promise<{ data: Producto[], total: number }>;
  findByCategoria(categoria: string): Promise<Producto[]>;
  findAll(activos?: boolean, limit?: number, skip?: number): Promise<{ data: Producto[], total: number }>;
  update(producto: Producto): Promise<Producto>;
  delete(id: string): Promise<void>;
  findByIds(ids: string[], options?: { session?: any }): Promise<Producto[]>;

  /**
   * Optimización: descuento de stock en batch para evitar N+1 updates.
   * Debe ejecutarse con `session` dentro de una transacción.
   */
  bulkDescontarStock(
    items: Array<{ productoId: string; cantidad: number }>,
    options?: { session?: any },
  ): Promise<void>;
}












