import { CierreCaja } from '../../domain/entities/cierre-caja.entity';

export interface ICajaRepository {
  save(cierreCaja: CierreCaja): Promise<CierreCaja>;
  findById(id: string): Promise<CierreCaja | null>;
  findByFecha(fecha: Date): Promise<CierreCaja | null>;
  findByRangoFechas(desde: Date, hasta: Date): Promise<CierreCaja[]>;
  update(cierreCaja: CierreCaja): Promise<CierreCaja>;
  findCajaAbierta(fecha: Date): Promise<CierreCaja | null>;
}





