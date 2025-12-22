import { Types } from 'mongoose';
import { ConfiguracionRecargos } from '../../../../domain/entities/configuracion-recargos.entity';

export class ConfiguracionRecargosMapper {
  static toDomain(doc: any): ConfiguracionRecargos {
    if (!doc) return null;
    return new ConfiguracionRecargos(
      doc.recargoDebitoPct ?? 0,
      doc.recargoCreditoPct ?? 0,
      doc.updatedBy?.toString(),
      doc.updatedAt,
    );
  }

  static toPersistence(params: {
    recargoDebitoPct: number;
    recargoCreditoPct: number;
    updatedBy?: string;
  }): any {
    const doc: any = {
      recargoDebitoPct: params.recargoDebitoPct,
      recargoCreditoPct: params.recargoCreditoPct,
    };

    if (params.updatedBy) {
      doc.updatedBy = Types.ObjectId.isValid(params.updatedBy)
        ? new Types.ObjectId(params.updatedBy)
        : params.updatedBy;
    }

    return doc;
  }
}


