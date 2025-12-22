import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INumeradorFiscalRepository } from '../../../../application/ports/numerador-fiscal.repository.interface';
import { TipoComprobanteFiscal } from '../../../../domain/enums/tipo-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../../domain/enums/letra-comprobante.enum';
import { NumeradorFiscalMongo, NumeradorFiscalDocument } from '../schemas/numerador-fiscal.schema';

@Injectable()
export class NumeradorFiscalRepository implements INumeradorFiscalRepository {
  constructor(
    @InjectModel(NumeradorFiscalMongo.name)
    private readonly model: Model<NumeradorFiscalDocument>,
  ) {}

  async getNext(params: {
    puntoVenta: number;
    tipo: TipoComprobanteFiscal;
    letra: LetraComprobante;
  }, options: { session: any }): Promise<number> {
    const session = options?.session;
    if (!session) {
      throw new Error('NumeradorFiscalRepository.getNext requiere session (transacción obligatoria)');
    }

    // Operación atómica + upsert => concurrencia segura
    const updated = await this.model.findOneAndUpdate(
      { puntoVenta: params.puntoVenta, tipo: params.tipo, letra: params.letra },
      {
        $inc: { ultimoNumero: 1 },
        $setOnInsert: {
          puntoVenta: params.puntoVenta,
          tipo: params.tipo,
          letra: params.letra,
          ultimoNumero: 0,
        },
      },
      { new: true, upsert: true, session },
    ).exec();

    if (!updated) {
      throw new Error('No se pudo obtener el siguiente número fiscal');
    }
    return updated.ultimoNumero;
  }
}





