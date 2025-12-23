import { ComprobanteFiscal } from '../../../../domain/entities/comprobante-fiscal.entity';
import { EstadoComprobanteFiscal } from '../../../../domain/enums/estado-comprobante-fiscal.enum';
import { LetraComprobante } from '../../../../domain/enums/letra-comprobante.enum';
import { TipoComprobanteFiscal } from '../../../../domain/enums/tipo-comprobante-fiscal.enum';
import { ComprobanteFiscalMongo } from '../schemas/comprobante-fiscal.schema';

export class ComprobanteFiscalMapper {
  static toDomain(doc: any): ComprobanteFiscal {
    if (!doc) return null;

    return ComprobanteFiscal.rehidratar({
      id: doc._id?.toString() ?? doc.id,
      ventaId: doc.ventaId,
      tipo: doc.tipo as TipoComprobanteFiscal,
      letra: doc.letra as LetraComprobante,
      puntoVenta: doc.puntoVenta,
      numero: doc.numero,
      fechaEmision: doc.fechaEmision,
      estado: doc.estado as EstadoComprobanteFiscal,
      emisor: doc.emisor,
      receptor: doc.receptor,
      items: doc.items,
      totales: doc.totales,
      autorizadoAt: doc.autorizadoAt,
      anuladoAt: doc.anuladoAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: ComprobanteFiscal): Partial<ComprobanteFiscalMongo> & { _id?: any } {
    const doc: any = {
      ventaId: entity.ventaId,
      tipo: entity.tipo,
      letra: entity.letra,
      puntoVenta: entity.puntoVenta,
      numero: entity.numero,
      fechaEmision: entity.fechaEmision,
      estado: entity.estado,
      emisor: entity.emisor,
      receptor: entity.receptor,
      items: entity.items,
      totales: entity.totales,
      autorizadoAt: entity.autorizadoAt,
      anuladoAt: entity.anuladoAt,
    };

    // `_id` se maneja en repositorio (findByIdAndUpdate/create)
    return doc;
  }
}






