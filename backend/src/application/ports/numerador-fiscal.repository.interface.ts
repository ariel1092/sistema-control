import { TipoComprobanteFiscal } from '../../domain/enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../../domain/enums/letra-comprobante.enum';

export interface INumeradorFiscalRepository {
  /**
   * Incrementa en forma atómica y retorna el nuevo número.
   * Requiere ejecutarse dentro de una transacción (session obligatoria).
   */
  getNext(params: {
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
  }, options: { session: any }): Promise<number>;
}






