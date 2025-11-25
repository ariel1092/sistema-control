import { DetalleRemito } from '../../../../domain/entities/detalle-remito.entity';
import { DetalleRemitoMongo, DetalleRemitoDocument } from '../schemas/detalle-remito.schema';
import { Types } from 'mongoose';

export class DetalleRemitoMapper {
  static toDomain(detalleDoc: DetalleRemitoDocument, remitoId?: string): DetalleRemito {
    if (!detalleDoc) return null;

    return new DetalleRemito(
      detalleDoc._id.toString(),
      remitoId || detalleDoc.remitoId.toString(),
      detalleDoc.productoId?.toString(),
      detalleDoc.codigoProducto,
      detalleDoc.nombreProducto,
      detalleDoc.cantidad,
      detalleDoc.precioUnitario,
      detalleDoc.observaciones,
      (detalleDoc as any).createdAt || new Date(),
    );
  }

  static toPersistence(detalle: DetalleRemito, remitoId: string): Partial<DetalleRemitoMongo> {
    const doc: any = {
      remitoId: new Types.ObjectId(remitoId),
      codigoProducto: detalle.codigoProducto,
      nombreProducto: detalle.nombreProducto,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      observaciones: detalle.observaciones,
    };

    if (detalle.productoId) {
      doc.productoId = new Types.ObjectId(detalle.productoId);
    }

    if (detalle.id) {
      (doc as any)._id = new Types.ObjectId(detalle.id);
    }

    return doc;
  }
}


