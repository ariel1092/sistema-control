import { Types } from 'mongoose';
import { MovimientoVentaMongo } from '../schemas/movimiento-venta.schema';
import { MovimientoVenta } from '../../../../domain/entities/movimiento-venta.entity';
import { TipoEventoVenta } from '../../../../domain/enums/tipo-evento-venta.enum';

export class MovimientoVentaMapper {
  static toDomain(doc: MovimientoVentaMongo & { _id?: Types.ObjectId }): MovimientoVenta {
    if (!doc) return null as any;

    return new MovimientoVenta(
      doc._id?.toString(),
      doc.ventaId.toString(),
      doc.tipoEvento as TipoEventoVenta,
      doc.fecha,
      doc.usuarioId ? doc.usuarioId.toString() : undefined,
      doc.observaciones,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  static toPersistence(entity: MovimientoVenta): Partial<MovimientoVentaMongo> {
    let ventaId: Types.ObjectId;
    try {
      ventaId = Types.ObjectId.isValid(entity.ventaId)
        ? new Types.ObjectId(entity.ventaId)
        : new Types.ObjectId();
    } catch (error) {
      ventaId = new Types.ObjectId();
    }

    const doc: any = {
      ventaId,
      tipoEvento: entity.tipoEvento,
      fecha: entity.fecha,
      observaciones: entity.observaciones,
    };

    if (entity.usuarioId && Types.ObjectId.isValid(entity.usuarioId)) {
      doc.usuarioId = new Types.ObjectId(entity.usuarioId);
    }

    if (entity.id && Types.ObjectId.isValid(entity.id)) {
      doc._id = new Types.ObjectId(entity.id);
    }

    return doc;
  }
}







