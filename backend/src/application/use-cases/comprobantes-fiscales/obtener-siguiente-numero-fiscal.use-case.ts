import { Inject, Injectable } from '@nestjs/common';
import { TipoComprobanteFiscal } from '../../../domain/enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../domain/enums/letra-comprobante.enum';
import { INumeradorFiscalRepository } from '../../ports/numerador-fiscal.repository.interface';

@Injectable()
export class ObtenerSiguienteNumeroFiscalUseCase {
  constructor(
    @Inject('INumeradorFiscalRepository')
    private readonly numeradorRepository: INumeradorFiscalRepository,
  ) {}

  async execute(params: {
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
  }, options: { session: any }): Promise<{ numero: number }> {
    const session = options?.session;
    if (!session) {
      throw new Error('ObtenerSiguienteNumeroFiscalUseCase requiere session de Mongo (uso obligatorio en transacción)');
    }
    if (typeof session.inTransaction === 'function' && !session.inTransaction()) {
      throw new Error('ObtenerSiguienteNumeroFiscalUseCase debe ejecutarse dentro de una transacción Mongo');
    }

    const numero = await this.numeradorRepository.getNext({
      puntoVenta: params.puntoVenta,
      tipo: params.tipo,
      letra: params.letra,
    }, { session });

    return { numero };
  }
}





