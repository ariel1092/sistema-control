import { Venta } from '../../domain/entities/venta.entity';

export interface IVentaRepository {
  save(venta: Venta): Promise<Venta>;
  findById(id: string): Promise<Venta | null>;
  findByNumero(numero: string): Promise<Venta | null>;
  findByFecha(fecha: Date): Promise<Venta[]>;
  findByRangoFechas(desde: Date, hasta: Date): Promise<Venta[]>;
  findByVendedor(
    vendedorId: string,
    desde?: Date,
    hasta?: Date,
  ): Promise<Venta[]>;
  update(venta: Venta): Promise<Venta>;
  delete(id: string): Promise<void>; // soft delete
  countByFecha(fecha: Date): Promise<number>;
}











