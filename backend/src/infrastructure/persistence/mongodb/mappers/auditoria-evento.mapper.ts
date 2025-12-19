import { Types } from 'mongoose';
import { AuditoriaEvento } from '../../../../domain/entities/auditoria-evento.entity';
import { AuditoriaEventoMongo } from '../schemas/auditoria-evento.schema';
import { TipoEventoAuditoria } from '../../../../domain/enums/tipo-evento-auditoria.enum';

export class AuditoriaEventoMapper {
  static toDomain(doc: AuditoriaEventoMongo & { _id?: Types.ObjectId }): AuditoriaEvento {
    if (!doc) return null as any;

    return new AuditoriaEvento(
      doc._id?.toString(),
      doc.entidad,
      doc.entidadId,
      doc.evento as TipoEventoAuditoria,
      doc.snapshot,
      doc.metadatos,
      doc.hashIntegridad,
      (doc as any).createdAt,
    );
  }

  static toPersistence(evento: AuditoriaEvento): Partial<AuditoriaEventoMongo> {
    const doc: any = {
      entidad: evento.entidad,
      entidadId: evento.entidadId,
      evento: evento.evento,
      snapshot: evento.snapshot,
      metadatos: evento.metadatos,
      createdAt: evento.createdAt,
    };

    if (evento.id && Types.ObjectId.isValid(evento.id)) {
      doc._id = new Types.ObjectId(evento.id);
    }

    return doc;
  }
}


