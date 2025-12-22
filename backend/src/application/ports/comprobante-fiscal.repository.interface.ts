import { ComprobanteFiscal } from '../../domain/entities/comprobante-fiscal.entity';

export interface IComprobanteFiscalRepository {
  save(comprobante: ComprobanteFiscal, options?: { session?: any }): Promise<ComprobanteFiscal>;
  findById(id: string): Promise<ComprobanteFiscal | null>;
  findByVentaId(ventaId: string): Promise<ComprobanteFiscal | null>;
}





