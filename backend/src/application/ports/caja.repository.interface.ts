import { CierreCaja } from '../../domain/entities/cierre-caja.entity';

export interface ICajaRepository {
  save(cierreCaja: CierreCaja, options?: { session?: any }): Promise<CierreCaja>;
  findById(id: string): Promise<CierreCaja | null>;
  findByFecha(fecha: Date): Promise<CierreCaja | null>;
  findByRangoFechas(desde: Date, hasta: Date): Promise<CierreCaja[]>;
  update(cierreCaja: CierreCaja, options?: { session?: any }): Promise<CierreCaja>;
  findCajaAbierta(fecha: Date, options?: { session?: any }): Promise<CierreCaja | null>;
}












